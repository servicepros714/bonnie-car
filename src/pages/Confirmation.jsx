import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Check, CalendarPlus, Phone, House, LoaderCircle } from 'lucide-react';
import { BUSINESS, EXTERIOR, PACKAGES, TIMEZONE } from '../data/site';
import { fromDateKey } from '../utils/time';
import { clearPending, createBooking, loadLastBooking, loadPending } from '../utils/bookingDb';

function toIcsStamp(dateKey, timeLabel) {
  const [time, ampm] = timeLabel.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${dateKey.replace(/-/g, '')}T${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
}

function downloadIcs(b) {
  const start = toIcsStamp(b.date, b.time);
  const [d, t] = start.split('T');
  const endH = String(Math.min(23, Number(t.slice(0, 2)) + 3)).padStart(2, '0');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bonnie Car Detailing//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${b.id}@bonniecardetailing`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;TZID=${TIMEZONE}:${start}`,
    `DTEND;TZID=${TIMEZONE}:${d}T${endH}${t.slice(2)}`,
    `SUMMARY:${BUSINESS.name} — ${b.service}`,
    `LOCATION:${(b.address || '').replace(/,/g, '\\,')}`,
    `DESCRIPTION:Booking ${b.id}. Questions? Call ${BUSINESS.phoneDisplay}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${b.id}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Confirmation() {
  const { state } = useLocation();
  const [params] = useSearchParams();
  const [booking, setBooking] = useState(() => state?.booking || null);
  const [finishing, setFinishing] = useState(false);
  const ran = useRef(false);

  // Return from a redirect-based Stripe payment method
  const redirectStatus = params.get('redirect_status');
  const pending = useMemo(() => loadPending(), []);

  useEffect(() => {
    if (booking || ran.current) return;
    ran.current = true;
    if (redirectStatus === 'succeeded' && pending) {
      setFinishing(true);
      const pkg = PACKAGES.find((p) => p.id === pending.packageId);
      createBooking({
        date: pending.date,
        time: pending.time,
        service: `${pkg?.name || 'Detail'}${pending.exterior ? ` + ${EXTERIOR.name}` : ''}`,
        ...pending.info,
        notes: 'Paid online (Stripe redirect)',
        payment_status: 'Paid',
      })
        .then(({ booking: b }) => {
          clearPending();
          setBooking(b);
        })
        .catch(() => setBooking(null))
        .finally(() => setFinishing(false));
      return;
    }
    setBooking(loadLastBooking());
  }, [booking, redirectStatus, pending]);

  if (finishing) {
    return (
      <section className="book-page">
        <div className="container checkout-single" style={{ maxWidth: 560 }}>
          <div className="confirm-card">
            <div className="slots-loading" style={{ justifyContent: 'center' }}>
              <LoaderCircle size={20} className="spin" /> Finalizing your booking…
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!booking) {
    return (
      <section className="book-page">
        <div className="container checkout-single" style={{ maxWidth: 560 }}>
          <div className="confirm-card">
            <h1>No booking found</h1>
            <p className="step-sub" style={{ marginTop: 12 }}>
              If you just paid and don&apos;t see a confirmation, please call us at {BUSINESS.phoneDisplay}.
            </p>
            <div className="confirm-actions">
              <Link to="/book" className="btn btn-gold">
                <span>Book a detail</span>
              </Link>
              <a href={BUSINESS.phoneHref} className="btn btn-outline">
                <span>
                  <Phone size={17} /> Call Now
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const rows = [
    ['Service', booking.service],
    ['Date', format(fromDateKey(booking.date), 'EEEE, MMMM d, yyyy')],
    ['Time', booking.time],
    ['Vehicle', booking.vehicle],
    ['Address', booking.address],
    ['Payment', booking.payment_status === 'Paid' ? 'Paid online' : 'Pay on service day'],
  ];

  return (
    <section className="book-page">
      <div className="container checkout-single" style={{ maxWidth: 580 }}>
        <div className="confirm-card">
          <div className="confirm-icon">
            <Check size={42} strokeWidth={3.2} />
          </div>
          <span className="eyebrow">You&apos;re booked</span>
          <h1 style={{ marginTop: 10 }}>See you soon, {booking.name?.split(' ')[0]}!</h1>
          <div className="confirm-id">#{booking.id}</div>
          <div className="confirm-rows">
            {rows.map(([k, v]) => (
              <div key={k}>
                <span>{k}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>
          <div className="confirm-actions">
            <button type="button" className="btn btn-gold" onClick={() => downloadIcs(booking)}>
              <span>
                <CalendarPlus size={17} /> Add to calendar
              </span>
            </button>
            <a href={BUSINESS.phoneHref} className="btn btn-outline">
              <span>
                <Phone size={17} /> {BUSINESS.phoneDisplay}
              </span>
            </a>
            <Link to="/" className="btn btn-outline">
              <span>
                <House size={17} /> Home
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
