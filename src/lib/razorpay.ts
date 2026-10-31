export interface RazorpayOptions {
  key: string; amount: number; currency: string; order_id: string; name: string; description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}
export interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", cb: (r: { error: { description?: string } }) => void) => void;
}
declare global { interface Window { Razorpay?: new (o: RazorpayOptions) => RazorpayInstance } }

let loading: Promise<boolean> | null = null;
export function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  if (loading) return loading;
  loading = new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => { loading = null; resolve(false); };
    document.body.appendChild(s);
  });
  return loading;
}
