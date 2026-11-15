import { defineAgent } from "eve";

export default defineAgent({
  description: "Answers questions about the Orchestra project using retrieval over the project document.",
  model: "anthropic/claude-haiku-5.5",
  defaultTools: false,
  tool: false,
});
