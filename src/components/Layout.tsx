import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from "../lib/site";

const NAV = [
  { to: "/invitations", label: "All Invitations" },
  { to: "/hindu-wedding", label: "Hindu Wedding" },
  { to: "/christian-wedding", label: "Christian Wedding" },
  { to: "/muslim-wedding", label: "Muslim Wedding" },
  { to: "/birthday", label: "Birthday" },
  { to: "/other-events", label: "Other Events" },
];

function SearchBox({ className = "" }: { className?: string }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      className={`flex items-center rounded-full border border-ink/70 bg-white pl-5 pr-1 ${className}`}
      onSubmit={(e) => { e.preventDefault(); nav(`/invitations${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); }}
    >
      <label htmlFor="site-search" className="sr-only">Search invitations</label>
      <input id="site-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invitation designs"
        className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted/70" maxLength={80} />
      <button type="submit" aria-label="Search" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-maroon text-white hover:bg-maroon-dark">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      </button>
    </form>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <header className="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur">
        <div className="container-x flex items-center gap-4 py-3">
          <Link to="/" className="font-serif text-2xl font-semibold tracking-tight text-maroon" aria-label="Cardify.ai home">Cardify<span className="text-gold">.ai</span></Link>
          <SearchBox className="hidden flex-1 md:flex" />
          <Link to="/invitations" className="btn-primary ml-auto hidden !py-2 md:inline-flex">Browse designs</Link>
          <button className="ml-auto grid h-10 w-10 place-items-center rounded-full border border-line md:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
          </button>
        </div>
        <nav className="hidden border-t border-line md:block" aria-label="Categories">
          <ul className="container-x flex flex-wrap justify-center gap-x-8 gap-y-1 py-2.5 text-sm font-medium">
            {NAV.map((n) => (
              <li key={n.to}><NavLink to={n.to} className={({ isActive }) => `border-b-2 py-1 ${isActive ? "border-maroon text-maroon" : "border-transparent hover:border-ink/40"}`}>{n.label}</NavLink></li>
            ))}
          </ul>
        </nav>
        {open && (
          <nav id="mobile-nav" className="border-t border-line bg-ivory px-4 pb-4 md:hidden" aria-label="Categories">
            <SearchBox className="my-3" />
            <ul className="grid gap-1">
              {NAV.map((n) => (<li key={n.to}><NavLink to={n.to} className="block rounded-lg px-3 py-2.5 text-base font-medium hover:bg-blush">{n.label}</NavLink></li>))}
              <li><NavLink to="/contact" className="block rounded-lg px-3 py-2.5 text-base font-medium hover:bg-blush">Contact Us</NavLink></li>
            </ul>
          </nav>
        )}
      </header>

      <main id="main" className="flex-1"><Outlet /></main>

      <footer className="mt-20 border-t border-line bg-blush/60">
        <div className="container-x grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="font-serif text-2xl font-semibold text-maroon">Cardify<span className="text-gold">.ai</span></div>
            <p className="mt-1 font-serif italic text-muted">Create. Customize. Celebrate.</p>
            <p className="mt-3 text-sm text-muted">Premium digital invitation videos, customized by hand and delivered within 24 hours.</p>
          </div>
          <div>
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wide">Shop</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">{NAV.map((n) => (<li key={n.to}><Link className="hover:text-ink hover:underline" to={n.to}>{n.label}</Link></li>))}</ul>
          </div>
          <div>
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wide">Help</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link className="hover:text-ink hover:underline" to="/contact">Contact Us</Link></li>
              <li><Link className="hover:text-ink hover:underline" to="/terms">Terms &amp; Conditions</Link></li>
              <li><Link className="hover:text-ink hover:underline" to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h2 className="font-sans text-sm font-semibold uppercase tracking-wide">Contact</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><a className="hover:text-ink hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></li>
              {SUPPORT_WHATSAPP && <li><a className="hover:text-ink hover:underline" href={`https://wa.me/${SUPPORT_WHATSAPP}`} target="_blank" rel="noreferrer">WhatsApp us</a></li>}
              <li>Payments secured by Razorpay</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line py-4 text-center text-xs text-muted">© {new Date().getFullYear()} Cardify.ai. All rights reserved.</div>
      </footer>
    </div>
  );
}
