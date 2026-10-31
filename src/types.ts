export type Language = "Gujarati" | "Hindi" | "English" | "Unknown";
export type Delivery = "WhatsApp" | "Email" | "Both";

export interface Template {
  id: string;
  slug: string;
  name: string;
  category: string;
  language: Language;
  video: string;
  thumbnail: string;
  price: number;
  originalPrice: number;
  description: string;
  photoSlots: number;
  sourceFile: string;
}

export interface EventEntry {
  name: string;
  date: string;
  time: string;
  venue: string;
  details: string;
}
export interface PhotoRef { id: string; name: string }

export interface Draft {
  templateId: string;
  fullName: string;
  email: string;
  whatsapp: string;
  category: string;
  language: string;
  brideName: string;
  groomName: string;
  hostNames: string;
  events: EventEntry[];
  additionalDetails: string;
  delivery: Delivery | "";
  photos: PhotoRef[];
}
