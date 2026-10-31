// Email content builders (pure) and the Resend sender.
import { CATEGORY_LABELS, PRICE_INR } from "./validate.mjs";

export const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function fmtDate(d) {
  const dt = new Date(d + "T00:00:00Z");
  if (Number.isNaN(dt.getTime())) return d;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", weekday: "long", timeZone: "UTC" }).format(dt);
}
export function fmtTime(t) {
  const [h, m] = String(t).split(":").map(Number);
  if (Number.isNaN(h)) return t;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
export function fmtStamp(iso) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(iso)) + " IST";
}

export const CUSTOMER_MESSAGE =
  "Thank you for your order! Your invitation customization request has been received successfully. Your customized invitation video will be delivered to your registered WhatsApp number and/or email within 24 hours.";

/** rec = stored order record; template = template object; photoLinks = [{name,url}] */
export function buildAdminEmail(rec, template, photoLinks) {
  const o = rec.order;
  const row = (k, v) =>
    `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#6b625b;width:190px;vertical-align:top">${esc(k)}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;vertical-align:top">${v}</td></tr>`;
  const section = (t) => `<tr><td colspan="2" style="padding:18px 12px 6px;font-weight:700;color:#7b1e2e;font-size:15px">${esc(t)}</td></tr>`;
  const nl = (s) => esc(s).replace(/\n/g, "<br>");

  const names = o.brideName
    ? row("Bride", esc(o.brideName)) + row("Groom", esc(o.groomName))
    : row("Name(s) on invitation", esc(o.hostNames));
  const events = o.events
    .map(
      (e, i) =>
        `<div style="margin:0 0 10px;padding:10px 12px;background:#faf8f5;border-radius:6px"><b>${i + 1}. ${esc(e.name)}</b><br>${esc(fmtDate(e.date))}, ${esc(fmtTime(e.time))}<br>Venue: ${nl(e.venue)}${e.details ? `<br>Details: ${nl(e.details)}` : ""}</div>`
    )
    .join("");
  const photos = photoLinks.length
    ? photoLinks.map((p) => `<a href="${esc(p.url)}">${esc(p.name)}</a>`).join("<br>")
    : "No photos uploaded";

  const html = `<!doctype html><html><body style="margin:0;background:#f4f1ed;font-family:Arial,Helvetica,sans-serif;color:#222">
<div style="max-width:680px;margin:0 auto;padding:20px">
<div style="background:#7b1e2e;color:#fff;padding:18px 22px;border-radius:8px 8px 0 0"><div style="font-size:12px;letter-spacing:2px;opacity:.8">CARDIFY.AI</div><div style="font-size:20px;font-weight:700;margin-top:4px">New paid order, ₹${PRICE_INR}</div></div>
<table style="width:100%;border-collapse:collapse;background:#fff;font-size:14px;line-height:1.5">
${section("Payment")}
${row("Order ID", `<b>${esc(rec.orderId)}</b>`)}
${row("Payment status", "PAID (verified server-side)")}
${row("Payment ID", esc(rec.paymentId))}
${row("Order submitted", esc(fmtStamp(rec.createdAt)))}
${row("Payment verified", esc(fmtStamp(rec.paidAt)))}
${section("Customer")}
${row("Name", esc(o.fullName))}
${row("Email", `<a href="mailto:${esc(o.email)}">${esc(o.email)}</a>`)}
${row("WhatsApp", `<a href="https://wa.me/${esc(o.whatsapp.replace(/^\+/, ""))}">${esc(o.whatsapp)}</a>`)}
${row("Delivery preference", `<b>${esc(o.delivery)}</b>`)}
${section("Invitation")}
${row("Template", `${esc(template ? template.name : o.templateId)} (<b>${esc(o.templateId)}</b>)`)}
${row("Canva source file", esc(template ? template.sourceFile : "-"))}
${row("Category", esc(CATEGORY_LABELS[o.category] || o.category))}
${row("Language", esc(o.language))}
${names}
${section("Events")}
<tr><td colspan="2" style="padding:6px 12px 12px">${events}</td></tr>
${o.additionalDetails ? row("Additional details", nl(o.additionalDetails)) : ""}
${section("Photos (links valid for 30 days)")}
<tr><td colspan="2" style="padding:6px 12px 14px">${photos}</td></tr>
</table>
<div style="padding:14px 4px;font-size:12px;color:#7a716a">Deliver within 24 hours of payment. Reply to this email to contact the customer directly.</div>
</div></body></html>`;

  const text = [
    `NEW PAID ORDER (₹${PRICE_INR})`,
    `Order ID: ${rec.orderId}`,
    `Payment status: PAID (verified server-side)`,
    `Payment ID: ${rec.paymentId}`,
    `Order submitted: ${fmtStamp(rec.createdAt)}`,
    `Payment verified: ${fmtStamp(rec.paidAt)}`,
    ``,
    `Customer: ${o.fullName}`,
    `Email: ${o.email}`,
    `WhatsApp: ${o.whatsapp}`,
    `Delivery: ${o.delivery}`,
    ``,
    `Template: ${template ? template.name : ""} (${o.templateId})`,
    `Canva source file: ${template ? template.sourceFile : "-"}`,
    `Category: ${CATEGORY_LABELS[o.category] || o.category}`,
    `Language: ${o.language}`,
    o.brideName ? `Bride: ${o.brideName}\nGroom: ${o.groomName}` : `Name(s): ${o.hostNames}`,
    ``,
    ...o.events.map((e, i) => `Event ${i + 1}: ${e.name}\n  ${fmtDate(e.date)}, ${fmtTime(e.time)}\n  Venue: ${e.venue}${e.details ? `\n  Details: ${e.details}` : ""}`),
    o.additionalDetails ? `\nAdditional details: ${o.additionalDetails}` : "",
    ``,
    `Photos:`,
    ...(photoLinks.length ? photoLinks.map((p) => `  ${p.name}: ${p.url}`) : ["  none"]),
  ].join("\n");

  return {
    subject: `New paid order ${rec.orderId}: ${template ? template.name : o.templateId} (₹${PRICE_INR})`,
    html,
    text,
  };
}

export function buildCustomerEmail(rec, template, supportEmail) {
  const o = rec.order;
  const html = `<!doctype html><html><body style="margin:0;background:#f4f1ed;font-family:Arial,Helvetica,sans-serif;color:#222">
<div style="max-width:560px;margin:0 auto;padding:20px">
<div style="background:#fff;border-radius:8px;overflow:hidden">
<div style="background:#7b1e2e;color:#fff;padding:18px 22px"><div style="font-size:12px;letter-spacing:2px;opacity:.8">CARDIFY.AI</div><div style="font-size:19px;font-weight:700;margin-top:4px">Order received</div></div>
<div style="padding:22px;font-size:15px;line-height:1.6">
<p style="margin-top:0">Hi ${esc(o.fullName)},</p>
<p>${esc(CUSTOMER_MESSAGE)}</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
<tr><td style="padding:6px 0;color:#6b625b">Order ID</td><td style="padding:6px 0;text-align:right"><b>${esc(rec.orderId)}</b></td></tr>
<tr><td style="padding:6px 0;color:#6b625b">Payment ID</td><td style="padding:6px 0;text-align:right">${esc(rec.paymentId)}</td></tr>
<tr><td style="padding:6px 0;color:#6b625b">Invitation</td><td style="padding:6px 0;text-align:right">${esc(template ? template.name : o.templateId)}</td></tr>
<tr><td style="padding:6px 0;color:#6b625b">Amount paid</td><td style="padding:6px 0;text-align:right">₹${PRICE_INR}</td></tr>
<tr><td style="padding:6px 0;color:#6b625b">Delivery</td><td style="padding:6px 0;text-align:right">${esc(o.delivery)}</td></tr>
</table>
<p>Please check your details once. If you spot a mistake, reply to this email as soon as possible so we can correct it before delivery.</p>
<p style="color:#6b625b;font-size:13px">Questions? Write to <a href="mailto:${esc(supportEmail)}">${esc(supportEmail)}</a>.</p>
</div></div></div></body></html>`;
  const text = `Hi ${o.fullName},\n\n${CUSTOMER_MESSAGE}\n\nOrder ID: ${rec.orderId}\nPayment ID: ${rec.paymentId}\nInvitation: ${template ? template.name : o.templateId}\nAmount paid: ₹${PRICE_INR}\nDelivery: ${o.delivery}\n\nIf you spot a mistake in your details, reply to this email as soon as possible.\nSupport: ${supportEmail}\n`;
  return { subject: `Cardify.ai order received (${rec.orderId})`, html, text };
}

export async function sendEmail({ apiKey, from, to, subject, html, text, replyTo, idempotencyKey }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({ from, to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}
