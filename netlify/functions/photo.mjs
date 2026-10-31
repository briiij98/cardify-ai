import { failure, photoStore, json } from "../lib/common.mjs";
import { verifyPhoto } from "../lib/security.mjs";

// Photos are private. Only holders of a signed, expiring link (sent in the admin email) can view them.
export default async (req) => {
  try {
    const u = new URL(req.url);
    const id = u.searchParams.get("id") || "";
    const secret = process.env.PHOTO_LINK_SECRET;
    if (!secret) return json(503, { error: "Not configured" });
    if (!/^[0-9a-f-]{36}$/i.test(id) || !verifyPhoto(id, u.searchParams.get("exp"), u.searchParams.get("sig"), secret))
      return json(403, { error: "Invalid or expired link" });

    const hit = await photoStore().getWithMetadata(id, { type: "arrayBuffer" });
    if (!hit) return json(404, { error: "Not found" });
    const m = hit.metadata || {};
    const safeType = ["image/jpeg", "image/png", "image/webp"].includes(m.type) ? m.type : "application/octet-stream";
    return new Response(hit.data, {
      headers: {
        "Content-Type": safeType,
        "Content-Disposition": `inline; filename="${String(m.name || "photo").replace(/[^\w.\- ]/g, "_")}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return failure(e);
  }
};
