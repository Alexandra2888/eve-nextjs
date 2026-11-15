import { defineAgent } from "eve";
import { anthropic } from "eve/models/anthropic";

export default defineAgent({
  description: "Image specialist: crafts a detailed prompt and generates an image.",
  model: anthropic("claude-haiku-5-5"), // direct provider (ANTHROPIC_API_KEY)
  defaultTools: false,
  tool: false,
});
