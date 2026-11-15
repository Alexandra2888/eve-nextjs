/**
 * The project knowledge base the RAG agent answers from.
 * Kept as a TS module (not a .md read from disk) so it bundles into the agent
 * service on Vercel without filesystem assumptions. Edit freely — the index is
 * rebuilt on the next cold start.
 */
export const PROJECT_DOC = `
# Orchestra — AI agent orchestration demo

## Overview
Orchestra is a demo application that shows how to orchestrate multiple specialised AI agents.
A single orchestrator agent receives every user message, decides which specialist should handle it,
and returns the result together with an automatic quality review from an AI judge.

## Tech stack
- Framework: Next.js 16 (App Router) with React 19 and TypeScript.
- Agent framework: eve, Vercel's open-source, file-based agent framework. Each agent is a directory;
  tools are TypeScript files and instructions are Markdown.
- Models are accessed through Vercel AI Gateway, so no provider API keys are stored in the app.
- Styling: Tailwind CSS v4.
- Image storage: Vercel Blob (falls back to the local public/ folder in development).
- Hosting: Vercel. eve sessions run durably on Vercel Workflows.

## Agents
- Orchestrator: routes requests and can run several specialists in parallel for multi-part requests.
- Text agent: writing, rewriting, summarising and explaining.
- Code agent: generating, refactoring and explaining code, always with fenced code blocks.
- Image agent: turns a request into a detailed image prompt and generates the image.
- RAG agent: answers questions about this project using only this document.
- Judge agent: scores every specialist output from 1 to 10 against a type-specific rubric.

## Judge and retry loop
Every specialist output is sent to the judge automatically by the delegate workflow tool.
The judge returns structured JSON: an overall score, a pass flag, per-criterion scores and feedback.
An output passes when the score is at least 7. If it fails, the specialist gets exactly one retry
with the judge's feedback, and the better attempt is shown. The judge runs on a different model
family than the specialists to reduce self-preference bias.

## Retrieval (RAG) details
This document is split into chunks at its level-2 headings. Each chunk is embedded with
openai/text-embedding-3-small via AI Gateway. Embeddings are cached in memory per server instance.
At query time the question is embedded and the top 4 chunks are ranked by cosine similarity.
The RAG agent must cite chunk ids and say when the answer is not in the document.

## Running locally
1. Install dependencies with pnpm install (Node 24 or newer is required).
2. Run pnpm exec eve link to connect a Vercel project and pull environment variables.
3. Run pnpm dev to start the Next.js app together with the agent, then open http://localhost:3000.
4. Run pnpm exec eve dev to chat with the orchestrator in the terminal UI instead.

## Team and ownership
The project is maintained by a small team: one full-stack engineer owns the Next.js UI,
and one AI engineer owns the agents, prompts and evaluation suite. Evals live in the evals folder
and run with pnpm exec eve eval.

## Limitations
- The knowledge base is a single small document; there is no vector database.
- Generated images are public URLs when Vercel Blob is used.
- The local development auth (localDev) must be replaced with real authentication before a public deployment.
`.trim();
