import { useState } from "react";
import { Link } from "react-router-dom";
import type { Template } from "../types";
import { categoryLabel } from "../data/categories";
import Price from "./Price";

export default function TemplateCard({ t }: { t: Template }) {
  const [hover, setHover] = useState(false);
  // Hover preview only on devices with a real pointer; phones tap through to the full preview.
  const canHover = typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
  return (
    <article className="group fade-up">
      <Link to={`/invitation/${t.id.toLowerCase()}`} className="block" onMouseEnter={() => canHover && setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => canHover && setHover(true)} onBlur={() => setHover(false)}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-blush">
          <img src={t.thumbnail} alt={`${t.name} invitation preview`} loading="lazy" className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.02]" />
          {hover && <video src={t.video} autoPlay muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover object-top" aria-hidden="true" />}
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium">Video invitation</span>
        </div>
        <h3 className="mt-3 truncate font-sans text-[15px] font-medium group-hover:underline">{t.name}</h3>
        <p className="mt-0.5 text-xs text-muted">{categoryLabel(t.category)} · {t.language}</p>
        <div className="mt-1.5"><Price t={t} /></div>
        <p className="mt-1 text-xs text-muted">Delivered within 24 hours</p>
      </Link>
    </article>
  );
}
