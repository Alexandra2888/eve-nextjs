import { defineAgent } from "eve";

export default defineAgent({
  description: "Image specialist: crafts a detailed prompt and generates an image.",
  model: "anthropic/claude-haiku-5.5",
  defaultTools: false,
  tool: false,
});
