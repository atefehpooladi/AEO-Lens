# Context Unlock — Jury Mock Data

All content in this file is fictional and is for the NordGlow demo only.

## Test 1 — Audit & Auto-Improve (paste)

**Choose:** Improve existing content → LinkedIn post

**Paste this text:**

> Our moisturizer is great for sensitive skin and helps with redness. It has good ingredients and was made for people who want simple skincare. We care about transparency and want customers to feel confident about what they use.

**What the jury should see:**

- A calm processing screen, then one editable final result.
- The result should explicitly name NordGlow, use a direct opening, use short scannable paragraphs, and retain only supported NordGlow facts.
- Click **Copy & open LinkedIn post** to demonstrate the platform hand-off.

## Test 2 — Audit & Auto-Improve (voice)

**Choose:** Improve existing content → Record a voice note.

**Say this:**

> NordGlow makes skincare for people whose skin gets irritated easily. I want to explain that our cleanser is gentle and fragrance-free, but I do not want to sound too salesy.

**Click in the follow-up question:**

> A product benefit

**Choose destination:** Instagram post.

**What the jury should see:**

- The voice note is transcribed.
- The UI asks only one click-first question about the missing focus.
- The final text is editable and **Copy & open Instagram post** copies it before opening Instagram.

## Test 3 — Audit → Blog prototype

**Choose:** Improve existing content → Blog article

**Paste this text:**

> Fragrance-free skincare can be easier to choose when you have sensitive skin. NordGlow makes products without fragrance and explains every ingredient clearly.

**What the jury should do:**

1. Run the improvement flow.
2. Edit the final text if desired.
3. Click **Publish to blog**.

**What the jury should see:**

- The NordGlow Journal prototype opens.
- The final text appears as the published article.
- This demonstrates a blog publishing flow without needing an external CMS.

## Test 4 — Trend → Content

**Choose:** Turn a trend into content.

**What the jury should see:**

- A dedicated processing screen while the app scans tracked skincare sources.
- Category signals with a source count and expandable dated source links.
- Each signal is labelled **Emerging signal** (3–4 sources) or **Verified trend** (5+ sources).

**Suggested click path:**

1. Open the signal about simplified routines, sensitive-skin care, or science-backed ingredients.
2. Choose **Blog article**.
3. Click **Create content**.
4. Click **Publish to blog** on the final screen.

## Demo facts available to the model

- NordGlow was founded in Hamburg in 2024.
- NordGlow makes fragrance-free skincare for sensitive, barrier-damaged skin.
- Every product is patch-tested before launch.
- The full range excludes the top 10 EU-flagged fragrance allergens.
- NordGlow’s Barrier Repair Moisturizer contains ceramides and niacinamide.
- In a four-week patch test, 92% of participants reported reduced redness after using NordGlow’s Barrier Repair Moisturizer. This result is self-reported.

## Fast fallback if live trend search is slow

Use **Test 1** first. The audit flow is the core demo: it shows the user’s original text becoming a validated, publish-ready NordGlow result without exposing internal model passes.
