import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import Price from "../components/Price";
import { categoryLabel, findTemplate, inr } from "../data/categories";
import { ApiError, createOrder } from "../lib/api";
import { loadDraft, savePayment } from "../lib/draft";
import { loadRazorpay } from "../lib/razorpay";
import { useSeo } from "../lib/useSeo";
import { validateDraft } from "../lib/validation";

const fmtDate = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", weekday: "long" }); };
const fmtTime = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };

export default function Checkout() {
  useSeo("Review & Pay", "Review your invitation details and pay securely with Razorpay.");
  const nav = useNavigate();
  const [d] = useState(loadDraft);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showTermsErr, setShowTermsErr] = useState(false);
  const tpl = d ? findTemplate(d.templateId) : undefined;

  if (!d || !tpl) return <Navigate to="/invitations" replace />;
  if (Object.keys(validateDraft(d, tpl)).length > 0) return <Navigate to={`/customize/${tpl.id.toLowerCase()}`} replace />;
  const couple = !!d.brideName;

  async function pay() {
    setMsg("");
    if (!agree) { setShowTermsErr(true); document.getElementById("agree")?.focus(); return; }
    setBusy(true);
    try {
      const [loaded, order] = await Promise.all([loadRazorpay(), createOrder(d!)]);
      if (!loaded || !window.Razorpay) throw new Error("Could not load the payment window. Check your connection and try again.");
      let lastError = "";
      let finished = false;
      const rz = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.orderId,
        name: "Cardify.ai", description: `${tpl!.name} (${tpl!.id})`,
        prefill: { name: d!.fullName, email: d!.email, contact: d!.whatsapp },
        theme: { color: "#7b1e2e" },
        handler: (r) => { finished = true; savePayment(r); nav("/payment-success"); },
        modal: { ondismiss: () => { if (finished) return; setBusy(false); nav(`/payment-failure?reason=${encodeURIComponent(lastError || "cancelled")}`); } },
      });
      rz.on("payment.failed", (r) => { lastError = r.error?.description || "Payment failed"; });
      rz.open();
      setBusy(false);
    } catch (e) {
      setBusy(false);
      if (e instanceof ApiError && e.status === 422) setMsg("Some details need fixing. Please go back and review your form.");
      else setMsg(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    }
  }

  const row = (k: string, v: string) => (<div className="flex justify-between gap-4 py-2 text-sm"><dt className="text-muted">{k}</dt><dd className="max-w-[65%] text-right font-medium">{v}</dd></div>);

  return (
    <div className="container-x max-w-4xl pt-8">
      <h1 className="text-3xl font-medium sm:text-4xl">Review your order</h1>
      <p className="mt-1 text-sm text-muted">Please check every name, date and spelling. We'll use these exactly as written.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="card"><div className="flex items-center justify-between"><h2 className="text-xl">Your details</h2><Link className="text-sm underline" to={`/customize/${tpl.id.toLowerCase()}`}>Edit</Link></div>
            <dl className="mt-2 divide-y divide-line">{row("Name", d.fullName)}{row("Email", d.email)}{row("WhatsApp", d.whatsapp)}{row("Delivery", d.delivery)}</dl></section>
          <section className="card"><h2 className="text-xl">Invitation</h2>
            <dl className="mt-2 divide-y divide-line">{row("Template", `${tpl.name} (${tpl.id})`)}{row("Category", categoryLabel(d.category))}{row("Language", d.language)}
              {couple ? <>{row("Bride", d.brideName)}{row("Groom", d.groomName)}</> : row("Name(s)", d.hostNames)}
              {d.photos.length > 0 && row("Photos", d.photos.map((p) => p.name).join(", "))}
              {d.additionalDetails && row("Notes", d.additionalDetails)}</dl></section>
          <section className="card"><h2 className="text-xl">Events</h2>
            <ol className="mt-3 space-y-3">{d.events.map((e, i) => (
              <li key={i} className="rounded-xl bg-ivory p-4 text-sm"><p className="font-semibold">{i + 1}. {e.name}</p><p>{fmtDate(e.date)}, {fmtTime(e.time)}</p><p className="whitespace-pre-line text-muted">{e.venue}</p>{e.details && <p className="mt-1 whitespace-pre-line text-muted">{e.details}</p>}</li>))}</ol></section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card">
            <div className="flex gap-3"><img src={tpl.thumbnail} alt="" className="h-24 w-16 rounded-md object-cover object-top" /><div><p className="font-medium">{tpl.name}</p><div className="mt-1"><Price t={tpl} /></div></div></div>
            <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-semibold"><span>Total</span><span>{inr(tpl.price)}</span></div>
            <p className="mt-3 text-xs text-muted">Your invitation is customized manually after successful payment and delivered within 24 hours, once we have complete and accurate information.</p>
            <div className="mt-4 flex items-start gap-2">
              <input id="agree" type="checkbox" checked={agree} onChange={(e) => { setAgree(e.target.checked); if (e.target.checked) setShowTermsErr(false); }} className="mt-1 h-4 w-4 accent-[#7b1e2e]" aria-describedby={showTermsErr ? "agree-err" : undefined} aria-invalid={showTermsErr} />
              <label htmlFor="agree" className="text-sm">I have read and agree to the <Link to="/terms" target="_blank" className="underline">Terms &amp; Conditions</Link>.</label>
            </div>
            {showTermsErr && <p id="agree-err" role="alert" className="mt-1 text-xs font-medium text-red-700">Please accept the Terms &amp; Conditions to continue.</p>}
            {msg && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{msg}</p>}
            <button className="btn-primary mt-4 w-full" onClick={pay} disabled={busy}>{busy ? "Starting secure payment…" : `Pay ${inr(tpl.price)} securely`}</button>
            <p className="mt-3 text-center text-xs text-muted">Payments are processed by Razorpay (UPI, cards, netbanking, wallets).</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
