import { format } from 'date-fns';
import { SLOT_START_MIN, SLOT_END_MIN, SLOT_STEP_MIN, TIMEZONE, LEAD_TIME_MIN } from '../data/site';

/** Current wall-clock time in California, as { dateKey, minutes }. */
export function pacificNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value;
  const hour = Number(get('hour')) % 24;
  return {
    dateKey: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: hour * 60 + Number(get('minute')),
  };
}

/** Local Date at midnight for the California "today". */
export function pacificToday() {
  const { dateKey } = pacificNow();
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const toDateKey = (date) => format(date, 'yyyy-MM-dd');

export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function minutesToLabel(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function allSlots() {
  const out = [];
  for (let t = SLOT_START_MIN; t <= SLOT_END_MIN; t += SLOT_STEP_MIN) {
    out.push({ minutes: t, label: minutesToLabel(t) });
  }
  return out;
}

const dayNumber = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
};

/** True when a slot starts less than LEAD_TIME_MIN from now (California time). */
export function isSlotPast(dateKey, minutes) {
  const now = pacificNow();
  const slotAbs = (dayNumber(dateKey) - dayNumber(now.dateKey)) * 1440 + minutes;
  return slotAbs < now.minutes + LEAD_TIME_MIN;
}

/** True when the whole day has no bookable slot left. */
export function isDayClosed(dateKey) {
  return isSlotPast(dateKey, SLOT_END_MIN);
}

export function formatPhone(value) {
  const d = value.replace(/\D/g, '').slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
