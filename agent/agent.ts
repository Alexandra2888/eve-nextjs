import { defineAgent } from "eve";
import { anthropic } from "eve/models/anthropic";

// Orchestrator. Specialists are hidden (`tool: false` in each subagent), so the
// only way to reach them is the `delegate` workflow tool, which always runs the judge.
export default defineAgent({
  description: "Orchestrator that routes requests to specialist agents and returns judged results.",
  model: anthropic("claude-sonnet-5-5"), // direct provider (ANTHROPIC_API_KEY)
  reasoning: "low",
  defaultTools: false,
  tool: false, // disable the built-in `agent` (root-copy) tool
});
