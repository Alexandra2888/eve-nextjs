import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Generate an image from a detailed prompt. Returns a URL to the PNG.",
  inputSchema: z.object({
    prompt: z.string().min(10).describe("Detailed image prompt."),
    size: z.enum(["1024x1024", "1536x1024", "1024x1536"]).default("1024x1024"),
  }),
  label: { start: () => "Generating image" },
  async execute({ prompt, size }, ctx) {
    // Import heavy SDKs inside execute to keep the agent bundle small.
    const { generateImage } = await import("ai");
    const { IMAGE_MODEL } = await import("../../../../lib/models");
    const { saveImage } = await import("../../../../lib/storage");

    const { image } = await generateImage({
      model: IMAGE_MODEL,
      prompt,
      size,
      abortSignal: ctx.abortSignal,
    });
    const url = await saveImage(image.uint8Array, image.mediaType ?? "image/png");
    return { url, prompt, size };
  },
});
