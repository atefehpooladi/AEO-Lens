"""Local API for Context Unlock. API keys remain on the local machine."""
from __future__ import annotations
import base64, json, os, uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).parent
BRAND_PROFILE = (ROOT / "brand_profile.md").read_text(encoding="utf-8")
AEO_RULES = "(1) opening gives a direct answer, (2) sentences stand alone when quoted, (3) short scannable structure, (4) explicitly name NordGlow, (5) only concrete facts supplied in the brand profile."
TREND_SOURCE_DOMAINS = {
    "allure.com", "byrdie.com", "newbeauty.com", "whowhatwear.com", "vogue.com",
    "refinery29.com", "instyle.com", "glamour.com", "elle.com", "aad.org",
}
TREND_CACHE = ROOT / ".trend_cache.json"

def load_local_env():
    env = ROOT / ".env"
    if env.exists():
        for raw in env.read_text(encoding="utf-8").splitlines():
            if "=" in raw and not raw.lstrip().startswith("#"):
                key, value = raw.split("=", 1); os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))

def response_text(payload):
    return "".join(part.get("text", "") for item in payload.get("output", []) if item.get("type") == "message" for part in item.get("content", []) if part.get("type") == "output_text")

def call_llm(instructions, user_input, web_search=False):
    key = os.environ.get("OPENAI_API_KEY") or os.environ.get("CODEX_API_KEY")
    if not key: raise RuntimeError("No API key found. Add OPENAI_API_KEY to .env, then restart the local API server.")
    body = {"model": os.environ.get("CODEX_MODEL", "gpt-4.1-mini"), "instructions": instructions, "input": user_input, "store": False}
    if web_search: body["tools"] = [{"type": "web_search_preview"}]
    req = Request("https://api.openai.com/v1/responses", data=json.dumps(body).encode(), headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, method="POST")
    try:
        with urlopen(req, timeout=90) as reply: return response_text(json.loads(reply.read().decode()))
    except HTTPError as error: raise RuntimeError(f"OpenAI request failed ({error.code}): {error.read().decode('utf-8', 'replace')[:400]}") from error
    except URLError as error: raise RuntimeError("Could not reach the OpenAI API. Check your connection and try again.") from error

def create_validated_content(task):
    """Generate and independently validate; max three attempts and always retain a best draft."""
    draft, best, best_score = "", "", -1
    writer = f"""Write precise, publish-ready Markdown for this fictional skincare demo brand.\n{BRAND_PROFILE}\n\nMeet every requirement: {AEO_RULES} Never invent facts or medical claims. Return only content."""
    for attempt in range(3):
        prompt = task if not draft else f"Improve this draft after independent validation failed. Preserve intent, repair every weak criterion, return only the new content:\n\n{draft}"
        draft = call_llm(writer, prompt)
        verifier = f"""Independently validate this candidate. Return JSON only with score (0-5), summary, accurate (boolean). One point for each requirement: {AEO_RULES}. accurate is true only if the summary represents NordGlow correctly and has no unsupported claim.\nBrand profile:\n{BRAND_PROFILE}"""
        check_raw = call_llm(verifier, draft)
        try: check = json.loads(check_raw[check_raw.find("{"):check_raw.rfind("}")+1])
        except Exception: check = {"score": 0, "accurate": False}
        try: score = int(check.get("score", 0))
        except (TypeError, ValueError): score = 0
        plateau = attempt > 0 and score <= best_score
        if score > best_score: best, best_score = draft, score
        if score == 5 and check.get("accurate") is True: return {"content": draft, "validated": True}
        if plateau: break
    return {"content": best or draft, "validated": False}

def transcribe(audio_b64, filename, mime_type):
    """Transcribe a browser voice note with OpenAI."""
    key = os.environ.get("OPENAI_API_KEY") or os.environ.get("CODEX_API_KEY")
    if not key: raise RuntimeError("No OpenAI API key found. Add OPENAI_API_KEY to .env, then restart the local API server.")
    audio = base64.b64decode(audio_b64)
    boundary = f"----ContextUnlock{uuid.uuid4().hex}"
    safe_filename = Path(filename).name.replace('"', "") or "voice.webm"
    body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="model"\r\n\r\n'
        "gpt-4o-mini-transcribe\r\n"
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="prompt"\r\n\r\n'
        "The recording may mention NordGlow, niacinamide, ceramides, squalane, and panthenol.\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{safe_filename}"\r\n'
        f"Content-Type: {mime_type or 'audio/webm'}\r\n\r\n"
    ).encode() + audio + f"\r\n--{boundary}--\r\n".encode()
    request = Request(
        "https://api.openai.com/v1/audio/transcriptions",
        data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=90) as reply: result = json.loads(reply.read().decode())
        text = result.get("text", "")
        if not text: raise RuntimeError("OpenAI returned no transcript.")
        return text
    except HTTPError as error:
        detail = error.read().decode("utf-8", "replace")
        raise RuntimeError(f"OpenAI transcription failed ({error.code}): {detail[:400]}") from error
    except URLError as error:
        raise RuntimeError("Could not reach OpenAI transcription. Check your connection and OpenAI API key.") from error

def json_object(raw):
    try: return json.loads(raw[raw.find("{"):raw.rfind("}") + 1])
    except Exception: return None

def source_is_allowed(url):
    host = urlparse(url).netloc.lower().removeprefix("www.")
    return any(host == domain or host.endswith("." + domain) for domain in TREND_SOURCE_DOMAINS)

def scan_source(domain):
    prompt = f'''Search only site:{domain} for one skincare article published in the last six months. Return JSON only: {{"publisher":"...","url":"https://...","published":"YYYY-MM-DD","title":"...","summary":"one sentence"}}. The URL must be a direct article, the date must be visible on the page, and the article must discuss skincare. Return {{}} if none qualifies. Never guess a date or URL.'''
    item = json_object(call_llm(prompt, "Find the newest qualifying article.", True)) or {}
    try: recent = date.fromisoformat(item.get("published", "")) >= date.today() - timedelta(days=183)
    except ValueError: recent = False
    return item if item.get("url") and source_is_allowed(item["url"]) and recent else None

def cached_trends():
    try: return json.loads(TREND_CACHE.read_text(encoding="utf-8"))
    except (OSError, ValueError): return None

def verified_trends():
    """Collect real source candidates first, then use the model only to group those candidates."""
    articles = []
    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = [pool.submit(scan_source, domain) for domain in TREND_SOURCE_DOMAINS]
        for future in as_completed(futures):
            try:
                article = future.result()
                if article: articles.append(article)
            except RuntimeError:
                pass
    if len(articles) >= 3:
        grouped = json_object(call_llm('''Group the supplied skincare articles into no more than 3 useful category signals for NordGlow. Return JSON only: {"topics":[{"title":"...","why":"...","source_urls":["https://...","https://...","https://..."]}]}. A topic needs at least 3 different URLs. Use only the exact URLs supplied; do not add sources or claims.''', json.dumps(articles))) or {}
        index, accepted = {article["url"]: article for article in articles}, []
        for topic in grouped.get("topics", []):
            urls = list(dict.fromkeys(topic.get("source_urls", [])))
            if len(urls) < 3 or not all(url in index for url in urls): continue
            sources = [{key: index[url][key] for key in ("publisher", "url", "published")} | {"type": "tracked source"} for url in urls]
            accepted.append({"title": topic.get("title", "Skincare category signal"), "why": topic.get("why", "A repeated theme across trusted skincare coverage."), "sources": sources, "evidence": "Verified trend" if len(urls) >= 5 else "Emerging signal"})
        if accepted:
            payload = {"topics": accepted, "searched_through": date.today().isoformat(), "cached": False}
            TREND_CACHE.write_text(json.dumps(payload), encoding="utf-8")
            return payload
    cache = cached_trends()
    if cache:
        cache["cached"] = True
        return cache
    return {"topics": [], "searched_through": date.today().isoformat(), "cached": False}

class Handler(BaseHTTPRequestHandler):
    def send_json(self, status, data):
        encoded = json.dumps(data).encode(); self.send_response(status); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(encoded)))
        origin = self.headers.get("Origin", "")
        if origin in {"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:4173", "http://127.0.0.1:4173"}: self.send_header("Access-Control-Allow-Origin", origin)
        self.end_headers(); self.wfile.write(encoded)
    def do_OPTIONS(self): self.send_json(204, {})
    def do_GET(self): self.send_json(200, {"ok": True, "key_configured": bool(os.environ.get("OPENAI_API_KEY") or os.environ.get("CODEX_API_KEY"))}) if self.path == "/health" else self.send_json(404, {"error": "Not found"})
    def do_POST(self):
        try:
            body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))).decode())
            if self.path == "/api/audit": result = create_validated_content(f"Rewrite this existing content into a complete AEO-ready version. Keep its useful intent, but correct vague language and unsupported claims.\n\n{body['content']}")
            elif self.path == "/api/trends": self.send_json(200, verified_trends()); return
            elif self.path == "/api/create": result = create_validated_content(f"Write a complete {body['format']} about this trend: {body['topic']}. Include a direct answer in the opening and use NordGlow facts only where relevant.")
            elif self.path == "/api/transcribe": self.send_json(200, {"text": transcribe(body["audio"], body.get("filename", "voice.webm"), body.get("mime_type", "audio/webm"))}); return
            else: self.send_json(404, {"error": "Not found"}); return
            self.send_json(200, result)
        except (KeyError, ValueError) as error: self.send_json(400, {"error": f"Invalid request: {error}"})
        except RuntimeError as error: self.send_json(502, {"error": str(error)})
        except Exception as error: self.send_json(500, {"error": str(error)})
    def log_message(self, format, *args): print("[Context Unlock]", format % args)

if __name__ == "__main__":
    load_local_env(); print("Context Unlock API listening at http://127.0.0.1:8000"); ThreadingHTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
