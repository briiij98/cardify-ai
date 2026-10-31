import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SUPPORT_EMAIL, TERMS_UPDATED } from "../lib/site";
import { useSeo } from "../lib/useSeo";

function Doc({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="container-x max-w-3xl pt-12">
      <h1 className="text-4xl font-medium">{title}</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {TERMS_UPDATED}</p>
      <div className="mt-8 space-y-8 text-[15px] leading-relaxed [&_h2]:mb-2 [&_h2]:text-2xl [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
    </div>
  );
}
const Mail = () => <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;

export function Terms() {
  useSeo("Terms & Conditions", "Terms for ordering customized invitation videos from Cardify.ai.");
  return (
    <Doc title="Terms & Conditions">
      <section><h2>1. About our service</h2><p>Cardify.ai sells digital invitation video designs that we customize for you. Every order is a digital service. We customize each invitation manually after payment; there is no online editor and you do not receive editing access to our design files.</p></section>
      <section><h2>2. Price</h2><p>The price is ₹999 per invitation, shown on each design page, inclusive of all charges. The price you see at checkout is the price you pay.</p></section>
      <section><h2>3. Placing an order</h2><p>You choose a design, enter your details, review them, accept these Terms and pay through Razorpay. Your order is accepted only after we have received verified confirmation of your payment.</p></section>
      <section><h2>4. Delivery</h2><ul>
        <li>Orders are customized manually after successful payment.</li>
        <li>Expected delivery is within 24 hours after successful payment and receipt of complete and accurate information.</li>
        <li>Your finished video is sent to the WhatsApp number and/or email address you chose. Please make sure both are correct.</li>
        <li>If we need clarification (for example, a missing detail or an unreadable photo), the 24 hours start once we have the information we need.</li></ul></section>
      <section><h2>5. Your information</h2><p>You are responsible for the correctness of the names, dates, times, venues, spellings and other information you submit, and for having the right to use any photos you upload. We use your information exactly as submitted. Please review your order carefully before paying.</p></section>
      <section><h2>6. Corrections and revisions</h2><ul>
        <li>If our final video does not match the details you submitted, we will correct it free of charge.</li>
        <li>If you notice an error in the information you submitted, or want a small text correction, tell us within 48 hours of delivery and we will make one round of corrections to the text and details at no extra charge.</li>
        <li>Further changes, redesigns, or switching to a different design are not included and may be offered at our discretion, possibly for an additional fee.</li>
        <li>We do not offer unlimited revisions.</li></ul></section>
      <section><h2>7. Refunds and cancellations</h2><ul>
        <li>Because customization is a digital service that begins shortly after payment, payments are non-refundable after customization work has started, subject to applicable law.</li>
        <li>A change of mind or dissatisfaction alone does not automatically qualify for a refund.</li>
        <li>If you need to cancel, contact us as soon as possible. If work has not yet started we may cancel and refund your payment.</li>
        <li>Approved refunds are returned to the original payment method. The time taken depends on your bank or payment provider.</li></ul></section>
      <section><h2>8. If we cannot fulfill your order</h2><p>If we are unable to complete your order, for example because a design becomes unavailable or we cannot complete the customization from the information provided, we will contact you. We will offer to complete it with an alternative design or, if you prefer, refund the amount you paid in full.</p></section>
      <section><h2>9. Intellectual property</h2><p>Designs and templates remain the property of Cardify.ai and its licensors. Your finished invitation video is provided for your personal use to invite your guests to your event. You may not resell or redistribute our designs.</p></section>
      <section><h2>10. Your legal rights</h2><p>Nothing in these Terms limits any right you have under mandatory consumer protection laws that apply to you.</p></section>
      <section><h2>11. Contact</h2><p>Questions about these Terms or your order: <Mail />. See also our <Link className="underline" to="/privacy">Privacy Policy</Link> and <Link className="underline" to="/contact">Contact page</Link>.</p></section>
    </Doc>
  );
}

export function Privacy() {
  useSeo("Privacy Policy", "How Cardify.ai collects, uses and protects your information.");
  return (
    <Doc title="Privacy Policy">
      <section><h2>What we collect</h2><ul>
        <li>Your name, email address and WhatsApp number.</li>
        <li>Your invitation details: names, event names, dates, times, venues, notes, selected design, language and delivery preference.</li>
        <li>Photos you choose to upload, if the design uses photos.</li>
        <li>Order and payment reference IDs and the payment status. We do not receive or store your card, UPI or bank details.</li></ul></section>
      <section><h2>Why we need it</h2><p>We use this information to customize your invitation, deliver it to you, send your order confirmation, and help you if something needs correcting. We do not use it for anything else.</p></section>
      <section><h2>Photos</h2><p>Uploaded photos are kept in private storage that is not publicly listed. We open them through private links to create your invitation. Photos are used only to make your invitation. You may ask us to delete them at any time.</p></section>
      <section><h2>Payments</h2><p>Payments are processed by Razorpay on its own secure payment page. Razorpay collects and handles your payment details under its own privacy policy. We receive only confirmation that the payment succeeded, plus its reference IDs.</p></section>
      <section><h2>Who we share it with</h2><p>We do not sell your information. We share it only with service providers needed to run the service: Razorpay (payments), Resend (sending emails) and Netlify (website hosting and storage).</p></section>
      <section><h2>On your device</h2><p>While you fill in the order form, your entries are kept in your browser's session storage so you don't lose them. This stays on your device and is cleared when you close the tab. We do not use advertising cookies.</p></section>
      <section><h2>How long we keep it</h2><p>We keep order details and photos only as long as needed to deliver your order, handle corrections and support requests, and meet legal or accounting needs.</p></section>
      <section><h2>Your choices</h2><p>You can ask to see, correct or delete the information we hold about you. Email <Mail /> and include your Order ID. We may need to keep some records where the law requires it.</p></section>
      <section><h2>Security</h2><p>We use encrypted (HTTPS) connections and restrict access to order data and photos. No online service can be guaranteed completely secure, so please share only what the invitation needs.</p></section>
      <section><h2>Changes</h2><p>We may update this policy and will change the date above when we do. Questions: <Mail />.</p></section>
    </Doc>
  );
}
