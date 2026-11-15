import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Semantic search over the Orchestra project document. Returns the most relevant chunks with ids and scores.",
  inputSchema: z.object({
    query: z.string().min(2),
    k: z.number().int().min(1).max(8).default(4),
  }),
  label: { start: ({ query }) => `Searching docs for “${query}”` },
  async execute({ query, k }) {
    const { searchDocs } = await import("../../../../lib/rag");
    return { query, hits: await searchDocs(query, k) };
  },
});
