"""Local ContextUnlock API. Keeps the API key on the machine, never in React."""
from __future__ import annotations

import json
import os
import base64
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).parent


def load_local_env() -> None:
    env_file = ROOT / ".env"
    if not env_file.exists():
        return
    for raw in env_file.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def response_text(payload: dict) -> str:
    return "".join(
        part.get("text", "")
        for item in payload.get("output", [])
        if item.get("type") == "message"
        for part in item.get("content", [])
        if part.get("type") == "output_text"
    )


def call_responses(instructions: str, user_input: str, web_search: bool = False) -> dict:
    key = os.environ.get("OPENAI_API_KEY") or os.environ.get("CODEX_API_KEY")
    if not key:
        raise RuntimeError("No API key found. Add OPENAI_API_KEY to .env, then restart the local API server.")
    body = {
        "model": os.environ.get("CODEX_MODEL", "gpt-6-astra"),
        "instructions": instructions,
        "input": user_input,
        "store": False,
    }
    if web_search:
        body["tools"] = [{"type": "web_search_preview"}]
        body["include"] = ["web_search_call.action.sources"]
    request = Request(
        "https://api.openai.com/v1/responses",
        data=json.dumps(body).encode("utf-8"),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=90) as reply:
            data = json.loads(reply.read().decode("utf-8"))
    except HTTPError as error:
        detail = error.read().decode("utf-8", "replace")
        raise RuntimeError(f"OpenAI request failed ({error.code}): {detail[:500]}") from error
    except URLError as error:
        raise RuntimeError("Could not reach the OpenAI API. Check your connection and try again.") from error
    return {"text": response_text(data), "sources": data.get("output", [])}


def call_transcription(audio_b64: str, filename: str, mime_type: str) -> str:
    key = os.environ.get("OPENAI_API_KEY") or os.environ.get("CODEX_API_KEY")
    if not key:
        raise RuntimeError("No API key found. Add OPENAI_API_KEY to .env, then restart the local API server.")
    boundary = "----ContextUnlockAudioBoundary"
    audio = base64.b64decode(audio_b64)
    body = b"".join([
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"model\"\r\n\r\ngpt-4o-mini-transcribe\r\n".encode(),
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{filename}\"\r\nContent-Type: {mime_type}\r\n\r\n".encode(),
        audio,
        f"\r\n--{boundary}--\r\n".encode(),
    ])
    request = Request(
        "https://api.openai.com/v1/audio/transcriptions", data=body,
        headers={"Authorization": f"Bearer {key}", "Content-Type": f"multipart/form-data; boundary={boundary}"}, method="POST",
    )
    try:
        with urlopen(request, timeout=90) as reply:
            return json.loads(reply.read().decode("utf-8")).get("text", "")
    except HTTPError as error:
        detail = error.read().decode("utf-8", "replace")
        raise RuntimeError(f"Transcription failed ({error.code}): {detail[:500]}") from error
    except URLError as error:
        raise RuntimeError("Could not reach the transcription service. Check your connection and try again.") from error


class Handler(BaseHTTPRequestHandler):
    def send_json(self, status: int, data: dict) -> None:
        encoded = json.dumps(data).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        origin = self.headers.get("Origin", "")
        if origin in {"http://127.0.0.1:5173", "http://localhost:5173"}:
            self.send_header("Access-Control-Allow-Origin", origin)
        self.end_headers()
        self.wfile.write(encoded)

    def do_OPTIONS(self):
        self.send_response(204)
        origin = self.headers.get("Origin", "")
        if origin in {"http://127.0.0.1:5173", "http://localhost:5173"}:
            self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            return self.send_json(200, {"ok": True, "key_configured": bool(os.environ.get("OPENAI_API_KEY") or os.environ.get("CODEX_API_KEY"))})
        self.send_json(404, {"error": "Not found"})

    def do_POST(self):
        if self.path not in {"/api/generate", "/api/transcribe"}:
            return self.send_json(404, {"error": "Not found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            if self.path == "/api/transcribe":
                text = call_transcription(body["audio"], body.get("filename", "voice.webm"), body.get("mime_type", "audio/webm"))
                self.send_json(200, {"text": text})
            else:
                result = call_responses(body["instructions"], body["input"], bool(body.get("web_search")))
                self.send_json(200, result)
        except (KeyError, ValueError) as error:
            self.send_json(400, {"error": f"Invalid request: {error}"})
        except RuntimeError as error:
            self.send_json(502, {"error": str(error)})

    def log_message(self, format, *args):
        print("[ContextUnlock API]", format % args)


if __name__ == "__main__":
    load_local_env()
    print("ContextUnlock API listening at http://127.0.0.1:8000")
    ThreadingHTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
