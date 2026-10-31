import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Price from "../components/Price";
import TemplateCard from "../components/TemplateCard";
import { categoryLabel, findTemplate, templates } from "../data/categories";
import { useSeo } from "../lib/useSeo";
import NotFound from "./NotFound";

export default function TemplateDetail() {
  const { id } = useParams();
  const t = findTemplate(id);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  useSeo(t ? `${t.name} Invitation Video` : "Invitation not found", t ? t.description : "This invitation could not be found.", t?.thumbnail);
  if (!t) return <NotFound />;

  const related = templates.filter((x) => x.category === t.category && x.id !== t.id).slice(0, 4);
  const retry = () => { setFailed(false); setLoaded(false); ref.current?.load(); };

  return (
    <div className="container-x pt-8">
      <p className="text-sm text-muted"><Link to="/" className="hover:underline">Home</Link> / <Link to="/invitations" className="hover:underline">All Invitations</Link> / {t.name}</p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-14">
        <div className="mx-auto w-full max-w-[420px]">
          <div className="relative overflow-hidden rounded-2xl bg-ink shadow-sm" style={{ aspectRatio: "9 / 16" }}>
            {!failed && (
              <video ref={ref} key={t.id} src={t.video} poster={t.thumbnail} controls playsInline muted loop autoPlay preload="metadata" className="h-full w-full object-contain"
                onLoadedData={() => setLoaded(true)} onCanPlay={() => setLoaded(true)} onError={() => setFailed(true)} aria-label={`${t.name} preview video`} />
            )}
            {!loaded && !failed && (<div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/30" role="status"><span className="h-9 w-9 animate-spin rounded-full border-2 border-white/40 border-t-white" /><span className="sr-only">Loading preview</span></div>)}
            {failed && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center text-white" role="alert">
                <div><img src={t.thumbnail} alt="" className="mx-auto mb-4 w-40 rounded-lg opacity-80" /><p className="text-sm">The preview video couldn't load.</p><button className="btn-outline mt-3 !border-white !text-white hover:!bg-white hover:!text-ink" onClick={retry}>Try again</button></div>
              </div>
            )}
          </div>
          <p className="mt-2 text-center text-xs text-muted">Preview uses sample names and dates. Yours will be added by us.</p>
        </div>

        <div>
          <p className="text-sm text-muted">{categoryLabel(t.category)} · Template {t.id}</p>
          <h1 className="mt-1 text-3xl font-medium sm:text-4xl">{t.name}</h1>
          <div className="mt-4"><Price t={t} large /></div>
          <p className="mt-1 text-sm text-muted">Inclusive of all charges. One-time price per invitation.</p>
          <p className="mt-5 text-ink/85">{t.description}</p>

          <Link to={`/customize/${t.id.toLowerCase()}`} className="btn-primary mt-6 w-full sm:w-auto sm:min-w-[300px]">Customize This Invitation</Link>

          <dl className="mt-8 divide-y divide-line rounded-2xl border border-line bg-white text-sm">
            {[
              ["Template ID", t.id], ["Category", categoryLabel(t.category)], ["Template text language", t.language],
              ["Photos", t.photoSlots > 0 ? `Optional, up to ${t.photoSlots}` : "Not needed for this design"],
              ["Format", "Vertical video (9:16), made for WhatsApp and social"],
              ["Delivery", "Within 24 hours of payment and complete details"],
            ].map(([k, v]) => (<div key={k} className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>))}
          </dl>
          <div className="mt-6 rounded-2xl bg-blush/70 p-5 text-sm text-ink/85">
            <h2 className="font-sans text-sm font-semibold">How customization works</h2>
            <p className="mt-1">You send your details and pay. After that, we customize this design by hand and deliver the finished video to your WhatsApp and/or email. There is no online editor.</p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16"><h2 className="text-2xl font-medium">More {categoryLabel(t.category)} designs</h2>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">{related.map((r) => (<TemplateCard key={r.id} t={r} />))}</div></section>
      )}
    </div>
  );
}
