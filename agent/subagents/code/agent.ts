import { defineAgent } from "eve";
import { anthropic } from "eve/models/anthropic";

export default defineAgent({
  description: "Coding specialist: writes, refactors, debugs and explains code.",
  model: anthropic("claude-opus-5-5"), // direct provider (ANTHROPIC_API_KEY)
  defaultTools: false,
  tool: false,
});
