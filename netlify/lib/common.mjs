import { getStore } from "@netlify/blobs";
import templates from "../../src/data/templates.json";
import { AMOUNT_PAISE } from "./validate.mjs";
import { photoUrl } from "./security.mjs";
import { buildAdminEmail, buildCustomerEmail, sendEmail } from "./emails.mjs";

export { templates };

export const json = (status, body, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra },
  });

export function env(name) {
  const v = process.env[name];
  if (!v) throw new ConfigError(name);
  return v;
}
export class ConfigError extends Error {
  constructor(name) {
    super(`Missing environment variable: ${name}`);
    this.name = "ConfigError";
  }
}
/** Never leak internals to the browser; log details server-side. */
export function failure(err) {
  console.error("[cardify]", err && err.stack ? err.stack : err);
  if (err instanceof ConfigError) return json(503, { error: "The service is not configured yet. Please contact support." });
  return json(500, { error: "Something went wrong. Please try again." });
}

export const orderStore = () => getStore({ name: "orders", consistency: "strong" });
export const photoStore = () => getStore({ name: "photos", consistency: "strong" });

function rzpAuth() {
  return "Basic " + Buffer.from(`${env("RAZORPAY_KEY_ID")}:${env("RAZORPAY_KEY_SECRET")}`).toString("base64");
}
export async function rzp(path, method = "GET", body) {
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: { Authorization: rzpAuth(), "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(`Razorpay ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/**
 * Ask Razorpay for the real payment state. Returns "paid" | "pending" | "failed".
 * Also checks the payment belongs to this order and matches the price.
 * An "authorized" payment is captured here (needed if auto-capture is off).
 */
export async function confirmPaymentWithRazorpay(orderId, paymentId) {
  let p = await rzp(`/payments/${encodeURIComponent(paymentId)}`);
  if (p.order_id !== orderId || p.amount !== AMOUNT_PAISE || p.currency !== "INR") return "failed";
  if (p.status === "authorized") {
    try {
      p = await rzp(`/payments/${encodeURIComponent(paymentId)}/capture`, "POST", { amount: AMOUNT_PAISE, currency: "INR" });
    } catch (e) {
      p = await rzp(`/payments/${encodeURIComponent(paymentId)}`); // may already be captured by auto-capture
    }
  }
  if (p.status === "captured") return "paid";
  if (p.status === "failed" || p.status === "refunded") return "failed";
  return "pending";
}

/**
 * Mark an order paid (idempotent) and send any email that has not been sent yet.
 * Safe to call repeatedly (success page reload, webhook, admin retry).
 * Resend Idempotency-Key additionally prevents duplicates if two calls race.
 */
export async function finalizeOrder(orderId, paymentId, origin, { attempt = 0 } = {}) {
  const store = orderStore();
  let rec = await store.get(orderId, { type: "json" });
  if (!rec) return null;

  if (rec.status !== "paid") {
    rec.status = "paid";
    rec.paymentId = paymentId;
    rec.paidAt = new Date().toISOString();
    rec.emails = rec.emails || { admin: { sent: false }, customer: { sent: false } };
    await store.setJSON(orderId, rec);
  }
  return sendMissingEmails(rec, origin, attempt);
}

export async function sendMissingEmails(rec, origin, attempt = 0) {
  const store = orderStore();
  rec.emails = rec.emails || { admin: { sent: false }, customer: { sent: false } };
  const tpl = templates.find((t) => t.id === rec.order.templateId);
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const admin = process.env.ADMIN_EMAIL;
  const suffix = attempt ? `-r${attempt}` : "";

  const run = async (who, build, to, replyTo) => {
    if (rec.emails[who].sent) return;
    try {
      if (!apiKey || !from || !to) throw new Error("RESEND_API_KEY, EMAIL_FROM or ADMIN_EMAIL is not set");
      const mail = build();
      await sendEmail({ apiKey, from, to, replyTo, idempotencyKey: `cardify-${rec.orderId}-${who}${suffix}`, ...mail });
      rec.emails[who] = { sent: true, at: new Date().toISOString() };
    } catch (e) {
      console.error(`[cardify] ${who} email failed for ${rec.orderId}:`, e.message);
      rec.emails[who] = { sent: false, lastError: String(e.message).slice(0, 200), lastAttemptAt: new Date().toISOString() };
    }
    await store.setJSON(rec.orderId, rec);
  };

  await run(
    "admin",
    () => {
      const secret = env("PHOTO_LINK_SECRET");
      const links = rec.order.photos.map((p) => ({ name: p.name, url: photoUrl(origin, p.id, secret) }));
      return buildAdminEmail(rec, tpl, links);
    },
    admin,
    rec.order.email
  );
  await run("customer", () => buildCustomerEmail(rec, tpl, admin || "shopitbusinessindia@gmail.com"), rec.order.email, admin);
  return rec;
}

export const publicOrderState = (rec) => ({
  status: rec.status,
  orderId: rec.orderId,
  emailsSent: { admin: !!rec.emails?.admin?.sent, customer: !!rec.emails?.customer?.sent },
});

export function originOf(req) {
  return process.env.SITE_URL || new URL(req.url).origin;
}
