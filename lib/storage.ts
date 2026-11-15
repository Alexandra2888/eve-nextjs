import { randomUUID } from "node:crypto";

/**
 * Persist a generated image and return a URL the browser (and judge) can load.
 * - With BLOB_READ_WRITE_TOKEN (Vercel Blob linked): public https URL.
 * - Otherwise (local dev): writes to public/generated and returns a site-relative path.
 */
export async function saveImage(bytes: Uint8Array, mediaType: string): Promise<string> {
  const ext = mediaType.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
  const name = `generated/${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(name, Buffer.from(bytes), { access: "public", contentType: mediaType });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error("Image storage is not configured: connect a Vercel Blob store to this project (BLOB_READ_WRITE_TOKEN).");
  }

  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const dir = path.join(process.cwd(), "public", "generated");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(process.cwd(), "public", name), bytes);
  return `/${name}`;
}
