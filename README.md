# Cardify.ai

Premium digital invitation video marketplace. Customers browse 29 video designs, fill in their event details, pay ₹999 through Razorpay, and you receive the full order by email and customize the video manually in Canva (delivery within 24 hours).

**Stack:** React + TypeScript + Vite + Tailwind CSS (frontend) · Netlify Functions (backend) · Razorpay (payments) · Resend (email) · Netlify Blobs (private key-value file storage for photos and order records). No Supabase, no SQL database, no customer accounts, no dashboards.

---

## 1. What was and was NOT tested (please read)

This project was written in an environment with **no network access**, so `npm install` could not run.

| Item | Status |
|---|---|
| Server logic: validation, price/ID rules, payment & webhook signature checks, signed photo links, image type sniffing, email content/escaping, template data | **Tested**: 13 automated tests pass (`npm run test:functions`) |
| JavaScript syntax of all Netlify Functions (`node --check`) | **Checked** |
| TypeScript syntax of the frontend | **Partly checked** with stand-in React types only |
| `npm install`, `npm run build`, Vite dev server, Tailwind output, page rendering, navigation, mobile layout | **NOT run. Untested** |
| Netlify Functions running on Netlify, Netlify Blobs read/write | **NOT run. Untested** |
| Razorpay order creation, checkout popup, verification, webhook | **NOT run. Untested** (needs your keys) |
| Resend email sending | **NOT run. Untested** (needs your key and domain) |

The payment and email code calls the real Razorpay and Resend APIs; nothing is mocked or faked. But it has never been executed against them. Run section 6 (test mode) before taking real money. If `npm run build` reports a type error, it will name the file and line; it should be a small fix.

---

## 2. Quick start (local)

Requirements: Node.js 20+.

```bash
npm install
cp .env.example .env        # then fill in values (see section 4)
npm run test:functions      # unit tests for the server logic
npx netlify dev             # runs the site AND the functions at http://localhost:8888
```

Use `netlify dev` (not plain `npm run dev`) so `/api/*` works. Netlify Blobs also works locally under `netlify dev`.

Production build check: `npm run build` (type-checks, then builds into `dist/`).

---

## 3. Deploy: GitHub + Netlify

1. **GitHub:** create an empty repository, then in this folder:
   ```bash
   git init && git add . && git commit -m "Cardify.ai"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
   `.env` is git-ignored. Never commit secrets. (The compressed videos are about 13 MB, fine for GitHub.)
2. **Netlify:** Add new site → Import from Git → pick the repo. Settings are read from `netlify.toml` (build `npm run build`, publish `dist`, functions in `netlify/functions`).
3. **Environment variables:** Site configuration → Environment variables → add every variable from section 4. Mark the secrets as secret.
4. Deploy. Then set your final URL in `VITE_SITE_URL` and redeploy.
5. Add the Razorpay webhook (section 5) using your live site URL.

---

## 4. Environment variables

See `.env.example`. **Server-only** (never exposed to the browser):

| Variable | Purpose |
|---|---|
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay API keys. Use `rzp_test_…` keys first. |
| `RAZORPAY_WEBHOOK_SECRET` | Secret you choose when creating the Razorpay webhook |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | Sender, e.g. `Cardify.ai <orders@yourdomain.com>` (domain must be verified in Resend) |
| `ADMIN_EMAIL` | `shopitbusinessindia@gmail.com` |
| `PHOTO_LINK_SECRET` | Random string that signs private photo links (`openssl rand -hex 32`) |
| `ADMIN_RETRY_TOKEN` | Random string protecting the admin retry endpoint |

**Frontend (public by design):** `VITE_SUPPORT_EMAIL`, `VITE_SUPPORT_WHATSAPP` (digits with country code; blank hides the link), `VITE_SITE_URL`. Only `VITE_*` variables reach the browser. The Razorpay *key id* is sent to the browser by the server at checkout (it is public); the *secret* never is.

---

## 5. Razorpay setup

1. Create/log in to a Razorpay account → Dashboard → **Account & Settings → API Keys** → generate **Test** keys.
2. Put them in `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
3. **Payment capture:** keep *automatic capture* on (Settings → Payment Capture). If it is off, the server captures authorized payments itself.
4. **Webhook (recommended, covers customers who close the tab after paying):** Settings → Webhooks → Add:
   - URL: `https://<your-site>/api/razorpay-webhook`
   - Secret: the same value as `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured` (and `order.paid`)
5. For live payments, complete Razorpay KYC/activation, generate **Live** keys, swap them into Netlify and redeploy.

**How payment is secured:** the price (₹999) is set on the server, never read from the browser. The order is created server-side. After payment, the server (1) verifies the Razorpay signature, (2) asks Razorpay for the payment's real status, amount and order, and only then (3) marks the order paid and sends emails. The browser's "success" callback alone is never trusted.

---

## 6. Testing in Razorpay test mode (do this before going live)

1. `npx netlify dev` with test keys, a Resend key, and `ADMIN_EMAIL` set.
2. Open a design → **Customize This Invitation** → fill the form (try invalid data first: empty fields, past date, bad phone, a `.pdf` renamed `.jpg`, a photo over 4 MB) → **Review** → tick the Terms box → **Pay**.
3. In the Razorpay popup use Razorpay's test payment methods (see Razorpay's "Test card details" / UPI `success@razorpay` / `failure@razorpay` in their docs).
4. Check each case:
   - **Success:** success page shows an Order ID; admin email arrives at `ADMIN_EMAIL` with all fields and working photo links; customer confirmation arrives.
   - **Reload the success page:** no second email (duplicates are prevented).
   - **Failure** (`failure@razorpay`) and **closing the popup:** you land on the failure page; no emails; no order marked paid.
   - **Unchecked Terms box:** payment cannot start.
   - **Webhook:** use a public URL (the deployed site or `netlify dev --live`) and confirm Razorpay's webhook log shows `200`.
5. Test each email path failing: temporarily blank `RESEND_API_KEY`, pay in test mode, confirm the customer still sees "payment confirmed, email delayed", then restore the key and run the retry (section 7).

---

## 7. If an email fails (retry without charging again)

Failed emails are retried automatically when the success page is reloaded and when Razorpay re-sends the webhook. You can also trigger it yourself. Replace the token and site URL:

```bash
# List paid orders with an unsent email
curl -H "x-admin-token: $ADMIN_RETRY_TOKEN" https://<your-site>/api/retry-order-email

# Send only the emails not yet sent for an order
curl -X POST -H "x-admin-token: $ADMIN_RETRY_TOKEN" -H "Content-Type: application/json" \
  -d '{"orderId":"order_XXXX"}' https://<your-site>/api/retry-order-email

# Customer paid but the order never showed as paid: verify with Razorpay, then process it
curl -X POST ... -d '{"orderId":"order_XXXX","paymentId":"pay_XXXX"}' ...

# Re-send both emails even though they were sent
curl -X POST ... -d '{"orderId":"order_XXXX","force":true}' ...
```

None of these charge the customer.

---

## 8. Managing designs

All designs are in `src/data/templates.json`. Per design: `id`, `name`, `category`, `language`, `description`, `photoSlots` (0 = no photos, otherwise max photos), `video`, `thumbnail`, `sourceFile` (your original Canva file name; shown only to you in the order email).

- **Language:** every template currently shows English text, so `language` is `"English"`. Set it to `"Gujarati"`, `"Hindi"` or `"Unknown"` as needed. The language filter uses this field. Three designs (CDF-018, CDF-019, CDF-023) have a Sanskrit/Arabic-style header mark with English body text.
- **Photo slots and categories** were set by looking at preview frames. Please check them. Two designs in your "Birthday Invitation Cards" folder (CDF-001, CDF-002) are wedding-style, so they are listed under **Other Events**; change `category` if you prefer.
- **Add a design:** put an MP4 in `public/videos/` and a JPG in `public/thumbs/`, then add an entry. To make a web preview: `ffmpeg -i in.mp4 -an -vf scale=720:-2 -c:v libx264 -crf 29 -pix_fmt yuv420p -movflags +faststart out.mp4`.
- Categories with no designs yet (Mehndi, Anniversary, Baby Shower, Housewarming) are selectable in the order form but have no browse page entries until you add designs.

---

## 9. How the "no database" requirement is handled

An order has to be remembered between "customer clicks pay" and "Razorpay confirms payment", and the server needs to know if emails were already sent. There is no SQL database, but the project uses **Netlify Blobs** (simple private file storage built into Netlify) for two things: uploaded photos, and one small JSON record per order (details, paid status, email-sent flags). There is no login, no dashboard and no order history page. Each record is looked up only by its Razorpay order ID.

Order records and photos are **not auto-deleted**. You can remove them in the Netlify UI (Blobs) when you no longer need them, and the Privacy Policy tells customers they can request deletion by email.

---

## 10. Security notes and known limitations

- Secrets live only in server environment variables. The browser never sees them.
- Order input is validated again on the server. Emails escape all customer text.
- Photos: JPG/PNG/WebP only, max 4 MB (type detected from file bytes, not file name), stored privately, served only through signed links that expire after 30 days (the retry tool generates fresh links).
- Customer photos are uploaded when chosen (before payment). Abandoned checkouts leave unused photos in storage; clean them out periodically.
- There is no rate limiting on uploads/order creation. For heavier traffic, add Netlify/Cloudflare rate limiting or a CAPTCHA.
- iPhone HEIC photos are not accepted (the form says to use JPG/PNG/WebP).
- If the webhook and the success page finish at the exact same moment, the email provider's idempotency key stops a duplicate email.
- Netlify Functions have a 6 MB request limit, so uploads are capped at 4 MB.
- **Delivery is manual.** The confirmation email contains no download link, because videos are customized by you and sent to WhatsApp/email.

## 11. Legal pages: please review

`Terms & Conditions` and `Privacy Policy` (src/pages/Legal.tsx) follow your brief but were drafted without legal review. The correction policy (free fix if our error; one free text-correction round within 48 hours of delivery; no unlimited revisions) and the refund wording are my proposals, so edit them to match how you actually work. They do not state your business address or registration details; consider adding them. Have them checked by a qualified professional.

## 12. Project layout

```
src/            React app (pages, components, validation, API client)
src/data/       templates.json (designs) and categories
netlify/functions/   create-order, verify-payment, razorpay-webhook, upload-photo, photo, retry-order-email
netlify/lib/    validation, signatures, email builders, shared server code, tests
public/         compressed videos (/videos) and thumbnails (/thumbs)
netlify.toml    build settings, /api routing, security headers
```
