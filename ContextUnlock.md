# Context Unlock — Simplified Build

Context Unlock is a focused AEO writing tool for the fictional skincare brand **NordGlow**. The brand profile is bundled in `brand_profile.md`; users never complete a business-profile setup step.

## What it does

### 1. Audit & Auto-Improve

Users paste existing content or record a voice note.

- Voice notes are transcribed locally through the API. If a needed content focus is missing, the UI asks one click-first question with up to four choices, including **Other**.
- The server rewrites the content for five AEO criteria: direct answer, self-contained sentences, clear structure, explicit NordGlow naming, and fact density.
- A separate LLM validation call quotes and summarizes the proposed output. Generation and validation are capped at three attempts and stop on a plateau.
- Internal attempts, scores, and validation notes are never shown in the UI. Users receive only the final editable content.

### 2. Trend → Content

Users can generate content from a skincare category signal.

- The API scans these tracked sources independently: Allure, Byrdie, NewBeauty, Who What Wear, Vogue, Refinery29, InStyle, Glamour, ELLE, and the American Academy of Dermatology.
- It collects dated skincare article candidates from the previous six months, then groups only those collected URLs into category signals.
- A signal requires at least three distinct tracked sources. Three or four sources are labelled **Emerging signal**; five or more are labelled **Verified trend**.
- The last successful result is cached locally in `.trend_cache.json` so a weak later search can reuse a previously verified set instead of leaving the demo empty.
- Users choose **Blog article**, **LinkedIn post**, or **Instagram post** before generation. The generated content follows the same server-side validation loop as Audit.

## Review and publishing

All final content is editable before publishing.

- **LinkedIn** and **Instagram:** copy the content and open the corresponding platform. OAuth is intentionally out of scope for the prototype.
- **Blog article:** publishes the final text to an in-app NordGlow Journal prototype, demonstrating the blog publishing flow without an external CMS.

## Interface principles

- One active task at a time; home has only the two entry points.
- Click-first choices; typing is reserved for pasted content and the Other option.
- A dedicated calm processing screen while API work runs; no internal model passes are exposed.
- Errors show a Sonner toast and an inline retry on the affected task.
- The interface uses an editorial warm-white visual system, Plus Jakarta Sans, indigo actions, minimal `motion/react` transitions, and the cropped Context Unlock logo mark.

## Local development

1. Add `OPENAI_API_KEY` (or `CODEX_API_KEY`) to `.env`.
2. Run the local API:

   ```bash
   npm run api
   ```

3. Run the Vite app:

   ```bash
   npm run dev
   ```

For a CSP-safe production preview, build then run `npm run preview`. The Vite preview proxy forwards `/api` to the local API.

## Safety and demo constraints

- NordGlow is fictional. Use only facts from `brand_profile.md`; do not invent product claims or make medical claims.
- API keys stay in `.env` and are never committed.
- The trend cache is a local runtime file and is not committed.
