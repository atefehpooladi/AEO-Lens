# Context Unlock — Problem, Bottleneck, Solution & Execution

## 1. The Problem

AI answer engines (ChatGPT, Perplexity, Google AI Overviews) are replacing clicks to websites. According to 2026 data:
- 58.5% of Google searches now end without any click
- When an AI Overview is shown, that rises to around 83%
- Even when a brand's content or personal content is quoted inside an AI answer, only about 1% of users click through to the actual source
- There are founders that don't have enough time to manage their marketing and branding
- Making relevant content requires competitive analysis and market sizing, which is slow, manual research
- Solo founders don't have any support from the startup ecosystem for this kind of work

The result: even a brand with a genuinely better product can go completely unmentioned in an AI's answer — not because the content is bad, but because it isn't written in a way a model can cleanly quote. There's no warning or error either; the brand just silently disappears from those conversations. And underneath that, a second, more practical problem: a solo or early-stage founder usually doesn't have a marketing team, an agency, or the hours to research competitors and market size themselves — so the content that *would* be quotable never gets written in the first place.

## 2. The Solution & Why

**Solution:** Context Unlock — a tool with four modes. The first three handle content itself; the fourth handles the research a time-poor founder can't get to:

(a) **Audit** — score existing content for AI-citability
(b) **Draft** — write content from a topic
(c) **Scout** — find a trend or content gap using live web search and draft something grounded in it
(d) **Founder Snapshot** — research real competitors and a real market-size figure, then draft a ready-to-use positioning paragraph from it

All four end with a live "would AI actually quote this?" test, or in Founder Snapshot's case, feed directly into the Audit step so the output is AEO-ready from the start.

**Why Founder Snapshot solves the other three problems:**
- **No time** → the research (competitors, market size) that would normally take a founder an afternoon happens in one tool call
- **No competitive/market content** → the output *is* that content, already drafted
- **No ecosystem support** → this replaces the kind of research an agency, mentor, or co-founder would normally do, at zero cost and on demand

## 3. Step-by-Step Execution

### Step 0 — Setup

**Frontend**
- React, single-page prototype
- Visual style: **Neo-Brutalism paired with a Bento Box card structure** — crisp dark borders, high-contrast flat surfaces, intentional asymmetric accents
- Color palette: deep slate or off-white background, with one vibrant high-energy accent (electric indigo or vivid teal) plus functional warning/success tags
- Typography: clean geometric sans-serif (Inter or Plus Jakarta Sans), with distinct weight jumps for rapid hierarchy scanning
- Layout as a Bento grid: each mode (Audit / Draft / Scout / Founder Snapshot) and each result block (scorecard, rewrite, sources, citation test) gets its own bordered card of varying size, rather than one long scrolling column — this is what makes a Bento layout read as high-density but still scannable

**Backend**
Use Python with it's latest library.

**Database**
- Keep it simple: no database — a local JSON file is enough for an MVP (e.g. storing past audits/snapshots if you want a history view)
- This is a prototype/MVP, not a production build — optimize for demo-ability over robustness

**Environment & API keys**
- API key is stored in a `.env` file, never committed to the repo
- If someone accesses this project through the repo, ask them to add their own Codex API key
- If `.env` doesn't exist when someone clones the repo, create it and add the key there — never hardcode a key directly in source files
- When using the CODEX API, use model **GPT-6 Astra** with **High** effort

**Suggested project structure**
```
/src
  /components   → one component per Bento card (ProfileCard, ScoreCard, RewriteCard,
                  SourcesCard, SnapshotCard, ReviewPublishCard...)
  /lib          → API call helpers, JSON parsing/extraction helpers,
                  session profile state (in-memory only, not persisted),
                  voice transcription helper, file/PDF text extraction helper
  /prompts      → the system prompts for each mode, kept as separate constants
.env            → API key (gitignored)
data/           → local JSON file(s) for any saved history
```

**Quick start**
1. Clone the repo
2. Create `.env` and add your API key
3. `npm install`
4. `npm run dev`

### Step 1 — Build the user profile (prerequisite for every mode)

Nothing else can run well without this — it's what tells the tool *which industry to research* and *whose voice to write in*. The profile is **session-only**: held in memory (React state, or the JSON file for the session's duration), not in a database or user account. Refreshing clears it.

**The profile answers four questions:**
1. What do you want to do today — which functionality? (Audit / Draft / Scout / Founder Snapshot)
2. What is your business?
3. What audience are you targeting?
4. What kind of content should be created?

**Three ways to fill it — the user picks one:**
- **Voice** — record and transcribe, then extract the four fields from the transcript
- **File upload** — a text file or PDF (e.g. an existing About page, pitch deck text, or CV), extract the fields from its text
- **Typing** — a plain form, as the always-available fallback

**Extraction prompt (used for both voice transcripts and uploaded file text):**
```
Extract a user profile from the text below. The text may be a spoken
transcript (so it can be rambling, out of order, or contain filler) or
extracted document text.

Fill these four fields:
- functionality: which of audit / draft / scout / snapshot they want.
  If unclear, return null.
- business: what their business or project is
- audience: who they are targeting
- content_goal: what kind of content they want created
- differentiator: what makes them different, if mentioned (optional)

Only use what is actually stated. Do NOT invent, infer, or fill in
plausible-sounding details. If a field isn't covered in the text, return
null for it so the interface can ask the user directly.

Respond with ONLY valid JSON, no markdown fences, no other text:
{"functionality":"...","business":"...","audience":"...",
"content_goal":"...","differentiator":"...","missing":["list any fields
you returned null for"]}
```

**Rule:** always show the extracted profile back to the user for confirmation before running anything. Voice transcription and document extraction both make mistakes, and every later step inherits those mistakes silently. Any field returned in `missing` gets asked directly in the form.

Once confirmed, the profile auto-fills the `brand`, `audience`, and `differentiator` fields used across all four modes — the user sets context once per session, not once per tool run.

### Step 2 — Audit (score existing content)
5 scoring criteria (1-5 each):
- **Direct Answer** — does the opening directly answer the core question?
- **Self-Contained Sentences** — is each sentence quotable alone, without needing the sentence before it?
- **Clear Structure** — short paragraphs, scannable structure?
- **Explicit Naming** — does it name the brand directly, instead of a vague pronoun?
- **Fact Density** — concrete numbers/facts, or vague claims?

**Rewrite loop (for the paste-your-content approach):**
If any criterion scores below 5, rewrite and re-score, feeding the previous scores and reasons back in so each pass fixes what specifically failed.

Loop rules — these matter, or the demo hangs:
- **Max 3 passes.** Stop there and show the best version, even if it isn't a perfect 5/5
- **Stop early if the score doesn't improve** between two passes — it's plateaued, more passes just burn time
- **Show each pass** in the UI (pass 1 → 4.2, pass 2 → 4.8), because watching the score climb is the most convincing thing in the whole demo
- A perfect 5/5 is not always achievable — a very short post may never hit high Fact Density. Say that plainly rather than looping forever

### Step 3 — Finding Trends Topic in the Industry

Uses the industry/audience from the Step 1 profile as its scope.

**Search rule:** run at least 3 separate searches, from 3 angles:
1. what the audience is currently asking about / worried about (recent, not evergreen)
2. what competitors have recently posted or announced
3. any recent news, report, or statistic relevant to the industry/audience

**Checklist for a genuine trend:**
- **Recent** — from the last few weeks/months, not an evergreen fact
- **Confirmed** — either multiple sources, or one specific, verifiable event/stat
- **Specific** — relevant to this exact audience/industry, not generic advice
- **A genuine gap** — something the audience cares about that competitors aren't covering well

**Source-of-truth rule:** every claim about a trend or gap must be traceable to a real source actually found — name the publication/site and the date. If no real source can be named, don't present it as a confirmed trend.

System prompt:
```
You are a content strategist doing real research, not guessing at "content ideas."

Research process — do this before answering:
1. Run at least 3 separate searches, each from a different angle:
   - what this audience is currently asking, worried about, or discussing
     (recent, not evergreen advice)
   - what competing or similar brands have posted or announced recently
   - any recent news, report, statistic, or event relevant to this
     industry or audience
2. Only treat something as a real trend or gap if it passes this checklist:
   - Recent: from the last few weeks or months, not an old evergreen
     fact — check dates
   - Confirmed: shows up in more than one source, OR is a specific,
     verifiable recent event or stat
   - Specific: relevant to this exact audience/industry, not generic
     business advice that applies to anyone
   - A genuine gap: something the audience clearly cares about that
     competitors are NOT already covering well

Every claim about a trend or gap must be traceable to a real source you
actually found — name the publication/site and the date. If you cannot
name a specific real source for something, do not present it as a
confirmed trend; say so plainly instead.

Brand: {brand}
Industry / audience: {audience}
What makes this brand different: {differentiator}

Respond with ONLY valid JSON, no markdown fences, no other text, in
exactly this shape:
{"gap_summary":"...","sources":[{"name":"...","date":"...","note":"..."}],
"article":{"title":"...","body":"...","why_now":"...","signal":"name the
specific source this is based on"},"more_ideas":[{"title":"...",
"angle":"...","signal":"..."}]}
```

### Step 4 — Founder & Market Snapshot

This step exists specifically for the "solo founder with no time and no ecosystem support" problem. It replaces the research an agency or co-founder would normally do.

**5 criteria for a usable snapshot:**
- **Named Competitors** — real, specific companies, not a vague "competitors in this space"
- **Cited Market Size** — a real number from a real source, never an invented or estimated figure
- **Clear Differentiation** — states specifically what's different, not generic claims like "better" or "faster"
- **Founder-Ready Format** — short enough to paste directly into a deck or About page as-is
- **Source-Backed** — every factual claim traceable to a named source, same transparency rule as Step 3

System prompt:
```
You are a startup analyst helping a time-poor solo founder get
competitive and market context they don't have time to research
themselves.

Given a short description of the startup and its target market:
1. Search for real, named competitors or close alternatives — companies
   actually addressing a similar problem
2. Search for a real, citable market-size figure (industry report,
   market research firm, credible news source) — do not estimate or
   invent a number
3. Identify the clearest, most specific way this startup differs from
   what you found — avoid generic claims like "better" or "faster"

Every factual claim (a competitor's positioning, a market size number)
must be traceable to a real source you found — name the publication/site
and the date. If you can't find a real source for a market size, say so
plainly instead of estimating one.

Startup: {startup_description}
Target market / audience: {target_market}

Respond with ONLY valid JSON, no markdown fences, no other text, in
exactly this shape:
{"competitors":[{"name":"...","how_they_position":"...","source":"..."}],
"market_size":{"figure":"...","source_name":"...","source_date":"...",
"caveat":"optional — note if this is a proxy/adjacent market, not exact"},
"differentiation":"one clear, specific sentence on how this startup
differs","positioning_draft":"a ready-to-use 2-4 sentence paragraph
combining the above, suitable for a pitch deck or About page"}
```

The `positioning_draft` this produces is meant to be fed straight into **Step 2 (Audit)**, so a founder goes from "no content, no time" to an AEO-ready paragraph in two tool calls.

### Step 5 — Citation Test

```
Answer the question in 2-3 sentences, using ONLY the provided source text
as your knowledge. If the source text answers the question, end your
reply with a new line "Quoted: " followed by the exact sentence you drew
on, in quotes. If the source text does not answer the question, say so
plainly instead of guessing.
```

Run once with the original text, once with the rewritten text, and compare the two side by side.

### Step 6 — Highlighting (technical mechanism)
Take the quote strings the model returned in Step 2, find them in the original text via string search, and wrap them in a colored tag. If a quote doesn't match exactly, skip it silently instead of crashing the page.

### Step 7 — Review & Publish

The final output is always shown to the user for review before anything leaves the tool. Nothing publishes automatically without that confirmation click — this is both a product decision and a safety one.

**The review card shows:**
- The final text, editable inline
- The score it reached, and how many rewrite passes it took
- The sources behind any factual claims
- Buttons: **Copy**, **Download**, **Publish**

**Be realistic about "click send and it posts automatically":**
Direct posting to LinkedIn needs OAuth and an approved app through LinkedIn's Marketing API — an approval process that takes far longer than a hackathon. Three options, in order of how realistic they are for the demo:

1. **Copy to clipboard + deep link** *(recommended for the hackathon)* — copies the final text and opens LinkedIn's composer in a new tab. One click, no OAuth, works live on stage. The user pastes and hits post
2. **Webhook / Zapier or n8n** — the tool POSTs the final text to a webhook, and an automation platform that already holds the user's social credentials handles the actual posting. Genuinely automatic, but needs setup beforehand
3. **Full native OAuth integration** — the real product path, not a hackathon path. Mention it as the roadmap, don't try to build it

**One more thing worth saying in the pitch:** LinkedIn now limits the reach of content its systems judge to be generic or AI-generated with little human involvement, and from 2 August 2026 the EU AI Act requires disclosure for AI-generated content depicting real people. This is an argument *for* the tool's design, not against it — Context Unlock keeps a human in the loop at every step: the profile is confirmed, the draft is reviewed, the publish is clicked.

## 4. Tool Workflow — Two Entry Paths

Both paths use the same engine underneath; they differ only in where the content comes from.

### Path A — "I'll tell you what I need" (voice-first)

1. User records a voice note describing themselves and what they need
2. Transcribe → extract the four profile fields (Step 1)
3. **Show the extracted profile for confirmation**, ask for anything missing
4. Route to the right mode based on `functionality`:
   - wants content ideas → **Scout** (Step 3)
   - wants a draft on a known topic → **Draft**
   - wants competitor/market context → **Founder Snapshot** (Step 4)
   - if `functionality` is null → ask the user which one, don't guess
5. Run the mode → **Audit** the output (Step 2) → **rewrite loop** until 5/5 or 3 passes
6. **Review & Publish** (Step 7)

### Path B — "Here's my content, score it" (paste-first)

1. User pastes existing content
2. Profile still required — by voice, file/PDF upload, or typing (Step 1)
3. **Audit** (Step 2) → **rewrite loop** until 5/5 or 3 passes
4. **Citation test** (Step 5) — original vs. rewritten, side by side
5. **Review & Publish** (Step 7)

## 5. Team Split
- One person: prompts and the scoring/rewriting logic
- One person: the UI (Bento layout, profile card, results cards)
- One person: voice/file input + the citation test and highlighting
- Ati: pitch narrative and concept

## 6. Demo Risks & Fallbacks
- Keep one **pre-run example** ready in case a live call fails or is slow in front of judges
- If JSON parsing fails, show the raw text instead of crashing the page
- **Voice is the riskiest live component** — a noisy room breaks transcription. Have a pre-recorded audio file ready, and always keep the typing fallback visible
- Cap the rewrite loop at 3 passes so the demo never hangs waiting for a perfect score
- If a judge asks "how do you know this is actually trending?", be upfront that the model judges recency from search results itself and isn't 100% reliable — a known limitation, not something to hide