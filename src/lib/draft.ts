import type { Draft } from "../types";
import { findTemplate, isCouple } from "../data/categories";

const KEY = "cardify.draft";
const PAY_KEY = "cardify.payment";

export function emptyDraft(templateId: string, category: string): Draft {
  const wedding = isCouple(category);
  return {
    templateId, fullName: "", email: "", whatsapp: "", category, language: "",
    brideName: "", groomName: "", hostNames: "",
    events: [{ name: wedding ? "Wedding" : "", date: "", time: "", venue: "", details: "" }],
    additionalDetails: "", delivery: "", photos: [],
  };
}
export function loadDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    return findTemplate(d.templateId) ? d : null;
  } catch { return null; }
}
export function saveDraft(d: Draft) { try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch { /* storage unavailable */ } }
export function clearDraft() { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } }

export interface PaymentResponse { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
export function savePayment(p: PaymentResponse) { try { sessionStorage.setItem(PAY_KEY, JSON.stringify(p)); } catch { /* ignore */ } }
export function loadPayment(): PaymentResponse | null {
  try { const r = sessionStorage.getItem(PAY_KEY); return r ? (JSON.parse(r) as PaymentResponse) : null; } catch { return null; }
}
export function clearPayment() { try { sessionStorage.removeItem(PAY_KEY); } catch { /* ignore */ } }
