// Pure validation logic (no network, no framework) so it can be unit-tested with `node --test`.
export const PRICE_INR = 999;
export const AMOUNT_PAISE = PRICE_INR * 100;
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

export const CATEGORY_LABELS = {
  "hindu-wedding": "Hindu Wedding",
  "christian-wedding": "Christian Wedding",
  "muslim-wedding": "Muslim Wedding",
  birthday: "Birthday",
  haldi: "Haldi",
  mehndi: "Mehndi",
  sangeet: "Sangeet",
  engagement: "Engagement / Ring Ceremony",
  reception: "Reception",
  anniversary: "Anniversary",
  "baby-shower": "Baby Shower",
  housewarming: "Housewarming",
  other: "Other Events",
};
// Categories where the form asks for bride and groom names.
export const COUPLE_CATEGORIES = new Set([
  "hindu-wedding", "christian-wedding", "muslim-wedding", "haldi", "mehndi", "sangeet", "engagement", "reception",
]);
export const LANGUAGES = ["Gujarati", "Hindi", "English"];
export const DELIVERY = ["WhatsApp", "Email", "Both"];
export const MAX_EVENTS = 8;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

function istToday(now = Date.now()) {
  return new Date(now + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

function cleanText(v, multiline) {
  if (typeof v !== "string") return "";
  // eslint-disable-next-line no-control-regex
  const re = multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
  return v.replace(re, " ").trim();
}

export function validDate(s) {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}
export function validTime(s) {
  return typeof s === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

/**
 * Validate an order draft. `templates` is the authoritative template list.
 * Returns { ok, errors, value }. `value` only contains validated, trimmed fields.
 */
export function validateOrder(input, templates, now = Date.now()) {
  const errors = {};
  const src = input && typeof input === "object" ? input : {};
  const value = {};

  const text = (key, label, { max, required = true, multiline = false } = {}) => {
    const raw = src[key];
    const v = cleanText(raw, multiline);
    if (required && !v) errors[key] = `${label} is required.`;
    else if (v.length > max) errors[key] = `${label} must be at most ${max} characters.`;
    value[key] = v;
    return v;
  };

  text("fullName", "Full name", { max: 80 });
  if (value.fullName && value.fullName.length < 2) errors.fullName = "Please enter your full name.";

  text("email", "Email address", { max: 120 });
  if (value.email && !errors.email && !EMAIL.test(value.email)) errors.email = "Enter a valid email address.";
  value.email = value.email.toLowerCase();

  const phone = cleanText(src.whatsapp).replace(/[\s\-()]/g, "");
  if (!phone) errors.whatsapp = "WhatsApp number is required.";
  else if (!/^\+?\d{10,15}$/.test(phone)) errors.whatsapp = "Enter a valid WhatsApp number (10-15 digits, optional + country code).";
  value.whatsapp = phone;

  const tpl = templates.find((t) => t.id === src.templateId);
  if (!tpl) errors.templateId = "Selected invitation was not found.";
  value.templateId = tpl ? tpl.id : "";

  // Category: must be a known category. Customers may pick any event category.
  if (!Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, src.category)) errors.category = "Choose an event category.";
  value.category = Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, src.category) ? src.category : "";

  if (!LANGUAGES.includes(src.language)) errors.language = "Choose a preferred language.";
  value.language = LANGUAGES.includes(src.language) ? src.language : "";

  if (COUPLE_CATEGORIES.has(value.category)) {
    text("brideName", "Bride's name", { max: 80 });
    text("groomName", "Groom's name", { max: 80 });
    value.hostNames = "";
  } else {
    text("hostNames", "Name(s) to show on the invitation", { max: 120 });
    value.brideName = "";
    value.groomName = "";
  }

  // Events
  const today = istToday(now);
  const rawEvents = Array.isArray(src.events) ? src.events : [];
  if (rawEvents.length < 1) errors.events = "Add at least one event.";
  if (rawEvents.length > MAX_EVENTS) errors.events = `You can add up to ${MAX_EVENTS} events.`;
  value.events = rawEvents.slice(0, MAX_EVENTS).map((e, i) => {
    const ev = e && typeof e === "object" ? e : {};
    const out = {
      name: cleanText(ev.name),
      date: typeof ev.date === "string" ? ev.date : "",
      time: typeof ev.time === "string" ? ev.time : "",
      venue: cleanText(ev.venue, true),
      details: cleanText(ev.details, true),
    };
    const k = (f) => `events.${i}.${f}`;
    if (!out.name) errors[k("name")] = "Event name is required.";
    else if (out.name.length > 60) errors[k("name")] = "Event name must be at most 60 characters.";
    if (!validDate(out.date)) errors[k("date")] = "Choose a valid date.";
    else if (out.date < today) errors[k("date")] = "Event date cannot be in the past.";
    if (!validTime(out.time)) errors[k("time")] = "Choose a valid time.";
    if (!out.venue) errors[k("venue")] = "Venue is required.";
    else if (out.venue.length > 200) errors[k("venue")] = "Venue must be at most 200 characters.";
    if (out.details.length > 500) errors[k("details")] = "Details must be at most 500 characters.";
    return out;
  });

  text("additionalDetails", "Additional details", { max: 1000, required: false, multiline: true });

  if (!DELIVERY.includes(src.delivery)) errors.delivery = "Choose a delivery preference.";
  value.delivery = DELIVERY.includes(src.delivery) ? src.delivery : "";

  // Photos: ids returned by /api/upload-photo
  const photos = Array.isArray(src.photos) ? src.photos : [];
  const maxPhotos = tpl ? Number(tpl.photoSlots) || 0 : 0;
  value.photos = [];
  for (const p of photos) {
    if (!p || typeof p !== "object" || typeof p.id !== "string" || !UUID.test(p.id)) {
      errors.photos = "A photo reference is invalid. Please re-upload your photos.";
      continue;
    }
    value.photos.push({ id: p.id.toLowerCase(), name: cleanText(p.name).slice(0, 120) || "photo" });
  }
  if (value.photos.length > maxPhotos) {
    errors.photos = maxPhotos === 0 ? "This design does not use photos." : `This design accepts up to ${maxPhotos} photo(s).`;
  }

  if (src.termsAccepted !== true) errors.termsAccepted = "You must accept the Terms & Conditions.";

  return { ok: Object.keys(errors).length === 0, errors, value };
}

/** Detect image type from magic bytes. Returns { type, ext } or null. */
export function sniffImage(buf) {
  const b = new Uint8Array(buf);
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { type: "image/jpeg", ext: "jpg" };
  if (b.length > 12 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a)
    return { type: "image/png", ext: "png" };
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50)
    return { type: "image/webp", ext: "webp" };
  return null;
}
