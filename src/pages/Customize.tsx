import { useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Field from "../components/Field";
import { CATEGORIES, FORM_LANGUAGES, categoryLabel, findTemplate, isCouple } from "../data/categories";
import type { Draft, EventEntry } from "../types";
import { uploadPhoto, ApiError } from "../lib/api";
import { emptyDraft, loadDraft, saveDraft } from "../lib/draft";
import { MAX_EVENTS, checkPhotoFile, todayISO, validateDraft } from "../lib/validation";
import { useSeo } from "../lib/useSeo";
import NotFound from "./NotFound";

const QUICK_EVENTS = ["Haldi", "Mehndi", "Sangeet", "Wedding", "Reception"];

export default function Customize() {
  const { id } = useParams();
  const tpl = findTemplate(id);
  const nav = useNavigate();
  useSeo(tpl ? `Customize ${tpl.name}` : "Customize", "Enter your event details to customize your invitation video.");

  const [d, setD] = useState<Draft | null>(() => {
    if (!tpl) return null;
    const saved = loadDraft();
    if (saved && saved.templateId === tpl.id) return saved;
    const fresh = emptyDraft(tpl.id, tpl.category);
    if (saved) Object.assign(fresh, { fullName: saved.fullName, email: saved.email, whatsapp: saved.whatsapp, delivery: saved.delivery });
    return fresh;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const today = useMemo(todayISO, []);

  if (!tpl || !d) return <NotFound />;
  const couple = isCouple(d.category);
  const err = (k: string) => errors[k];
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => (p ? { ...p, [k]: v } : p));
  const setEvent = (i: number, patch: Partial<EventEntry>) => setD((p) => (p ? { ...p, events: p.events.map((e, j) => (j === i ? { ...e, ...patch } : e)) } : p));
  const addEvent = (name = "") => setD((p) => (p && p.events.length < MAX_EVENTS ? { ...p, events: [...p.events, { name, date: "", time: "", venue: "", details: "" }] } : p));
  const removeEvent = (i: number) => setD((p) => (p && p.events.length > 1 ? { ...p, events: p.events.filter((_, j) => j !== i) } : p));

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const msgs: string[] = [];
    let room = tpl!.photoSlots - d!.photos.length;
    const ok: File[] = [];
    for (const f of Array.from(files)) {
      const bad = checkPhotoFile(f);
      if (bad) msgs.push(bad);
      else if (room <= 0) msgs.push(`${f.name}: photo limit reached (${tpl!.photoSlots}).`);
      else { ok.push(f); room--; }
    }
    setPhotoMsg(msgs);
    if (ok.length === 0) { if (fileRef.current) fileRef.current.value = ""; return; }
    setUploading(true);
    for (const f of ok) {
      try {
        const ref = await uploadPhoto(f);
        setD((p) => (p ? { ...p, photos: [...p.photos, ref] } : p));
      } catch (e) {
        msgs.push(`${f.name}: ${e instanceof ApiError ? e.message : "upload failed."}`);
        setPhotoMsg([...msgs]);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function submit(ev: FormEvent) {
    ev.preventDefault();
    const e = validateDraft(d!, tpl);
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      const el = document.getElementById("f-" + first.replace(/\./g, "-"));
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      (el as HTMLElement | null)?.focus?.({ preventScroll: true });
      return;
    }
    saveDraft(d!);
    nav("/checkout");
  }

  const evField = (i: number, k: keyof EventEntry) => `f-events-${i}-${k}`;

  return (
    <div className="container-x max-w-3xl pt-8">
      <p className="text-sm text-muted"><Link to={`/invitation/${tpl.id.toLowerCase()}`} className="hover:underline">← Back to design</Link></p>
      <h1 className="mt-2 text-3xl font-medium sm:text-4xl">Customize your invitation</h1>
      <div className="card mt-5 flex items-center gap-4 !p-3">
        <img src={tpl.thumbnail} alt="" className="h-20 w-14 rounded-md object-cover object-top" />
        <div className="min-w-0"><p className="truncate font-medium">{tpl.name}</p><p className="text-xs text-muted">{tpl.id} · {categoryLabel(tpl.category)} · ₹{tpl.price}</p></div>
      </div>
      <p className="mt-3 text-sm text-muted">Fields marked <span className="text-maroon">*</span> are required. You'll review everything before paying.</p>

      <form onSubmit={submit} noValidate className="mt-6 space-y-6">
        <section className="card space-y-4" aria-labelledby="s-cust">
          <h2 id="s-cust" className="text-xl">Your details</h2>
          <Field id="f-fullName" label="Full name" required error={err("fullName")}>{(p) => <input {...p} value={d.fullName} maxLength={80} autoComplete="name" onChange={(e) => set("fullName", e.target.value)} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="f-email" label="Email address" required error={err("email")}>{(p) => <input {...p} type="email" inputMode="email" value={d.email} maxLength={120} autoComplete="email" onChange={(e) => set("email", e.target.value)} />}</Field>
            <Field id="f-whatsapp" label="WhatsApp number" required error={err("whatsapp")} hint="Include country code, e.g. +91 98765 43210">{(p) => <input {...p} type="tel" inputMode="tel" value={d.whatsapp} maxLength={20} autoComplete="tel" onChange={(e) => set("whatsapp", e.target.value)} />}</Field>
          </div>
        </section>

        <section className="card space-y-4" aria-labelledby="s-inv">
          <h2 id="s-inv" className="text-xl">Invitation</h2>
          <Field id="f-template" label="Selected invitation template">{(p) => <input {...p} className={`${p.className} bg-ivory`} value={`${tpl.name} (${tpl.id})`} readOnly />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="f-category" label="Event category" required error={err("category")}>{(p) => (
              <select {...p} value={d.category} onChange={(e) => { set("category", e.target.value); }}>
                <option value="">Choose…</option>
                {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>)}</Field>
            <Field id="f-language" label="Preferred language" required error={err("language")} hint="The language you want your names and details written in.">{(p) => (
              <select {...p} value={d.language} onChange={(e) => set("language", e.target.value)}>
                <option value="">Choose…</option>
                {FORM_LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>)}</Field>
          </div>
          {couple ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="f-brideName" label="Bride's name" required error={err("brideName")}>{(p) => <input {...p} value={d.brideName} maxLength={80} onChange={(e) => set("brideName", e.target.value)} />}</Field>
              <Field id="f-groomName" label="Groom's name" required error={err("groomName")}>{(p) => <input {...p} value={d.groomName} maxLength={80} onChange={(e) => set("groomName", e.target.value)} />}</Field>
            </div>
          ) : (
            <Field id="f-hostNames" label="Name(s) to show on the invitation" required error={err("hostNames")} hint="For example the birthday person, the family, or the hosts.">{(p) => <input {...p} value={d.hostNames} maxLength={120} onChange={(e) => set("hostNames", e.target.value)} />}</Field>
          )}
        </section>

        <section className="card space-y-4" aria-labelledby="s-events">
          <div><h2 id="s-events" className="text-xl">Event details</h2>
            <p className="mt-1 text-sm text-muted">Add every event that should appear on the invitation (up to {MAX_EVENTS}).</p></div>
          {err("events") && <p role="alert" className="text-sm font-medium text-red-700">{err("events")}</p>}
          {d.events.map((e, i) => (
            <fieldset key={i} className="rounded-xl border border-line p-4">
              <legend className="px-2 text-sm font-semibold">Event {i + 1}</legend>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-3"><Field id={evField(i, "name")} label="Event name" required error={err(`events.${i}.name`)}>{(p) => <input {...p} value={e.name} maxLength={60} placeholder="e.g. Wedding" onChange={(ev) => setEvent(i, { name: ev.target.value })} />}</Field></div>
                <Field id={evField(i, "date")} label="Event date" required error={err(`events.${i}.date`)}>{(p) => <input {...p} type="date" min={today} value={e.date} onChange={(ev) => setEvent(i, { date: ev.target.value })} />}</Field>
                <Field id={evField(i, "time")} label="Event time" required error={err(`events.${i}.time`)}>{(p) => <input {...p} type="time" value={e.time} onChange={(ev) => setEvent(i, { time: ev.target.value })} />}</Field>
                <div className="sm:col-span-3"><Field id={evField(i, "venue")} label="Venue" required error={err(`events.${i}.venue`)} hint="Venue name and address or city.">{(p) => <textarea {...p} rows={2} value={e.venue} maxLength={200} onChange={(ev) => setEvent(i, { venue: ev.target.value })} />}</Field></div>
                <div className="sm:col-span-3"><Field id={evField(i, "details")} label="Additional event details (optional)" error={err(`events.${i}.details`)}>{(p) => <textarea {...p} rows={2} value={e.details} maxLength={500} placeholder="Dress code, RSVP, ceremony timing…" onChange={(ev) => setEvent(i, { details: ev.target.value })} />}</Field></div>
              </div>
              {d.events.length > 1 && <button type="button" className="mt-3 text-sm font-medium text-red-700 underline" onClick={() => removeEvent(i)}>Remove this event</button>}
            </fieldset>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn-outline !py-2" disabled={d.events.length >= MAX_EVENTS} onClick={() => addEvent()}>+ Add another event</button>
            {couple && QUICK_EVENTS.filter((n) => !d.events.some((e) => e.name.toLowerCase() === n.toLowerCase())).map((n) => (
              <button key={n} type="button" className="chip" disabled={d.events.length >= MAX_EVENTS} onClick={() => addEvent(n)}>+ {n}</button>))}
          </div>
          <Field id="f-additionalDetails" label="Anything else we should know? (optional)" error={err("additionalDetails")}>{(p) => <textarea {...p} rows={3} value={d.additionalDetails} maxLength={1000} onChange={(e) => set("additionalDetails", e.target.value)} />}</Field>
        </section>

        {tpl.photoSlots > 0 && (
          <section className="card space-y-3" aria-labelledby="s-photos">
            <h2 id="s-photos" className="text-xl">Photos <span className="text-sm font-normal text-muted">(optional)</span></h2>
            <p className="text-sm text-muted">This design can show up to {tpl.photoSlots} photo{tpl.photoSlots > 1 ? "s" : ""}. JPG, PNG or WebP, max 4 MB each. Photos are used only to make your invitation.</p>
            <input id="f-photos" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple={tpl.photoSlots > 1} disabled={uploading || d.photos.length >= tpl.photoSlots}
              onChange={(e) => onFiles(e.target.files)} className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-blush file:px-4 file:py-2 file:text-sm file:font-medium" aria-describedby="photo-status" />
            <div id="photo-status" aria-live="polite" className="text-sm">
              {uploading && <p className="text-muted">Uploading…</p>}
              {photoMsg.map((m, i) => <p key={i} role="alert" className="text-red-700">{m}</p>)}
              {err("photos") && <p role="alert" className="text-red-700">{err("photos")}</p>}
            </div>
            {d.photos.length > 0 && (
              <ul className="divide-y divide-line rounded-lg border border-line text-sm">
                {d.photos.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2"><span className="truncate">✓ {p.name}</span>
                    <button type="button" className="shrink-0 text-red-700 underline" onClick={() => set("photos", d.photos.filter((x) => x.id !== p.id))}>Remove</button></li>))}
              </ul>
            )}
          </section>
        )}

        <section className="card" aria-labelledby="s-del">
          <fieldset id="f-delivery" tabIndex={-1} aria-describedby={err("delivery") ? "delivery-err" : undefined}>
            <legend id="s-del" className="text-xl font-serif">Delivery preference <span className="text-maroon">*</span></legend>
            <div className="mt-3 flex flex-wrap gap-3">
              {(["WhatsApp", "Email", "Both"] as const).map((v) => (
                <label key={v} className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm ${d.delivery === v ? "border-maroon bg-blush" : "border-line bg-white"}`}>
                  <input type="radio" name="delivery" value={v} checked={d.delivery === v} onChange={() => set("delivery", v)} className="accent-[#7b1e2e]" />{v}</label>))}
            </div>
            {err("delivery") && <p id="delivery-err" role="alert" className="mt-2 text-xs font-medium text-red-700">{err("delivery")}</p>}
          </fieldset>
        </section>

        {Object.keys(errors).length > 0 && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">Please fix the highlighted fields to continue.</p>}
        <button type="submit" className="btn-primary w-full" disabled={uploading}>{uploading ? "Uploading photos…" : "Review your order"}</button>
      </form>
    </div>
  );
}
