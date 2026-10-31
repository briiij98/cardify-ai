import { Link, useSearchParams } from "react-router-dom";
import { SUPPORT_EMAIL } from "../lib/site";
import { useSeo } from "../lib/useSeo";

export default function PaymentFailure() {
  useSeo("Payment not completed", "Your payment was not completed.");
  const [p] = useSearchParams();
  const reason = (p.get("reason") || "cancelled").slice(0, 200);
  const cancelled = reason === "cancelled";
  return (
    <div className="container-x max-w-xl py-14">
      <div className="card text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 text-2xl text-red-700" aria-hidden="true">!</div>
        <h1 className="mt-4 text-3xl font-medium">{cancelled ? "Payment cancelled" : "Payment failed"}</h1>
        <p className="mt-3 text-muted">{cancelled ? "No payment was completed, and no order has been placed." : `The payment didn't go through (${reason}). No order has been placed.`}</p>
        <p className="mt-2 text-sm text-muted">Your details are still saved in this browser tab, so you can try again.</p>
        <p className="mt-2 text-sm text-muted">If any amount was debited from your account, please email <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with the transaction details.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3"><Link to="/checkout" className="btn-primary">Try payment again</Link><Link to="/contact" className="btn-outline">Contact us</Link></div>
      </div>
    </div>
  );
}
