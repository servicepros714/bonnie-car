/**
 * bonnie-detailing-worker
 * Cloudflare Worker for Bonnie Car Detailing Buena Park
 *
 * Bindings (set in the Cloudflare dashboard → Worker → Settings):
 *   DB                 D1 database binding → shared "detailing-bookings"
 *   STRIPE_SECRET_KEY  Secret (sk_live_... / sk_test_...)
 *   ADMIN_TOKEN        Optional secret. When set, GET/PATCH /api/bookings require
 *                      "Authorization: Bearer <ADMIN_TOKEN>".
 *
 * Routes:
 *   GET   /api/health
 *   GET   /api/availability?date=YYYY-MM-DD
 *   POST  /api/bookings
 *   GET   /api/bookings              (admin, scoped to this site's source)
 *   PATCH /api/bookings/:id          (admin, PATCHABLE fields only)
 *   POST  /api/create-payment-intent (never touches D1)
 */

const SOURCE = 'bonnie';
const ID_PREFIX = 'BON-';

// Admin dashboard compatibility — keep these on every Worker.
const PATCHABLE = [
  'status',
  'payment_status',
  'reschedule_date',
  'reschedule_time',
  'original_date',
  'original_time',
  'notes2',
];

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    service TEXT,
    name TEXT,
    phone TEXT,
    email TEXT,
    vehicle TEXT,
    address TEXT,
    notes TEXT,
    source TEXT,
    created_at TEXT,
    status TEXT DEFAULT 'confirmed',
    reschedule_date TEXT,
    reschedule_time TEXT,
    notes2 TEXT,
    original_date TEXT,
    original_time TEXT,
    payment_status TEXT
  )
`;

let schemaReady = false;
async function ensureSchema(db) {
  if (schemaReady) return;
  // Collapse whitespace — multi-line literals break D1 .exec()
  await db.exec(SCHEMA.replace(/\s+/g, ' ').trim());
  schemaReady = true;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

function isAdmin(request, env) {
  if (!env.ADMIN_TOKEN) return true; // backwards compatible until a token is set
  return request.headers.get('Authorization') === `Bearer ${env.ADMIN_TOKEN}`;
}

const clean = (v, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^(1[0-2]|[1-9]):[0-5]\d (AM|PM)$/;

function newId() {
  const t = Date.now().toString(36).toUpperCase().slice(-5);
  const r = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `${ID_PREFIX}${t}${r}`;
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      // ---------- Health ----------
      if (path === '/api/health') {
        return json({ ok: true, source: SOURCE, stripe: Boolean(env.STRIPE_SECRET_KEY), db: Boolean(env.DB) });
      }

      // ---------- Stripe PaymentIntent (no D1 work on this route) ----------
      if (path === '/api/create-payment-intent' && request.method === 'POST') {
        if (!env.STRIPE_SECRET_KEY) return json({ error: 'Stripe is not configured on this Worker.' }, 501);
        const { amount, currency = 'usd', description = '', email = '' } = await request.json();
        const cents = Math.round(Number(amount));
        if (!Number.isFinite(cents) || cents < 50 || cents > 100000) {
          return json({ error: 'Invalid amount.' }, 400);
        }
        const body = new URLSearchParams({
          amount: String(cents),
          currency,
          description: clean(description, 400),
          'automatic_payment_methods[enabled]': 'true',
          'metadata[source]': SOURCE,
        });
        if (email) body.set('receipt_email', clean(email, 200));

        const res = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        });
        const intent = await res.json();
        if (intent.error) return json({ error: intent.error.message }, 400);
        return json({ clientSecret: intent.client_secret });
      }

      // Everything below needs D1
      if (!env.DB) return json({ error: 'Database binding "DB" is missing.' }, 500);
      await ensureSchema(env.DB);

      // ---------- Availability ----------
      if (path === '/api/availability' && request.method === 'GET') {
        const date = url.searchParams.get('date') || '';
        if (!DATE_RE.test(date)) return json({ error: 'date is required (YYYY-MM-DD)' }, 400);
        const { results } = await env.DB.prepare(
          `SELECT time, reschedule_date, reschedule_time FROM bookings
           WHERE source = ? AND LOWER(COALESCE(status,'')) != 'cancelled'
           AND (date = ? OR reschedule_date = ?)`
        )
          .bind(SOURCE, date, date)
          .all();
        const booked = new Set();
        for (const r of results) {
          if (r.reschedule_date && r.reschedule_time) {
            if (r.reschedule_date === date) booked.add(r.reschedule_time);
          } else {
            booked.add(r.time);
          }
        }
        return json({ date, booked: [...booked] });
      }

      // ---------- Create booking ----------
      if (path === '/api/bookings' && request.method === 'POST') {
        const b = await request.json();
        const date = clean(b.date, 10);
        const time = clean(b.time, 8);
        const name = clean(b.name, 120);
        const phone = clean(b.phone, 30);
        if (!DATE_RE.test(date) || !TIME_RE.test(time)) return json({ error: 'Invalid date or time.' }, 400);
        if (!name || !phone) return json({ error: 'Name and phone are required.' }, 400);

        const paymentStatus = b.payment_status === 'Paid' ? 'Paid' : 'Pay Later';

        // Source-scoped clash check
        const clash = await env.DB.prepare(
          `SELECT id FROM bookings WHERE source = ? AND LOWER(COALESCE(status,'')) != 'cancelled'
           AND ((date = ? AND time = ? AND reschedule_date IS NULL) OR (reschedule_date = ? AND reschedule_time = ?))
           LIMIT 1`
        )
          .bind(SOURCE, date, time, date, time)
          .first();

        // Unpaid bookings are rejected on a clash; paid ones are kept and flagged for follow-up.
        if (clash && paymentStatus !== 'Paid') {
          return json({ error: 'That time was just booked. Please pick another slot.' }, 409);
        }

        let id = clean(b.id, 40);
        if (!id.startsWith(ID_PREFIX)) id = newId();
        const exists = await env.DB.prepare('SELECT id FROM bookings WHERE id = ?').bind(id).first();
        if (exists) id = newId();

        let notes = clean(b.notes, 500);
        if (clash) notes = `${notes} · SLOT CONFLICT with ${clash.id} — please review`.trim();

        await env.DB.prepare(
          `INSERT INTO bookings
           (id, date, time, service, name, phone, email, vehicle, address, notes, source, created_at, status, payment_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)`
        )
          .bind(
            id,
            date,
            time,
            clean(b.service, 160),
            name,
            phone,
            clean(b.email, 200),
            clean(b.vehicle, 120),
            clean(b.address, 250),
            notes,
            SOURCE,
            new Date().toISOString(),
            paymentStatus
          )
          .run();

        return json({ ok: true, id, conflict: Boolean(clash) }, 201);
      }

      // ---------- Admin: list ----------
      if (path === '/api/bookings' && request.method === 'GET') {
        if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401);
        const { results } = await env.DB.prepare(
          'SELECT * FROM bookings WHERE source = ? ORDER BY date DESC, time DESC'
        )
          .bind(SOURCE)
          .all();
        return json({ bookings: results });
      }

      // ---------- Admin: patch ----------
      const m = path.match(/^\/api\/bookings\/([^/]+)$/);
      if (m && request.method === 'PATCH') {
        if (!isAdmin(request, env)) return json({ error: 'Unauthorized' }, 401);
        const id = decodeURIComponent(m[1]);
        const body = await request.json();
        const keys = Object.keys(body).filter((k) => PATCHABLE.includes(k));
        if (!keys.length) return json({ error: 'No patchable fields supplied.' }, 400);
        const sets = keys.map((k) => `${k} = ?`).join(', ');
        const values = keys.map((k) => (body[k] === null ? null : String(body[k]).slice(0, 500)));
        const res = await env.DB.prepare(`UPDATE bookings SET ${sets} WHERE id = ? AND source = ?`)
          .bind(...values, id, SOURCE)
          .run();
        return json({ ok: true, changes: res.meta?.changes ?? 0 });
      }

      return json({ error: 'Not found' }, 404);
    } catch (err) {
      return json({ error: err.message || 'Server error' }, 500);
    }
  },
};
