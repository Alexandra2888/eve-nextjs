import { createOpenAI } from "@ai-sdk/openai";

/**
 * Models used directly by tool code. All calls go straight to the providers using
 * ANTHROPIC_API_KEY / OPENAI_API_KEY from .env.local (no Vercel AI Gateway).
 *
 * Agent models are set in each agent.ts with eve's helpers:
 *   orchestrator  agent/agent.ts                   anthropic("claude-sonnet-5-5")
 *   text          agent/subagents/text/agent.ts    anthropic("claude-sonnet-5-5")
 *   code          agent/subagents/code/agent.ts    anthropic("claude-opus-5-5")
 *   image         agent/subagents/image/agent.ts   anthropic("claude-haiku-5-5")
 *   rag           agent/subagents/rag/agent.ts     anthropic("claude-haiku-5-5")
 *   judge         agent/subagents/judge/agent.ts   openai("gpt-6-sol")  (different family → less self-preference bias)
 */
const openai = createOpenAI(); // reads OPENAI_API_KEY

export const IMAGE_MODEL = openai.image("gpt-image-2");
export const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small");
