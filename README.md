# Bonnie Car Detailing — Buena Park

Mobile car detailing booking site · Vite + React 18 · Cloudflare Pages + Worker + D1 · Stripe.

| | |
|---|---|
| Phone | (657) 701-3431 |
| Location | Buena Park, CA |
| Source tag | `bonnie` |
| Booking ID prefix | `BON-` |
| Worker | `bonnie-detailing-worker` |
| D1 | shared `detailing-bookings` (binding `DB`) |
| Pages project | `bonnie-car-detailing` |

## Design (unique to this site)

- **Palette from the logo:** midnight navy `#06142E`, splash blue `#13A8F2`, royal `#0A4FA8`, sunset gold `#F7C520` → amber `#F29A0A`, chrome `#E9EEF4`.
- **Fonts:** Russo One (display) · Sora (body) · Kanit italic (prices, eyebrows).
- **Nav:** logo "badge" hanging off a transparent bar, pill-shaped link group; mobile menu is a **bottom sheet** with a Call Now / Book Online action bar.
- **Hero:** split layout with hexagon-clipped photo (matches the logo shield), floating price badges, rising soap bubbles, tilted gold marquee ribbon.
- **Section order:** Hero → Detail Menu (2 packages + dashed add-on bar) → How It Works (3 hexagon "laps" on a dashed road) → Gallery (bento grid / swipe carousel + lightbox) → Why Bonnie (sticky photo + spinning hex stamp) → Service Area (map card) → FAQ → CTA band → Footer (4 columns + outlined BONNIE wordmark).
- Skewed buttons echo the italic logo wordmark.

## Booking flow

Package → Exterior Wash add-on (Yes / No) → Date → Time → Your Details → Checkout → Confirmation

- 30-min slots 8:00 AM – 4:30 PM, Mon–Sun, California time; past slots disabled.
- Back / Continue become a **sticky bottom action bar** on mobile (with running total).
- Checkout: back link + "Secure checkout" → `$15 OFF` prepay banner (code `PREPAY`) → summary → coupon → Stripe (Express Checkout + Payment Element) → "I'll pay later" link.
- `payment_status` is saved as `Paid` or `Pay Later`.
- Without a Stripe key / Worker URL the checkout runs in **demo mode** (booking reserved, no charge).

## Edit content

Everything business-specific lives in `src/data/site.js` (phone, hours, services, service-area chips, gallery). Photos are in `public/images/` — replace files with the same names to swap them.

## Local dev (Windows CMD)

```
npm install
npm run dev
```

## Go-live checklist

1. **Worker** (Cloudflare dashboard → Workers & Pages → `bonnie-detailing-worker`): paste `worker/worker.js`, deploy.
2. **D1 binding:** Worker → Settings → Bindings → D1 → variable `DB` → `detailing-bookings`.
3. **Secret:** Worker → Settings → Variables and Secrets → `STRIPE_SECRET_KEY` (type Secret). Optional: `ADMIN_TOKEN`.
4. **`.env.local`:** set `VITE_STRIPE_PUBLISHABLE_KEY=pk_...` and `VITE_API_URL=https://bonnie-detailing-worker.<subdomain>.workers.dev` then commit.
5. **GitHub secrets:** `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
6. Push to `main` → GitHub Actions builds and deploys to Pages.
7. **Apple Pay:** add the live domain in Stripe → Settings → Payment method domains.

Test: `https://<worker-url>/api/health` should return `{"ok":true,"stripe":true,"db":true}`.
