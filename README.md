# 🎼 Orchestra — AI agent orchestration with Next.js + eve

A multi-agent app where one **orchestrator** routes each request to a specialist agent — **text**, **code**, **image** or **RAG** — and an **AI judge** automatically scores every result, retrying once with feedback when it falls short.

**Live demo:** https://eve-nextjs-flame.vercel.app/s

Built with [Next.js 16](https://nextjs.org), [eve](https://eve.dev) (Vercel's file-based agent framework), TypeScript and Tailwind CSS v4.

## How it works

```
user ─▶ orchestrator ─▶ delegate tool ─▶ specialist ─▶ judge ─▶ score ≥ 7? ─ yes ─▶ result + verdict
                                              ▲                     │
                                              └── retry with ───────┘ no  (max 1 retry, best attempt wins)
                                                  judge feedback
```

- The **orchestrator** never does the work itself. Its only tool is `delegate`, so every output is judged.
- Specialists are hidden from the orchestrator (`tool: false`) and reached via `ctx.agent()` inside the
  durable `delegate` workflow — crashes or redeploys mid-run resume instead of restarting.
- Multi-part requests ("write a tagline **and** make a logo") fan out to several specialists **in parallel**.
- The **judge** returns structured JSON (score 1–10, pass flag, per-criterion scores, feedback). An output passes at **≥ 7**.
  It runs on a different model family than the specialists to reduce self-preference bias, sees generated images
  when they have a public URL, and gets the full project document when grading RAG answers.

| Agent        | Model                                       | Does                                                   |
| ------------ | ------------------------------------------- | ------------------------------------------------------ |
| Orchestrator | Claude Sonnet 5.5                           | Routes requests, presents judged results               |
| Text         | Claude Sonnet 5.5                           | Writing, rewriting, summarising                        |
| Code         | Claude Opus 5.5                             | Complete, runnable code with tests                     |
| Image        | Claude Haiku 5.5 + `gpt-image-2`            | Crafts a detailed prompt, generates the image          |
| RAG          | Claude Haiku 5.5 + `text-embedding-3-small` | Answers only from the project document, with citations |
| Judge        | GPT-6 Sol                                   | Rubric-based scoring and feedback                      |

### RAG

`lib/rag/document.ts` holds a small project document. It's chunked at `##` headings, embedded once per server
instance (in memory, no vector DB), and searched by cosine similarity. The RAG agent cites chunk ids like
`[tech-stack]` and says so when something isn't covered.

### UI

- Chat at `/s`; each conversation gets a resumable URL `/s/[sessionId]`.
- Result cards show the output (markdown, code, images), the judge's score breakdown and every attempt.
- **Agent trace** panel (wide screens): orchestrator → specialist → judge → retry timeline, child-agent tool calls
  and retrieved RAG chunks.

## Project structure

```
agent/
  agent.ts, instructions.md        orchestrator
  channels/eve.ts                  who can call the agent (public demo: none())
  tools/delegate.ts                specialist → judge → retry workflow
  subagents/
    text/  code/                   agent.ts + instructions.md
    image/tools/generate_image.ts
    rag/tools/search_docs.ts
    judge/
lib/
  verdict.ts                       Verdict schema, pass score, rubrics, shared types
  rag/                             document + chunking/embedding/search
  models.ts                        image + embedding models
  storage.ts                       Vercel Blob (or public/generated locally)
app/
  s/, s/[sessionId]/               chat pages
  _components/                     chat, delegate card, trace panel, markdown
evals/                             eve eval suite
```

## Getting started

Requirements: **Node 24+**, **pnpm**, an **Anthropic** API key and an **OpenAI** API key.

```bash
pnpm install
```

Create `.env.local`:

```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
# optional: public image URLs (otherwise images are saved to public/generated in dev)
BLOB_READ_WRITE_TOKEN=...
```

Run it:

```bash
pnpm dev        # Next.js app + agent → http://localhost:3000
pnpm eve:dev    # chat with the orchestrator in the terminal UI
```

Try:

- `Write a 3-line tagline for a coffee shop run by robots` → text
- `TypeScript debounce function with tests` → code
- `Generate a flat-style logo of a fox reading a book` → image
- `What tech stack does this project use?` → RAG
- `Write a tagline for Orchestra and make a matching logo` → text + image in parallel

## Evals

```bash
pnpm eval                       # all evals
pnpm eval --exclude-tag slow    # skip image generation
```

Covers routing for every specialist, the judge verdict, multi-part fan-out, out-of-scope RAG questions and
small talk without delegation.

## Deploy (Vercel)

1. `pnpm exec eve link` to connect the Vercel project.
2. Add `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` in **Project → Settings → Environment Variables**.
3. Connect a **Vercel Blob** store (Storage tab) so generated images get public URLs — image generation fails on
   Vercel without it.
4. `pnpm exec eve deploy`, or push to the connected Git repository.

> **Public access:** `agent/channels/eve.ts` uses `none()`, so anyone with the URL can use the app on your API keys.
> Set spending limits in the Anthropic and OpenAI dashboards, or replace `none()` with real auth
> (Auth.js, Clerk) or `httpBasic(...)`.

## Customising

- **Knowledge base:** edit `lib/rag/document.ts`.
- **Models:** each `agent/**/agent.ts`, plus `lib/models.ts` for images and embeddings.
- **Pass score / retries / rubrics:** `lib/verdict.ts` (`PASS_SCORE`, `MAX_ATTEMPTS`, `RUBRICS`).
- **New specialist:** add `agent/subagents/<name>/` with `tool: false`, then add the name to `SPECIALISTS`
  in `lib/verdict.ts` and to the orchestrator's instructions.
