import crypto from "node:crypto";

export function hmacHex(secret, message) {
  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

export function safeEqual(a, b) {
  const x = Buffer.from(String(a ?? ""));
  const y = Buffer.from(String(b ?? ""));
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

/** Razorpay checkout signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret) */
export function verifyPaymentSignature(orderId, paymentId, signature, keySecret) {
  if (!orderId || !paymentId || !signature || !keySecret) return false;
  return safeEqual(hmacHex(keySecret, `${orderId}|${paymentId}`), signature);
}

/** Razorpay webhook signature: HMAC_SHA256(raw_body, webhook_secret) */
export function verifyWebhookSignature(rawBody, signature, webhookSecret) {
  if (!rawBody || !signature || !webhookSecret) return false;
  return safeEqual(hmacHex(webhookSecret, rawBody), signature);
}

export function signPhoto(id, exp, secret) {
  return hmacHex(secret, `photo:${id}:${exp}`);
}
export function verifyPhoto(id, exp, sig, secret, now = Date.now()) {
  const e = Number(exp);
  if (!Number.isFinite(e) || e < now) return false;
  return safeEqual(signPhoto(id, e, secret), sig);
}
export function photoUrl(origin, id, secret, ttlMs = 30 * 24 * 3600 * 1000, now = Date.now()) {
  const exp = now + ttlMs;
  const sig = signPhoto(id, exp, secret);
  return `${origin}/api/photo?id=${encodeURIComponent(id)}&exp=${exp}&sig=${sig}`;
}
