import type { Draft, PhotoRef } from "../types";
import type { PaymentResponse } from "./draft";

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function call<T>(path: string, init: RequestInit): Promise<{ status: number; data: T }> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiError("Network problem. Please check your connection and try again.", 0);
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; errors?: Record<string, string> };
  if (!res.ok && res.status !== 202) throw new ApiError(data.error || "Request failed.", res.status, data.errors);
  return { status: res.status, data };
}

export async function uploadPhoto(file: File): Promise<PhotoRef> {
  const { data } = await call<{ id: string; name: string }>("/api/upload-photo", {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream", "x-file-name": encodeURIComponent(file.name) },
    body: file,
  });
  return { id: data.id, name: file.name };
}

export interface CreatedOrder { orderId: string; amount: number; currency: string; keyId: string; price: number }
export async function createOrder(draft: Draft): Promise<CreatedOrder> {
  const { data } = await call<CreatedOrder>("/api/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...draft, termsAccepted: true }),
  });
  return data;
}

export interface VerifyResult { status: "paid" | "pending" | "failed"; orderId?: string; emailsSent?: { admin: boolean; customer: boolean } }
export async function verifyPayment(p: PaymentResponse): Promise<VerifyResult> {
  try {
    const { status, data } = await call<VerifyResult>("/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    return status === 202 ? { ...data, status: "pending" } : data;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 400 || e.status === 402 || e.status === 404)) return { status: "failed" };
    throw e;
  }
}
