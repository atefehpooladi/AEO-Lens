# ContextUnlock

**ContextUnlock** helps solo founders create content that AI answer engines can quote, cite, and surface. It focuses on **Answer Engine Optimization (AEO)**: making content clear, self-contained, factual, and easy for tools such as ChatGPT, Perplexity, and Google AI Overviews to use in answers.

Unlike traditional SEO, which optimizes for search rankings and clicks, ContextUnlock optimizes content for visibility inside AI-generated answers.

## The problem

Founders can have a strong product and still go unmentioned by AI answer engines. Content is often too vague, unstructured, unsupported, or dependent on surrounding context to be quoted cleanly. At the same time, early-stage teams rarely have the time or support to research competitors, market size, and emerging content opportunities.

ContextUnlock turns that research and content work into one guided workflow.

## Core modes

### Audit

Score existing content for AI citability using five criteria:

- Direct answer
- Self-contained sentences
- Clear structure
- Explicit brand naming
- Fact density

The tool rewrites weaker content and re-scores it for up to three passes, showing how the score improves along the way.

### Draft

Create a new piece of content from a founder's topic, business context, audience, and differentiator.

### Scout

Research timely content opportunities using multiple search angles: audience questions, competitor activity, and relevant news or data. Recommendations must be tied to named, dated sources rather than invented trends.

### Founder Snapshot

Give a time-constrained founder a concise, source-backed view of:

- Named competitors and their positioning
- A citable market-size figure
- A clear differentiator
- A ready-to-use positioning paragraph for a pitch deck or About page

The resulting positioning can be passed into the Audit flow to make it AEO-ready.

## Workflow

1. Build a session-only profile through voice, file upload, or a typed form.
2. Confirm the extracted business, audience, content goal, and differentiator.
3. Choose Audit, Draft, Scout, or Founder Snapshot.
4. Generate or improve the content with source-backed research where applicable.
5. Run a citation test that compares the original and revised content.
6. Review, edit, copy, download, or publish the final result.

Nothing is published automatically: the founder always reviews the final content first.

## AEO principles

ContextUnlock favors content that:

- Answers the main question early
- Uses short, independently understandable sentences
- Names the brand or subject explicitly
- Includes concrete facts, numbers, and sources
- Uses scannable paragraphs and headings

## Planned product experience

The MVP is designed as a React single-page application with a high-contrast neo-brutalist bento-card interface. Each stage—profile, audit score, rewrite, sources, market snapshot, citation test, and review—has a focused, scannable card.

The planned backend uses Python. A local JSON file is sufficient for any MVP history; no production database is required for the prototype.

## Repository status

This repository currently contains the product concept and execution brief in [ContextUnlock.md](ContextUnlock.md). The application implementation is the next stage of the project.

## Safety and source standards

- API keys belong in a local `.env` file and must never be committed.
- Research claims must name the source and date.
- If reliable evidence cannot be found, the tool should say so rather than estimate or invent a fact.
- Rewrite loops stop after three passes or when the score stops improving.

## Vision

ContextUnlock gives solo founders a practical way to move from “I do not have the time or team to research and write this” to a clear, evidence-backed, AI-citable piece of content.
