import { cosineSimilarity, embed, embedMany } from "ai";
import { EMBEDDING_MODEL } from "../models";
import { PROJECT_DOC } from "./document";

export type Chunk = { id: string; heading: string; text: string };
export type SearchHit = Chunk & { score: number };

const MAX_CHUNK_CHARS = 800;

/** Split on level-2 headings; split oversized sections on paragraph boundaries. */
export function chunkDocument(doc: string): Chunk[] {
  const sections = doc.split(/^## /m);
  const intro = sections.shift()?.trim();
  const chunks: Chunk[] = [];

  const push = (heading: string, body: string) => {
    const paragraphs = body.split(/\n{2,}/);
    let buffer = "";
    let part = 0;
    const flush = () => {
      if (!buffer.trim()) return;
      const slug = heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      chunks.push({ id: `${slug}${part ? `-${part}` : ""}`, heading, text: `${heading}\n${buffer.trim()}` });
      part += 1;
      buffer = "";
    };
    for (const p of paragraphs) {
      if (buffer.length + p.length > MAX_CHUNK_CHARS) flush();
      buffer += `${p}\n\n`;
    }
    flush();
  };

  if (intro) push("Introduction", intro.replace(/^# .*\n?/, ""));
  for (const section of sections) {
    const [heading = "", ...rest] = section.split("\n");
    push(heading.trim(), rest.join("\n"));
  }
  return chunks;
}

type Index = { chunks: Chunk[]; embeddings: number[][] };
let indexPromise: Promise<Index> | undefined;

function getIndex(): Promise<Index> {
  indexPromise ??= (async () => {
    const chunks = chunkDocument(PROJECT_DOC);
    const { embeddings } = await embedMany({ model: EMBEDDING_MODEL, values: chunks.map((c) => c.text) });
    return { chunks, embeddings };
  })().catch((error) => {
    indexPromise = undefined; // allow retry on next call
    throw error;
  });
  return indexPromise;
}

export async function searchDocs(query: string, k = 4): Promise<SearchHit[]> {
  const [{ chunks, embeddings }, { embedding }] = await Promise.all([
    getIndex(),
    embed({ model: EMBEDDING_MODEL, value: query }),
  ]);
  return chunks
    .map((chunk, i) => ({ ...chunk, score: Number(cosineSimilarity(embedding, embeddings[i]!).toFixed(4)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
