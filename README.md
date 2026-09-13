# Context Unlock

Context Unlock is a prototype AEO writing tool for **NordGlow**, a fictional skincare brand. It helps turn existing content or a timely skincare signal into clear, evidence-aware content that is easier for answer engines to quote.

NordGlow’s profile is included in [`brand_profile.md`](brand_profile.md), so there is no business-onboarding flow.

## Features

### Audit & Auto-Improve

- Paste existing content or record a voice note.
- Voice notes are transcribed through the local API. When a key detail is missing, the UI asks a click-first follow-up question.
- The server rewrites content against five AEO criteria:
  1. Direct answer
  2. Self-contained sentences
  3. Clear structure
  4. Explicit NordGlow naming
  5. Fact density
- Every draft is independently validated by a second LLM call that summarizes and quotes it.
- Generation/validation stops after three attempts or when it plateaus. Internal passes and scores stay private; the user receives only the final editable result.

### Trend → Content

- Scans a tracked skincare-source pool for dated articles from the last six months:
  Allure, Byrdie, NewBeauty, Who What Wear, Vogue, Refinery29, InStyle, Glamour, ELLE, and the American Academy of Dermatology.
- Collects article candidates per domain before grouping them into category signals.
- A signal requires three distinct tracked sources. It is labelled **Emerging signal** with three or four sources, or **Verified trend** with five or more.
- Stores the last successful signal set in a local runtime cache so a weak subsequent scan can reuse it.
- Generates a blog article, LinkedIn post, or Instagram post through the same AEO validation loop.

### Review & publishing

Final content is always editable before publishing.

- **LinkedIn / Instagram:** copies the text and opens the relevant platform. No OAuth is required for the prototype.
- **Blog article:** publishes to an in-app NordGlow Journal prototype so the blog flow can be demonstrated without an external CMS.

## Interface

The app uses a calm editorial visual system with a warm canvas, a single indigo action color, Plus Jakarta Sans, minimal `motion/react` transitions, and the Context Unlock logo mark. It keeps one active task on screen at a time and provides dedicated processing and inline retry states.

## Run locally

### Prerequisites

- Node.js and npm
- Python 3
- An OpenAI API key

### Setup

Create a local `.env` file in the project root:

```env
OPENAI_API_KEY=your_key_here
```

Install dependencies and start the API and frontend in separate terminals:

```bash
npm install
npm run api
```

```bash
npm run dev
```

Open `http://127.0.0.1:5173`.

For a production-style preview:

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

Then open `http://127.0.0.1:4173`.

## Project files

```text
api_server.py         Local OpenAI proxy, transcription, validation, and trend pipeline
brand_profile.md      NordGlow facts and writing rules
src/App.jsx           Single-page product flows
src/index.css         Theme tokens and editorial UI styling
public/               Context Unlock logo assets
ContextUnlock.md      Detailed product and implementation brief
```

## Safety and prototype limits

- NordGlow and its product facts are fictional demo material.
- Use only facts supplied in `brand_profile.md`; do not make medical claims or invent product results.
- API keys remain in `.env` and must never be committed.
- `.trend_cache.json` is local runtime data and is intentionally ignored by Git.
- Source links and dates are shown for trend signals, but should be reviewed before externally publishing content.
