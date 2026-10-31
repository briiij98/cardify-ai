import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import CategoryTiles from "../components/CategoryTiles";
import TemplateCard from "../components/TemplateCard";
import { templates } from "../data/categories";
import { useSeo } from "../lib/useSeo";

const STEPS = [
  ["1", "Choose a design", "Browse video invitations by event, religion and language, and preview each one."],
  ["2", "Share your details", "Tell us the names, dates, venues and add photos if the design uses them."],
  ["3", "Pay ₹999 securely", "Check out through Razorpay. Your order is confirmed by email after payment."],
  ["4", "Receive your video", "We customize it by hand and send it to your WhatsApp and/or email within 24 hours."],
];

export default function Home() {
  useSeo("Cardify.ai | Premium Digital Invitation Videos for Indian Weddings & Celebrations", "Browse elegant video invitations for Hindu, Christian and Muslim weddings, birthdays and more. Customized for you and delivered within 24 hours for ₹999.");
  const nav = useNavigate();
  const [q, setQ] = useState("");
  // One featured design per category so the grid shows variety.
  const seen = new Set<string>();
  const featured = templates.filter((t) => (seen.has(t.category) ? false : (seen.add(t.category), true)));
  const more = templates.filter((t) => !featured.includes(t)).slice(0, Math.max(0, 8 - featured.length));

  return (
    <>
      <section className="bg-blush">
        <div className="container-x pb-10 pt-12 text-center sm:pt-16">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-gold">Premium digital invitations</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-medium leading-tight sm:text-6xl">Create. Customize. Celebrate.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink/80">Beautiful invitation videos for weddings, birthdays and every celebration, personalized with your details and delivered within 24 hours.</p>
          <form role="search" className="mx-auto mt-7 flex max-w-xl items-center rounded-full border border-ink/70 bg-white pl-5 pr-1" onSubmit={(e) => { e.preventDefault(); nav(`/invitations${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); }}>
            <label htmlFor="home-search" className="sr-only">Search invitations</label>
            <input id="home-search" value={q} onChange={(e) => setQ(e.target.value)} maxLength={80} placeholder="Try “sangeet”, “maroon” or “birthday”" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" />
            <button className="btn-primary !px-6 !py-2.5">Search</button>
          </form>
          <p className="mt-4 text-sm"><span className="font-semibold">₹999</span> per invitation <span className="mx-1 text-muted line-through">₹3,999</span></p>
        </div>
        <div className="container-x pb-14 pt-4"><CategoryTiles /></div>
      </section>

      <section className="container-x mt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-medium">Featured invitations</h2>
          <Link to="/invitations" className="text-sm font-medium underline underline-offset-4">View all {templates.length} designs</Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {[...featured, ...more].slice(0, 8).map((t) => (<TemplateCard key={t.id} t={t} />))}
        </div>
      </section>

      <section className="container-x mt-20">
        <h2 className="text-center text-3xl font-medium">How it works</h2>
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([n, t, d]) => (
            <li key={n} className="card">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-maroon font-serif text-lg text-white">{n}</span>
              <h3 className="mt-4 text-xl">{t}</h3>
              <p className="mt-1.5 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-x mt-20">
        <div className="grid gap-8 rounded-3xl border border-line bg-white p-7 sm:p-10 lg:grid-cols-3">
          <div><h3 className="text-xl">Customized by hand</h3><p className="mt-2 text-sm text-muted">Every invitation is personalized by a real person, so your names, dates and spellings are set carefully rather than auto-generated.</p></div>
          <div><h3 className="text-xl">Ready within 24 hours</h3><p className="mt-2 text-sm text-muted">Delivery is within 24 hours after successful payment and receipt of complete, accurate details.</p></div>
          <div><h3 className="text-xl">Secure checkout</h3><p className="mt-2 text-sm text-muted">Payments are processed by Razorpay. We never see or store your card or UPI details.</p></div>
        </div>
      </section>

      <section className="container-x mt-16 text-center">
        <h2 className="text-3xl font-medium">Ready to invite your guests?</h2>
        <Link to="/invitations" className="btn-primary mt-5">Browse all invitations</Link>
      </section>
    </>
  );
}
