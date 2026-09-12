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

(a) **Audit** — score existing content for AI-citability, if it is not good enough rewrite it with all ruls for AEO
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
# Frontend Spec — Context Unlock
 
Drop-in replacement for the **Frontend** subsection of Step 0 — Setup.
 
## Stack
 
| Layer | Choice | Why |
|---|---|---|
| Build tool | **Vite** | Fastest dev server, instant HMR, zero config for a one-day build |
| Framework | **React 19** | Current stable; no more `forwardRef` boilerplate |
| Styling | **Tailwind CSS v4** | Config now lives in CSS via `@theme` — no `tailwind.config.js` to maintain |
| Components | **shadcn/ui** (new-york style) | Copy-paste components you own outright, no hidden abstractions. Fully supports React 19 + Tailwind v4 |
| Icons | **lucide-react** | Ships with shadcn, consistent stroke weight |
| Animation | **motion** (formerly framer-motion) | Score bars counting up and cards entering is what makes the demo feel alive |
| Toasts | **sonner** | shadcn deprecated its own toast component in favor of this |
| Markdown | **react-markdown** | For rendering drafted article output cleanly |
 
## Install
 
```bash
npm create vite@latest context-unlock -- --template react
cd context-unlock
npm install
npm install tailwindcss @tailwindcss/vite
npx shadcn@latest init
npx shadcn@latest add button card textarea input tabs badge progress skeleton sonner separator tooltip
npm install motion lucide-react react-markdown
```
 
**`vite.config.js`** — note Tailwind v4 is a Vite plugin now, not a PostCSS step:
 
```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
 
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```
 
**`src/index.css`** — one import replaces the old three `@tailwind` directives:
 
```css
@import "tailwindcss";
```
 
## Design direction
 
**Neo-Brutalism + Bento Box.** The tension to hold: brutalism gives it personality, bento keeps it readable at high density. Brutalism without restraint reads as broken, not bold.
 
**Theme tokens** — define once in `index.css` under `@theme`, use everywhere:
 
```css
@theme {
  --color-ink: oklch(0.18 0.02 260);      /* near-black, borders and text */
  --color-surface: oklch(0.98 0.005 260); /* off-white card background */
  --color-canvas: oklch(0.94 0.01 260);   /* page background, one step darker */
  --color-accent: oklch(0.58 0.22 275);   /* electric indigo — primary actions */
  --color-accent-2: oklch(0.72 0.15 195); /* vivid teal — scores, success */
  --color-warn: oklch(0.75 0.17 70);      /* amber — low scores, warnings */
  --radius: 0.75rem;
}
```
 
Tailwind v4 generates `bg-accent`, `border-ink`, `text-accent-2` etc. from these automatically.
 
**The brutalist card recipe** — one utility class, reused on every card:
 
```css
@layer components {
  .card-brut {
    @apply bg-surface border-2 border-ink rounded-[var(--radius)]
           shadow-[4px_4px_0_0_var(--color-ink)];
  }
  .card-brut-accent {
    @apply bg-surface border-2 border-ink rounded-[var(--radius)]
           shadow-[4px_4px_0_0_var(--color-accent)];
  }
}
```
 
The hard offset shadow (no blur) is what reads as neo-brutalist. Use `card-brut-accent` sparingly — only on the card holding the current result, so the eye lands there first.
 
**Typography** — Plus Jakarta Sans via Google Fonts (`400` body, `800` headings). Big weight jumps, not size jumps, carry the hierarchy: an `800` at 20px outranks a `400` at 24px visually and keeps the layout tight.
 
## Bento layout
 
Not one scrolling column. A 12-column CSS grid where cards claim different spans:
 
```
┌─────────────────────┬───────────┐
│  Profile (col 8)    │ Mode      │
│                     │ picker    │
│                     │ (col 4)   │
├──────────┬──────────┴───────────┤
│ Score    │  Rewritten text      │
│ (col 4)  │  (col 8)             │
├──────────┴──────────┬───────────┤
│ Citation test       │ Sources   │
│ (col 8)             │ (col 4)   │
└─────────────────────┴───────────┘
```
 
```jsx
<div className="grid grid-cols-1 md:grid-cols-12 gap-4">
  <div className="md:col-span-8 card-brut p-5">…</div>
  <div className="md:col-span-4 card-brut p-5">…</div>
</div>
```
 
Every card collapses to `col-span-12` on mobile. Test this — judges may look at it on a phone.
 
## Motion
 
Keep it minimal and purposeful. Three animations total:
 
1. **Cards enter** as results arrive — fade + 8px rise, staggered 60ms apart
2. **Score bars fill** from 0 to their value over ~600ms — this is the moment that sells the demo
3. **Rewrite pass transition** — when the score climbs from pass 1 to pass 2, animate the number counting up rather than swapping it instantly
```jsx
import { motion } from "motion/react";
 
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: index * 0.06 }}
  className="card-brut p-5"
/>
```
 
No parallax, no scroll-triggered effects, no page transitions. They eat build time and add nothing on stage.
 
## States that must exist
 
Easy to skip under time pressure, and the first thing that breaks in a live demo:
 
- **Loading** — per-card `<Skeleton />`, never a full-page spinner. The user should see the scorecard building while the citation test is still running
- **Streaming** — show partial results as each API call returns, rather than blocking the whole UI until all calls finish
- **Error** — a `sonner` toast plus an inline retry button on the affected card only. One failed call shouldn't blank the screen
- **Empty** — before the first run, the result cards show a one-line hint of what will appear there, not blank boxes
## Component map
 
```
/src/components
  ProfileCard.jsx        → voice / upload / type input, editable confirmation
  ModePicker.jsx         → Audit / Draft / Scout / Snapshot tabs
  ScoreCard.jsx          → 5 criteria bars + average, animated
  RewritePassBar.jsx     → shows pass 1 → 2 → 3 score progression
  HighlightedText.jsx    → original text with flagged spans marked
  RewriteCard.jsx        → optimized output, editable
  SourcesCard.jsx        → named sources with dates
  CitationTestCard.jsx   → original vs rewritten, side by side
  SnapshotCard.jsx       → competitors, market size, positioning draft
  ReviewPublishCard.jsx  → final text + copy / download / publish
```
 
## Two things that will bite you
 
- **Tailwind v4 with shadcn is not the same as v3.** If you follow a v3 tutorial you'll hit CSS-variable format changes and HSL→OKLCH conversion. Start a fresh v4 project rather than migrating anything — it is genuinely faster.
- **Don't build a component library.** Nine cards, one shared `.card-brut` class, done. Abstracting early is the most common way a hackathon frontend eats the whole day.
 

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

### General Rules:
- Don't share any API keys and alos don't put it on the code
- Selef check log errors follow the style
- Never guess always stay with real data and reasoning based on the inputs and extracted data and the ruls and structurs that we already defined in this file