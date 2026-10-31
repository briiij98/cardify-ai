import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateOrder, sniffImage, validDate } from "./validate.mjs";
import { verifyPaymentSignature, verifyWebhookSignature, hmacHex, photoUrl, verifyPhoto } from "./security.mjs";
import { buildAdminEmail, buildCustomerEmail, esc, CUSTOMER_MESSAGE } from "./emails.mjs";

const templates = JSON.parse(readFileSync(new URL("../../src/data/templates.json", import.meta.url)));
const NOW = Date.UTC(2026, 9, 31);
const photoTpl = templates.find((t) => t.photoSlots > 0);
const noPhotoTpl = templates.find((t) => t.photoSlots === 0);
const good = (over = {}) => ({
  fullName: "Asha Patel", email: "Asha@Example.com", whatsapp: "+91 98765 43210",
  templateId: noPhotoTpl.id, category: "hindu-wedding", language: "Gujarati",
  brideName: "Asha", groomName: "Ravi",
  events: [{ name: "Wedding", date: "2026-12-05", time: "18:30", venue: "Grand Hall, Vadodara", details: "" }],
  additionalDetails: "", delivery: "Both", photos: [], termsAccepted: true, ...over,
});

test("valid order passes and is normalised", () => {
  const r = validateOrder(good(), templates, NOW);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.value.email, "asha@example.com");
  assert.equal(r.value.whatsapp, "+919876543210");
});
test("price/amount fields from the client are ignored", () => {
  const r = validateOrder(good({ amount: 1, price: 1 }), templates, NOW);
  assert.equal("amount" in r.value, false);
});
test("rejects missing terms, bad email, past date, bad time, unknown template", () => {
  assert.ok(validateOrder(good({ termsAccepted: false }), templates, NOW).errors.termsAccepted);
  assert.ok(validateOrder(good({ email: "nope" }), templates, NOW).errors.email);
  assert.ok(validateOrder(good({ templateId: "x" }), templates, NOW).errors.templateId);
  const e = good({ events: [{ name: "W", date: "2026-01-01", time: "25:00", venue: "V" }] });
  const r = validateOrder(e, templates, NOW);
  assert.ok(r.errors["events.0.date"]); assert.ok(r.errors["events.0.time"]);
});
test("birthday needs hostNames, not bride/groom", () => {
  const r = validateOrder(good({ category: "birthday", brideName: "", groomName: "" }), templates, NOW);
  assert.ok(r.errors.hostNames);
  assert.equal(validateOrder(good({ category: "birthday", hostNames: "Rhea", brideName: "", groomName: "" }), templates, NOW).ok, true);
});
test("photos limited by template slots and must be uuids", () => {
  const id = "123e4567-e89b-42d3-a456-426614174000";
  assert.ok(validateOrder(good({ photos: [{ id, name: "a.jpg" }] }), templates, NOW).errors.photos);
  assert.equal(validateOrder(good({ templateId: photoTpl.id, photos: [{ id, name: "a.jpg" }] }), templates, NOW).ok, true);
  assert.ok(validateOrder(good({ templateId: photoTpl.id, photos: [{ id: "../x" }] }), templates, NOW).errors.photos);
});
test("event limit enforced", () => {
  const ev = { name: "E", date: "2026-12-05", time: "10:00", venue: "V" };
  assert.ok(validateOrder(good({ events: Array(9).fill(ev) }), templates, NOW).errors.events);
});
test("date helper", () => { assert.equal(validDate("2026-02-30"), false); assert.equal(validDate("2026-02-28"), true); });
test("image sniffing uses bytes", () => {
  assert.equal(sniffImage(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0])).type, "image/jpeg");
  assert.equal(sniffImage(new TextEncoder().encode("<svg onload=alert(1)></svg>")), null);
  assert.equal(sniffImage(new TextEncoder().encode("GIF89a............")), null);
});
test("payment signature verification", () => {
  const sig = hmacHex("secret", "order_A|pay_B");
  assert.equal(verifyPaymentSignature("order_A", "pay_B", sig, "secret"), true);
  assert.equal(verifyPaymentSignature("order_A", "pay_X", sig, "secret"), false);
  assert.equal(verifyPaymentSignature("order_A", "pay_B", "", "secret"), false);
  assert.equal(verifyPaymentSignature("order_A", "pay_B", sig, ""), false);
});
test("webhook signature verification", () => {
  const body = '{"event":"payment.captured"}';
  assert.equal(verifyWebhookSignature(body, hmacHex("wh", body), "wh"), true);
  assert.equal(verifyWebhookSignature(body + " ", hmacHex("wh", body), "wh"), false);
});
test("signed photo links expire and cannot be tampered with", () => {
  const id = "123e4567-e89b-42d3-a456-426614174000";
  const u = new URL(photoUrl("https://x.test", id, "s", 1000, 5000));
  const p = u.searchParams;
  assert.equal(verifyPhoto(id, p.get("exp"), p.get("sig"), "s", 5500), true);
  assert.equal(verifyPhoto(id, p.get("exp"), p.get("sig"), "s", 7000), false);
  assert.equal(verifyPhoto(id.replace("1", "2"), p.get("exp"), p.get("sig"), "s", 5500), false);
});
test("emails contain required fields and escape HTML", () => {
  const order = validateOrder(good({ fullName: "<b>Asha</b>", additionalDetails: "<script>1</script>" }), templates, NOW).value;
  const rec = { orderId: "order_A", paymentId: "pay_B", createdAt: "2026-10-31T05:00:00Z", paidAt: "2026-10-31T05:01:00Z", order };
  const a = buildAdminEmail(rec, noPhotoTpl, [{ name: "a.jpg", url: "https://x.test/p" }]);
  for (const s of ["order_A", "pay_B", "PAID", noPhotoTpl.id, "Grand Hall", "Both", "https://x.test/p", "Gujarati", "Asha"]) assert.ok(a.html.includes(s), s);
  assert.ok(!a.html.includes("<script>")); assert.ok(!a.html.includes("<b>Asha</b>"));
  assert.ok(buildCustomerEmail(rec, noPhotoTpl, "s@x.test").text.includes(CUSTOMER_MESSAGE));
  assert.equal(esc(`<&"'>`), "&lt;&amp;&quot;&#39;&gt;");
});
test("template data sanity", () => {
  assert.equal(templates.length, 29);
  assert.equal(new Set(templates.map((t) => t.id)).size, 29);
  for (const t of templates) { assert.equal(t.price, 999); assert.equal(t.originalPrice, 3999); }
});
