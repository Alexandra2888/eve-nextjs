import { defineAgent } from "eve";

export default defineAgent({
  description: "Coding specialist: writes, refactors, debugs and explains code.",
  model: "anthropic/claude-opus-5.5",
  defaultTools: false,
  tool: false,
});
