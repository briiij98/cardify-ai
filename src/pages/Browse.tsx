import { Link, useSearchParams } from "react-router-dom";
import TemplateCard from "../components/TemplateCard";
import { CATEGORIES, LANGUAGE_FILTERS, MAIN_CATEGORY_IDS, categoryLabel, templates } from "../data/categories";
import { useSeo } from "../lib/useSeo";

export type Group = "all" | "hindu-wedding" | "christian-wedding" | "muslim-wedding" | "birthday" | "other-events";

const META: Record<Group, { title: string; blurb: string }> = {
  all: { title: "All Invitations", blurb: "Every video invitation design, ready to customize." },
  "hindu-wedding": { title: "Hindu Wedding Invitations", blurb: "Traditional and illustrated video invitations for Hindu weddings." },
  "christian-wedding": { title: "Christian Wedding Invitations", blurb: "Elegant save-the-date and wedding invitation videos." },
  "muslim-wedding": { title: "Muslim Wedding Invitations", blurb: "Graceful nikah and walima invitation videos." },
  birthday: { title: "Birthday Invitations", blurb: "Fun, personal birthday invitation and wishes videos." },
  "other-events": { title: "Other Events", blurb: "Haldi, mehndi, sangeet, engagement, reception, anniversary, baby shower, housewarming and more." },
};

export default function Browse({ group }: { group: Group }) {
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const lang = params.get("lang") ?? "";
  const cat = params.get("category") ?? "";
  const meta = META[group];
  useSeo(meta.title, meta.blurb);

  const inGroup = templates.filter((t) =>
    group === "all" ? true : group === "other-events" ? !MAIN_CATEGORY_IDS.includes(t.category) : t.category === group
  );
  const catChoices = group === "all" || group === "other-events"
    ? CATEGORIES.filter((c) => inGroup.some((t) => t.category === c.id))
    : [];
  const needle = q.toLowerCase();
  const list = inGroup.filter((t) =>
    (!lang || t.language === lang) &&
    (!cat || t.category === cat) &&
    (!needle || `${t.name} ${t.description} ${categoryLabel(t.category)} ${t.language} ${t.id}`.toLowerCase().includes(needle))
  );

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };
  const filtered = !!(q || lang || cat);

  return (
    <div className="container-x pt-10">
      <div className="text-center">
        <p className="text-sm text-muted"><Link to="/" className="hover:underline">Home</Link> / {meta.title}</p>
        <h1 className="mt-2 text-4xl font-medium sm:text-5xl">{meta.title}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-muted">{meta.blurb}</p>
      </div>

      <div className="mt-8 flex flex-col gap-4 border-y border-line py-4">
        <form role="search" onSubmit={(e) => e.preventDefault()} className="flex max-w-md items-center rounded-full border border-ink/60 bg-white px-4">
          <label htmlFor="filter-q" className="sr-only">Search in this list</label>
          <input id="filter-q" value={q} onChange={(e) => set("q", e.target.value)} maxLength={80} placeholder="Search designs" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" />
        </form>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Language">
          <span className="mr-1 text-sm font-medium">Language:</span>
          <button className={`chip ${!lang ? "chip-active" : ""}`} aria-pressed={!lang} onClick={() => set("lang", "")}>All</button>
          {LANGUAGE_FILTERS.map((l) => (<button key={l} className={`chip ${lang === l ? "chip-active" : ""}`} aria-pressed={lang === l} onClick={() => set("lang", l)}>{l}</button>))}
        </div>
        {catChoices.length > 0 && (
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Event type">
            <span className="mr-1 text-sm font-medium">Event:</span>
            <button className={`chip ${!cat ? "chip-active" : ""}`} aria-pressed={!cat} onClick={() => set("category", "")}>All</button>
            {catChoices.map((c) => (<button key={c.id} className={`chip ${cat === c.id ? "chip-active" : ""}`} aria-pressed={cat === c.id} onClick={() => set("category", c.id)}>{c.label}</button>))}
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-muted" aria-live="polite">{list.length} {list.length === 1 ? "design" : "designs"}</p>

      {list.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
          {list.map((t) => (<TemplateCard key={t.id} t={t} />))}
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-line bg-white p-8 text-center">
          <h2 className="text-2xl">No designs found</h2>
          <p className="mt-2 text-sm text-muted">
            {lang && lang !== "English" && !q && !cat ? `We don't have ${lang} designs in this list yet.` : "Nothing matches your filters."}
          </p>
          {filtered && <button className="btn-outline mt-5" onClick={() => setParams({}, { replace: true })}>Clear filters</button>}
          {!filtered && <Link to="/invitations" className="btn-outline mt-5">See all invitations</Link>}
        </div>
      )}
    </div>
  );
}
