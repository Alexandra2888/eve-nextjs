/**
 * Models used directly by tool code (AI SDK calls routed through Vercel AI Gateway).
 *
 * Agent models live as string literals in each `agent.ts` so eve can resolve them
 * statically at build time:
 *   orchestrator  agent/agent.ts                   anthropic/claude-sonnet-5.5
 *   text          agent/subagents/text/agent.ts    anthropic/claude-sonnet-5.5
 *   code          agent/subagents/code/agent.ts    anthropic/claude-opus-5.5
 *   image         agent/subagents/image/agent.ts   anthropic/claude-haiku-5.5
 *   rag           agent/subagents/rag/agent.ts     anthropic/claude-haiku-5.5
 *   judge         agent/subagents/judge/agent.ts   openai/gpt-6-sol  (different family → less self-preference bias)
 */
export const IMAGE_MODEL = "openai/gpt-image-2";
export const EMBEDDING_MODEL = "openai/text-embedding-3-small";
