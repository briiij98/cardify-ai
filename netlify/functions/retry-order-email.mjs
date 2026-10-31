import { json, failure, env, orderStore, confirmPaymentWithRazorpay, finalizeOrder, sendMissingEmails, publicOrderState, originOf } from "../lib/common.mjs";
import { safeEqual } from "../lib/security.mjs";

/**
 * Admin-only recovery tool. Never charges anyone.
 *   GET  /api/retry-order-email                -> lists paid orders with an unsent email
 *   POST /api/retry-order-email {orderId}      -> re-sends only the emails that have not been sent
 *   POST ... {orderId, paymentId}              -> reconcile: verify the payment with Razorpay, then process the order
 *   POST ... {orderId, force:true}             -> resend both emails again (new idempotency key)
 * Header required: x-admin-token: <ADMIN_RETRY_TOKEN>
 */
export default async (req) => {
  try {
    if (!safeEqual(req.headers.get("x-admin-token") || "", env("ADMIN_RETRY_TOKEN"))) return json(401, { error: "Unauthorized" });
    const store = orderStore();

    if (req.method === "GET") {
      const { blobs } = await store.list();
      const pending = [];
      for (const { key } of blobs) {
        const r = await store.get(key, { type: "json" });
        if (r && r.status === "paid" && (!r.emails?.admin?.sent || !r.emails?.customer?.sent))
          pending.push({ orderId: key, paymentId: r.paymentId, emails: r.emails });
      }
      return json(200, { pending });
    }
    if (req.method !== "POST") return json(405, { error: "Method not allowed" });

    const b = await req.json().catch(() => ({}));
    const orderId = String(b.orderId || "");
    const rec = await store.get(orderId, { type: "json" });
    if (!rec) return json(404, { error: "Order not found" });

    if (rec.status !== "paid") {
      const paymentId = String(b.paymentId || "");
      if (!/^pay_\w+$/.test(paymentId)) return json(409, { error: "Order is not paid. Provide paymentId to reconcile with Razorpay." });
      const state = await confirmPaymentWithRazorpay(orderId, paymentId);
      if (state !== "paid") return json(409, { error: `Razorpay reports payment as ${state}.` });
      return json(200, publicOrderState(await finalizeOrder(orderId, paymentId, originOf(req))));
    }

    if (b.force === true) {
      const attempt = (rec.forceCount || 0) + 1;
      rec.forceCount = attempt;
      rec.emails = { admin: { sent: false }, customer: { sent: false } };
      await store.setJSON(orderId, rec);
      return json(200, publicOrderState(await sendMissingEmails(rec, originOf(req), attempt)));
    }
    return json(200, publicOrderState(await sendMissingEmails(rec, originOf(req))));
  } catch (e) {
    return failure(e);
  }
};
