import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { verifyPayment } from "../lib/api";
import type { VerifyResult } from "../lib/api";
import { clearDraft, clearPayment, loadPayment } from "../lib/draft";
import { SUPPORT_EMAIL } from "../lib/site";
import { useSeo } from "../lib/useSeo";

type View = "verifying" | "paid" | "pending" | "failed" | "error" | "none";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function PaymentSuccess() {
  useSeo("Order confirmation", "Your Cardify.ai order status.");
  const [pay] = useState(loadPayment);
  const [view, setView] = useState<View>(pay ? "verifying" : "none");
  const [res, setRes] = useState<VerifyResult | null>(null);
  const [run, setRun] = useState(0);
  const cancelled = useRef(false);

  const verify = useCallback(async () => {
    if (!pay) return;
    setView("verifying");
    let emailRetries = 0;
    for (let i = 0; i < 12 && !cancelled.current; i++) {
      try {
        const r = await verifyPayment(pay);
        if (cancelled.current) return;
        if (r.status === "paid") {
          setRes(r); setView("paid"); clearDraft();
          if (r.emailsSent?.admin && r.emailsSent?.customer) { clearPayment(); return; }
          if (emailRetries++ >= 2) return; // keep the payment reference so a reload can try again
          await sleep(5000); continue;
        }
        if (r.status === "pending") { setView("pending"); await sleep(5000); continue; }
        setView("failed"); return;
      } catch {
        if (!cancelled.current) setView("error");
        return;
      }
    }
  }, [pay]);

  useEffect(() => { cancelled.current = false; verify(); return () => { cancelled.current = true; }; }, [verify, run]);

  const emailsOk = !!(res?.emailsSent?.admin && res?.emailsSent?.customer);

  return (
    <div className="container-x max-w-xl py-14 text-center">
      {view === "verifying" && (<div role="status"><span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-line border-t-maroon" /><h1 className="mt-5 text-3xl font-medium">Confirming your payment…</h1><p className="mt-2 text-muted">Please don't close this page.</p></div>)}

      {view === "pending" && (<div role="status"><span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-line border-t-gold" /><h1 className="mt-5 text-3xl font-medium">Payment is still processing</h1><p className="mt-2 text-muted">Your bank hasn't confirmed the payment yet. We'll keep checking. If money was debited, your order is confirmed automatically once it succeeds.</p></div>)}

      {view === "paid" && res && (
        <div className="card text-left">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-save text-2xl text-white" aria-hidden="true">✓</div>
          <h1 className="mt-4 text-center text-3xl font-medium">Payment successful</h1>
          <p className="mt-3 text-center text-sm text-muted">Order ID</p>
          <p className="text-center font-mono text-lg font-semibold">{res.orderId}</p>
          <p className="mt-5">Thank you for your order! Your invitation customization request has been received successfully. Your customized invitation video will be delivered to your registered WhatsApp number and/or email within 24 hours.</p>
          {emailsOk ? (
            <p className="mt-3 text-sm text-muted">A confirmation email is on its way to you. If you don't see it, check your spam folder.</p>
          ) : (
            <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Your payment is confirmed and your order is recorded, but our confirmation email is delayed and we're retrying. Please save your Order ID above, and contact <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> if you don't hear from us.</p>
          )}
          <div className="mt-6 text-center"><Link to="/invitations" className="btn-outline">Browse more designs</Link></div>
        </div>
      )}

      {view === "failed" && (<div className="card"><h1 className="text-3xl font-medium">We couldn't confirm your payment</h1><p className="mt-3 text-muted">This payment wasn't verified, so no order was placed. If money was debited from your account, please email <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your transaction details.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link to="/checkout" className="btn-primary">Try again</Link><Link to="/contact" className="btn-outline">Contact us</Link></div></div>)}

      {view === "error" && (<div className="card"><h1 className="text-3xl font-medium">Couldn't reach our server</h1><p className="mt-3 text-muted">Your payment may have gone through. Please don't pay again yet. Check again below, or contact us.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><button className="btn-primary" onClick={() => setRun((n) => n + 1)}>Check again</button><Link to="/contact" className="btn-outline">Contact us</Link></div></div>)}

      {view === "none" && (<div className="card"><h1 className="text-3xl font-medium">No recent payment found</h1><p className="mt-3 text-muted">If you've just paid, check your email for a confirmation, or contact us with your payment details.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link to="/invitations" className="btn-primary">Browse designs</Link><Link to="/contact" className="btn-outline">Contact us</Link></div></div>)}
    </div>
  );
}
