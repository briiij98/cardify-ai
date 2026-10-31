import { json, failure, templates, orderStore, photoStore, rzp, env } from "../lib/common.mjs";
import { validateOrder, AMOUNT_PAISE, PRICE_INR } from "../lib/validate.mjs";
import crypto from "node:crypto";

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" }, { Allow: "POST" });
  try {
    const raw = await req.text();
    if (raw.length > 60_000) return json(413, { error: "Request too large" });
    let body;
    try { body = JSON.parse(raw); } catch { return json(400, { error: "Invalid JSON" }); }

    // Price is NEVER taken from the browser. Only the validated order details are.
    const { ok, errors, value } = validateOrder(body, templates);
    if (!ok) return json(422, { error: "Please fix the highlighted fields.", errors });

    const photos = photoStore();
    for (const p of value.photos) {
      if (!(await photos.getMetadata(p.id))) return json(422, { error: "An uploaded photo was not found. Please re-upload.", errors: { photos: "Please re-upload your photos." } });
    }

    const receipt = `cdf_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
    const order = await rzp("/orders", "POST", {
      amount: AMOUNT_PAISE,
      currency: "INR",
      receipt,
      notes: { templateId: value.templateId, product: "Cardify.ai invitation" },
    });

    await orderStore().setJSON(order.id, {
      orderId: order.id,
      receipt,
      status: "created",
      amount: AMOUNT_PAISE,
      createdAt: new Date().toISOString(),
      order: value,
      emails: { admin: { sent: false }, customer: { sent: false } },
    });

    return json(200, { orderId: order.id, amount: AMOUNT_PAISE, currency: "INR", keyId: env("RAZORPAY_KEY_ID"), price: PRICE_INR });
  } catch (e) {
    return failure(e);
  }
};
