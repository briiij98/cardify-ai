import type { Draft, Template } from "../types";
import { isCouple } from "../data/categories";

export const MAX_EVENTS = 8;
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/;

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Mirrors the server rules (the server re-validates everything; this is only for fast feedback). */
export function validateDraft(d: Draft, tpl: Template | undefined): Record<string, string> {
  const e: Record<string, string> = {};
  if (d.fullName.trim().length < 2) e.fullName = "Please enter your full name.";
  else if (d.fullName.length > 80) e.fullName = "Name is too long (max 80).";
  if (!d.email.trim()) e.email = "Email address is required.";
  else if (!EMAIL.test(d.email.trim()) || d.email.length > 120) e.email = "Enter a valid email address.";
  const phone = d.whatsapp.replace(/[\s\-()]/g, "");
  if (!phone) e.whatsapp = "WhatsApp number is required.";
  else if (!/^\+?\d{10,15}$/.test(phone)) e.whatsapp = "Enter 10-15 digits, optionally starting with + and country code.";
  if (!d.category) e.category = "Choose an event category.";
  if (!d.language) e.language = "Choose a preferred language.";
  if (isCouple(d.category)) {
    if (!d.brideName.trim()) e.brideName = "Bride's name is required.";
    if (!d.groomName.trim()) e.groomName = "Groom's name is required.";
  } else if (!d.hostNames.trim()) e.hostNames = "Please enter the name(s) for the invitation.";
  if (d.events.length < 1) e.events = "Add at least one event.";
  const today = todayISO();
  d.events.forEach((ev, i) => {
    if (!ev.name.trim()) e[`events.${i}.name`] = "Event name is required.";
    if (!ev.date) e[`events.${i}.date`] = "Choose a date.";
    else if (ev.date < today) e[`events.${i}.date`] = "Date cannot be in the past.";
    if (!ev.time) e[`events.${i}.time`] = "Choose a time.";
    if (!ev.venue.trim()) e[`events.${i}.venue`] = "Venue is required.";
    if (ev.venue.length > 200) e[`events.${i}.venue`] = "Venue is too long (max 200).";
    if (ev.details.length > 500) e[`events.${i}.details`] = "Max 500 characters.";
  });
  if (d.additionalDetails.length > 1000) e.additionalDetails = "Max 1000 characters.";
  if (!d.delivery) e.delivery = "Choose how you want to receive your invitation.";
  if (tpl && d.photos.length > tpl.photoSlots) e.photos = `This design accepts up to ${tpl.photoSlots} photo(s).`;
  return e;
}

export function checkPhotoFile(f: File): string | null {
  if (!PHOTO_TYPES.includes(f.type)) return `${f.name}: only JPG, PNG or WebP photos are allowed.`;
  if (f.size > MAX_PHOTO_BYTES) return `${f.name}: file is larger than 4 MB.`;
  if (f.size === 0) return `${f.name}: file is empty.`;
  return null;
}
