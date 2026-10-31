import { json, failure, env, orderStore, confirmPaymentWithRazorpay, finalizeOrder, publicOrderState, originOf, sendMissingEmails } from "../lib/common.mjs";
import { verifyPaymentSignature } from "../lib/security.mjs";

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" }, { Allow: "POST" });
  try {
    let b;
    try { b = await req.json(); } catch { return json(400, { error: "Invalid JSON" }); }
    const orderId = String(b.razorpay_order_id || "");
    const paymentId = String(b.razorpay_payment_id || "");
    const signature = String(b.razorpay_signature || "");
    if (!/^order_\w+$/.test(orderId) || !/^pay_\w+$/.test(paymentId)) return json(400, { error: "Invalid payment details" });

    // 1) The signature proves the browser callback came from a genuine Razorpay payment for this order.
    if (!verifyPaymentSignature(orderId, paymentId, signature, env("RAZORPAY_KEY_SECRET")))
      return json(400, { status: "failed", error: "Payment verification failed." });

    const store = orderStore();
    const rec = await store.get(orderId, { type: "json" });
    if (!rec) return json(404, { status: "failed", error: "Order not found." });

    // Already processed: do not re-confirm, only fill in any email that failed earlier.
    if (rec.status === "paid") {
      const updated = rec.paymentId === paymentId ? await sendMissingEmails(rec, originOf(req)) : rec;
      return json(200, publicOrderState(updated));
    }

    // 2) Ask Razorpay directly for the payment's real status, amount and order.
    const state = await confirmPaymentWithRazorpay(orderId, paymentId);
    if (state === "pending") return json(202, { status: "pending", orderId });
    if (state === "failed") return json(402, { status: "failed", orderId, error: "Payment was not successful." });

    const done = await finalizeOrder(orderId, paymentId, originOf(req));
    return json(200, publicOrderState(done));
  } catch (e) {
    return failure(e);
  }
};
