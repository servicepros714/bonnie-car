// Booking data layer.
// Primary store: Cloudflare Worker + D1 (VITE_API_URL).
// Fallback / double-booking guard: localStorage on this device.

import { SOURCE, ID_PREFIX } from '../data/site';

const LS_KEY = 'bonnie_bookings_v1';
const PENDING_KEY = 'bonnie_pending_booking';
const LAST_KEY = 'bonnie_last_booking';

const rawApi = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
export const API_URL =
  rawApi.startsWith('https://') && !/YOUR-|your-subdomain/i.test(rawApi) ? rawApi : '';
export const apiConfigured = Boolean(API_URL);

function readLocal() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}
function writeLocal(list) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list.slice(-200)));
  } catch {
    /* storage unavailable */
  }
}

export function makeBookingId() {
  const t = Date.now().toString(36).toUpperCase().slice(-5);
  const r = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `${ID_PREFIX}${t}${r}`;
}

/** Times already taken on a date (API + this device). */
export async function getBookedTimes(dateKey) {
  const local = readLocal()
    .filter((b) => b.date === dateKey && b.status !== 'cancelled')
    .map((b) => b.time);
  if (!apiConfigured) return [...new Set(local)];
  try {
    const res = await fetch(`${API_URL}/api/availability?date=${encodeURIComponent(dateKey)}`);
    if (!res.ok) throw new Error('availability failed');
    const data = await res.json();
    return [...new Set([...(data.booked || []), ...local])];
  } catch {
    return [...new Set(local)];
  }
}

/** Save a booking. Returns { id, conflict }. */
export async function createBooking(booking) {
  const payload = {
    id: booking.id || makeBookingId(),
    source: SOURCE,
    status: 'confirmed',
    ...booking,
  };

  let conflict = false;
  if (apiConfigured) {
    const res = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 409) {
      const err = new Error(data.error || 'That time was just booked. Please pick another slot.');
      err.code = 'SLOT_TAKEN';
      throw err;
    }
    if (!res.ok) throw new Error(data.error || 'Could not save your booking.');
    payload.id = data.id || payload.id;
    conflict = Boolean(data.conflict);
  }

  writeLocal([...readLocal(), payload]);
  try {
    sessionStorage.setItem(LAST_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  return { id: payload.id, conflict, booking: payload };
}

export function savePending(data) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}
export function loadPending() {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
  } catch {
    return null;
  }
}
export function clearPending() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}
export function loadLastBooking() {
  try {
    return JSON.parse(sessionStorage.getItem(LAST_KEY) || 'null');
  } catch {
    return null;
  }
}
