import { defineAgent } from "eve";

export default defineAgent({
  description: "Writing specialist: drafts, rewrites, summarises and explains text.",
  model: "anthropic/claude-sonnet-5.5",
  defaultTools: false,
  tool: false, // reachable only through the orchestrator's `delegate` tool
});
