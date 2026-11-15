import { defineAgent } from "eve";
import { openai } from "eve/models/openai";

// Different model family from the specialists to reduce self-preference bias.
export default defineAgent({
  description: "Impartial AI judge that scores specialist outputs against a rubric.",
  model: openai("gpt-6-sol"), // direct provider (OPENAI_API_KEY)
  reasoning: "medium",
  defaultTools: false,
  tool: false,
});
