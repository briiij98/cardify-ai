import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from "../lib/site";
import { useSeo } from "../lib/useSeo";

export default function Contact() {
  useSeo("Contact Us", "Get in touch with Cardify.ai about your invitation order.");
  return (
    <div className="container-x max-w-2xl pt-12">
      <h1 className="text-center text-4xl font-medium">Contact us</h1>
      <p className="mt-3 text-center text-muted">Questions about a design, your order or a correction? We're happy to help.</p>
      <div className="card mt-8 space-y-6">
        <div><h2 className="text-xl">Email</h2><p className="mt-1 text-sm text-muted">Best for order questions and corrections.</p><a className="btn-primary mt-3" href={`mailto:${SUPPORT_EMAIL}?subject=Cardify.ai%20support`}>{SUPPORT_EMAIL}</a></div>
        {SUPPORT_WHATSAPP && <div><h2 className="text-xl">WhatsApp</h2><p className="mt-1 text-sm text-muted">Message us with your Order ID.</p><a className="btn-outline mt-3" href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noreferrer">Chat on WhatsApp</a></div>}
        <div className="rounded-xl bg-blush/70 p-4 text-sm"><p className="font-medium">Helpful to include</p><p className="mt-1 text-muted">Your Order ID (starts with “order_”), the name on your order, and what you need help with. Custom invitations are delivered within 24 hours of successful payment and complete details.</p></div>
      </div>
    </div>
  );
}
