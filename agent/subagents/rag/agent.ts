import { defineAgent } from "eve";
import { anthropic } from "eve/models/anthropic";

export default defineAgent({
  description: "Answers questions about the Orchestra project using retrieval over the project document.",
  model: anthropic("claude-haiku-5-5"), // direct provider (ANTHROPIC_API_KEY)
  defaultTools: false,
  tool: false,
});
