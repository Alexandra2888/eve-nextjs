import { defineAgent } from "eve";
import { anthropic } from "eve/models/anthropic";

export default defineAgent({
  description: "Writing specialist: drafts, rewrites, summarises and explains text.",
  model: anthropic("claude-sonnet-5-5"), // direct provider (ANTHROPIC_API_KEY)
  defaultTools: false,
  tool: false, // reachable only through the orchestrator's `delegate` tool
});
