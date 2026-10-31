import crypto from "node:crypto";
import { json, failure, photoStore } from "../lib/common.mjs";
import { MAX_PHOTO_BYTES, sniffImage } from "../lib/validate.mjs";

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" }, { Allow: "POST" });
  try {
    const declared = Number(req.headers.get("content-length") || 0);
    if (declared > MAX_PHOTO_BYTES + 1024) return json(413, { error: "Photo is too large (max 4 MB)." });
    const buf = await req.arrayBuffer();
    if (buf.byteLength === 0) return json(400, { error: "Empty file." });
    if (buf.byteLength > MAX_PHOTO_BYTES) return json(413, { error: "Photo is too large (max 4 MB)." });

    // Trust the bytes, not the browser-supplied type or file extension.
    const kind = sniffImage(buf);
    if (!kind) return json(415, { error: "Only JPG, PNG or WebP photos are allowed." });

    let name = "photo";
    try { name = decodeURIComponent(req.headers.get("x-file-name") || "photo"); } catch { /* keep default */ }
    name = name.replace(/[^\w.\- ]/g, "_").slice(0, 80) || "photo";

    const id = crypto.randomUUID();
    await photoStore().set(id, buf, { metadata: { name, type: kind.type, size: buf.byteLength, uploadedAt: new Date().toISOString() } });
    return json(200, { id, name, size: buf.byteLength });
  } catch (e) {
    return failure(e);
  }
};
