import { json, failure, env, orderStore, finalizeOrder, publicOrderState, originOf } from "../lib/common.mjs";
import { verifyWebhookSignature } from "../lib/security.mjs";
import { AMOUNT_PAISE } from "../lib/validate.mjs";

// Backup path: if the customer closes the tab after paying, Razorpay still tells us.
export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  try {
    const raw = await req.text();
    if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"), env("RAZORPAY_WEBHOOK_SECRET")))
      return json(400, { error: "Invalid signature" });

    const evt = JSON.parse(raw);
    if (evt.event !== "payment.captured" && evt.event !== "order.paid") return json(200, { ignored: true });

    const pay = evt.payload?.payment?.entity;
    if (!pay || pay.status !== "captured" || pay.amount !== AMOUNT_PAISE || pay.currency !== "INR") return json(200, { ignored: true });

    const rec = await orderStore().get(pay.order_id, { type: "json" });
    if (!rec) return json(200, { ignored: "unknown order" }); // not one of ours

    const done = await finalizeOrder(pay.order_id, pay.id, originOf(req));
    const state = publicOrderState(done);
    // Non-2xx makes Razorpay retry later, which re-attempts any email that failed.
    const allSent = state.emailsSent.admin && state.emailsSent.customer;
    return json(allSent ? 200 : 500, state);
  } catch (e) {
    return failure(e);
  }
};
