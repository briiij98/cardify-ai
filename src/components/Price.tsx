import type { Template } from "../types";
import { discountPct, inr } from "../data/categories";

export default function Price({ t, large = false }: { t: Template; large?: boolean }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-semibold ${large ? "text-3xl" : "text-lg"}`}>{inr(t.price)}</span>
      <span className={`text-muted line-through ${large ? "text-lg" : "text-sm"}`}><span className="sr-only">Original price </span>{inr(t.originalPrice)}</span>
      <span className={`font-medium text-save ${large ? "text-base" : "text-sm"}`}>({discountPct(t)}% off)</span>
    </p>
  );
}
