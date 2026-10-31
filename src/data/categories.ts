import type { Template } from "../types";
import raw from "./templates.json";

export const templates = raw as Template[];

export interface Category { id: string; label: string; couple: boolean }
export const CATEGORIES: Category[] = [
  { id: "hindu-wedding", label: "Hindu Wedding", couple: true },
  { id: "christian-wedding", label: "Christian Wedding", couple: true },
  { id: "muslim-wedding", label: "Muslim Wedding", couple: true },
  { id: "birthday", label: "Birthday", couple: false },
  { id: "haldi", label: "Haldi", couple: true },
  { id: "mehndi", label: "Mehndi", couple: true },
  { id: "sangeet", label: "Sangeet", couple: true },
  { id: "engagement", label: "Engagement / Ring Ceremony", couple: true },
  { id: "reception", label: "Reception", couple: true },
  { id: "anniversary", label: "Anniversary", couple: false },
  { id: "baby-shower", label: "Baby Shower", couple: false },
  { id: "housewarming", label: "Housewarming", couple: false },
  { id: "other", label: "Other Events", couple: false },
];
export const MAIN_CATEGORY_IDS = ["hindu-wedding", "christian-wedding", "muslim-wedding", "birthday"];
export const categoryLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
export const isCouple = (id: string) => CATEGORIES.find((c) => c.id === id)?.couple ?? false;

export const LANGUAGE_FILTERS = ["Gujarati", "Hindi", "English"] as const;
export const FORM_LANGUAGES = ["Gujarati", "Hindi", "English"] as const;

export const findTemplate = (id?: string) => templates.find((t) => t.id.toLowerCase() === (id ?? "").toLowerCase());

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const discountPct = (t: Template) => Math.round(((t.originalPrice - t.price) / t.originalPrice) * 100);
