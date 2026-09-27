import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  addDays,
  addMonths,
  endOfMonth,
  format,
  isAfter,
  isBefore,
  isSameDay,
  startOfMonth,
  getDay,
  getDaysInMonth,
} from 'date-fns';
import toast from 'react-hot-toast';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  LoaderCircle,
  Car,
  Droplets,
} from 'lucide-react';
import { PACKAGES, EXTERIOR, BOOKING_WINDOW_DAYS } from '../data/site';
import { allSlots, formatPhone, fromDateKey, isDayClosed, isSlotPast, pacificToday, toDateKey } from '../utils/time';
import { getBookedTimes, loadPending, savePending } from '../utils/bookingDb';

const STEPS = ['Package', 'Exterior', 'Date', 'Time', 'Details'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EMPTY_INFO = { name: '', phone: '', email: '', vehicle: '', address: '' };
const FIELDS = [
  { key: 'name', label: 'Full Name', placeholder: 'Jane Doe', type: 'text', autoComplete: 'name' },
  { key: 'phone', label: 'Phone', placeholder: '(657) 555-0123', type: 'tel', autoComplete: 'tel', inputMode: 'tel' },
  { key: 'email', label: 'Email', placeholder: 'you@email.com', type: 'email', autoComplete: 'email', inputMode: 'email' },
  { key: 'vehicle', label: 'Vehicle', placeholder: 'Year Make Model — e.g. 2021 Toyota Camry', type: 'text' },
  { key: 'address', label: 'Service Address', placeholder: 'Street, City, ZIP', type: 'text', autoComplete: 'street-address', full: true },
];

function validateField(key, value) {
  const v = value.trim();
  switch (key) {
    case 'name':
      return v.length >= 2 ? '' : 'Please enter your full name.';
    case 'phone':
      return v.replace(/\D/g, '').length === 10 ? '' : 'Please enter a 10-digit phone number.';
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Please enter a valid email address.';
    case 'vehicle':
      return v.length >= 3 ? '' : 'Please enter your vehicle (Year Make Model).';
    case 'address':
      return v.length >= 5 ? '' : 'Please enter the address where we should meet your car.';
    default:
      return '';
  }
}

export default function Book() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const pending = useMemo(() => loadPending(), []);

  const [step, setStep] = useState(0);
  const [pkg, setPkg] = useState(() => {
    const q = params.get('service');
    if (q && PACKAGES.some((p) => p.id === q)) return q;
    return pending?.packageId || null;
  });
  const [exterior, setExterior] = useState(pending ? Boolean(pending.exterior) : false);
  const [dateKey, setDateKey] = useState(pending?.date || null);
  const [time, setTime] = useState(pending?.time || null);
  const [info, setInfo] = useState(pending?.info || EMPTY_INFO);
  const [errors, setErrors] = useState({});

  const today = useMemo(() => pacificToday(), []);
  const lastDay = useMemo(() => addDays(today, BOOKING_WINDOW_DAYS), [today]);
  const [month, setMonth] = useState(() => startOfMonth(dateKey ? fromDateKey(dateKey) : today));

  const [booked, setBooked] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const inputRefs = useRef({});
  const cardRef = useRef(null);

  const selectedPkg = PACKAGES.find((p) => p.id === pkg);
  const total = (selectedPkg?.price || 0) + (exterior ? EXTERIOR.price : 0);

  // Auto-scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Load taken slots whenever the date changes
  useEffect(() => {
    if (!dateKey) return undefined;
    let alive = true;
    setLoadingSlots(true);
    getBookedTimes(dateKey).then((list) => {
      if (!alive) return;
      setBooked(list);
      setLoadingSlots(false);
      if (time && list.includes(time)) setTime(null);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  const slots = useMemo(() => {
    if (!dateKey) return [];
    return allSlots().map((s) => ({
      ...s,
      disabled: booked.includes(s.label) || isSlotPast(dateKey, s.minutes),
    }));
  }, [dateKey, booked]);

  /* ─── Navigation ─── */
  function stepError(s) {
    if (s === 0 && !pkg) return 'Please choose a package to continue.';
    if (s === 2 && !dateKey) return 'Please pick a date to continue.';
    if (s === 3 && !time) return 'Please pick a time to continue.';
    return '';
  }

  function goNext() {
    const err = stepError(step);
    if (err) {
      toast.error(err);
      return;
    }
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    // Validate details, focus first bad field
    const nextErrors = {};
    FIELDS.forEach((f) => {
      const e = validateField(f.key, info[f.key]);
      if (e) nextErrors[f.key] = e;
    });
    setErrors(nextErrors);
    const first = FIELDS.find((f) => nextErrors[f.key]);
    if (first) {
      toast.error(`${first.label}: ${nextErrors[first.key]}`);
      const el = inputRefs.current[first.key];
      if (el) {
        el.focus({ preventScroll: true });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    const clean = Object.fromEntries(Object.entries(info).map(([k, v]) => [k, v.trim()]));
    savePending({
      packageId: pkg,
      exterior: Boolean(exterior),
      date: dateKey,
      time,
      info: clean,
      subtotal: total,
    });
    navigate('/checkout');
  }

  function goBack() {
    if (step > 0) setStep(step - 1);
  }

  function update(key, value) {
    const v = key === 'phone' ? formatPhone(value) : value;
    setInfo((prev) => ({ ...prev, [key]: v }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: validateField(key, v) }));
  }

  /* ─── Calendar model ─── */
  const calendarCells = useMemo(() => {
    const first = startOfMonth(month);
    const lead = getDay(first);
    const days = getDaysInMonth(month);
    const cells = Array.from({ length: lead }, (_, i) => ({ blank: true, key: `b${i}` }));
    for (let d = 1; d <= days; d += 1) {
      const date = new Date(month.getFullYear(), month.getMonth(), d);
      const key = toDateKey(date);
      const disabled = isBefore(date, today) || isAfter(date, lastDay) || isDayClosed(key);
      cells.push({ date, key, disabled, isToday: isSameDay(date, today) });
    }
    return cells;
  }, [month, today, lastDay]);

  const canPrevMonth = isAfter(startOfMonth(month), startOfMonth(today));
  const canNextMonth = isBefore(endOfMonth(month), lastDay);

  const morning = slots.filter((s) => s.minutes < 12 * 60);
  const afternoon = slots.filter((s) => s.minutes >= 12 * 60);

  const continueLabel = step === 4 ? 'Checkout' : 'Continue';

  return (
    <section className="book-page">
      <div className="container book-wrap">
        <div className="book-head">
          <div>
            <span className="eyebrow">Book online</span>
            <h1>Reserve your detail</h1>
          </div>
          <div className="book-total">
            <small>Your total</small>
            <b>${total}</b>
          </div>
        </div>

        <div className="gauge" role="list" aria-label="Booking progress">
          {STEPS.map((s, i) => {
            const state = i < step ? 'done' : i === step ? 'current' : 'todo';
            return (
              <button
                key={s}
                type="button"
                role="listitem"
                className="gauge-step"
                data-state={state}
                data-done={i < step}
                onClick={() => i < step && setStep(i)}
                aria-current={i === step ? 'step' : undefined}
                tabIndex={i < step ? 0 : -1}
              >
                <span className="gauge-bar">
                  <i />
                </span>
                <span className="gauge-label">
                  <b>0{i + 1}</b>
                  <span>{s}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="book-card" ref={cardRef}>
          {/* STEP 1 — Package */}
          {step === 0 && (
            <div>
              <h2 className="step-title">Choose your package</h2>
              <p className="step-sub">Both packages are interior details. You can add an exterior wash next.</p>
              <div className="opt-grid">
                {PACKAGES.map((p) => {
                  const sel = pkg === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`opt ${sel ? 'selected' : ''}`}
                      onClick={() => setPkg(sel ? null : p.id)}
                      aria-pressed={sel}
                    >
                      {p.featured && <span className="opt-badge">Most complete</span>}
                      <span className="check">
                        <Check size={17} strokeWidth={3.2} />
                      </span>
                      <span>
                        <span className="opt-name">{p.name}</span>
                        <span className="opt-price">${p.price}</span>
                        <ul>
                          {p.items.map((it) => (
                            <li key={it}>
                              <Check size={13} strokeWidth={3} /> {it}
                            </li>
                          ))}
                        </ul>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2 — Exterior add-on */}
          {step === 1 && (
            <div>
              <h2 className="step-title">Add an exterior wash?</h2>
              <p className="step-sub">Tap to add it for +${EXTERIOR.price}, or press Continue to skip.</p>
              <div className="opt-grid" style={{ gridTemplateColumns: '1fr' }}>
                <button
                  type="button"
                  className={`opt ${exterior ? 'selected' : ''}`}
                  onClick={() => setExterior(!exterior)}
                  aria-pressed={exterior}
                >
                  <span className="opt-badge">Inside + out</span>
                  <span className="check">
                    <Check size={17} strokeWidth={3.2} />
                  </span>
                  <span>
                    <span className="opt-name">Yes, add {EXTERIOR.name}</span>
                    <span className="opt-price">+${EXTERIOR.price}</span>
                    <ul>
                      {EXTERIOR.items.map((it) => (
                        <li key={it}>
                          <Droplets size={13} /> {it}
                        </li>
                      ))}
                    </ul>
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Date */}
          {step === 2 && (
            <div>
              <h2 className="step-title">Pick a date</h2>
              <p className="step-sub">Open seven days a week.</p>
              <div className="cal">
                <div className="cal-head">
                  <button
                    type="button"
                    className="cal-nav"
                    onClick={() => setMonth(addMonths(month, -1))}
                    disabled={!canPrevMonth}
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <h3>{format(month, 'MMMM yyyy')}</h3>
                  <button
                    type="button"
                    className="cal-nav"
                    onClick={() => setMonth(addMonths(month, 1))}
                    disabled={!canNextMonth}
                    aria-label="Next month"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="cal-grid">
                  {DOW.map((d) => (
                    <div key={d} className="cal-dow">
                      {d}
                    </div>
                  ))}
                  {calendarCells.map((c) =>
                    c.blank ? (
                      <span key={c.key} className="cal-day blank" />
                    ) : (
                      <button
                        key={c.key}
                        type="button"
                        className={`cal-day ${c.isToday ? 'today' : ''} ${dateKey === c.key ? 'selected' : ''}`}
                        disabled={c.disabled}
                        onClick={() => {
                          if (dateKey !== c.key) setTime(null);
                          setDateKey(c.key);
                        }}
                        aria-label={format(c.date, 'EEEE, MMMM d')}
                        aria-pressed={dateKey === c.key}
                      >
                        {format(c.date, 'd')}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Time */}
          {step === 3 && (
            <div>
              <h2 className="step-title">Pick a time</h2>
              <p className="step-sub">Choose your arrival window.</p>
              {dateKey && (
                <span className="slot-date">
                  <CalendarDays size={15} /> {format(fromDateKey(dateKey), 'EEEE, MMMM d, yyyy')}
                </span>
              )}
              {loadingSlots ? (
                <div className="slots-loading">
                  <LoaderCircle size={18} className="spin" /> Checking availability…
                </div>
              ) : (
                <>
                  {[
                    ['Morning', morning],
                    ['Afternoon', afternoon],
                  ].map(([label, list]) =>
                    list.length ? (
                      <div className="slot-group" key={label}>
                        <h4>{label}</h4>
                        <div className="slots">
                          {list.map((s) => (
                            <button
                              key={s.label}
                              type="button"
                              className={`slot ${time === s.label ? 'selected' : ''}`}
                              disabled={s.disabled}
                              onClick={() => setTime(time === s.label ? null : s.label)}
                              aria-pressed={time === s.label}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null
                  )}
                  {slots.length > 0 && slots.every((s) => s.disabled) && (
                    <p className="step-sub" style={{ marginTop: 18 }}>
                      This day is fully booked — please go back and choose another date.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 5 — Details */}
          {step === 4 && (
            <div>
              <h2 className="step-title">Your details</h2>
              <p className="step-sub">Where should we meet your car?</p>
              <div className="recap">
                <span>
                  <Car size={14} /> {selectedPkg?.name}
                  {exterior ? ` + ${EXTERIOR.name}` : ''}
                </span>
                <span>
                  <CalendarDays size={14} /> {dateKey && format(fromDateKey(dateKey), 'EEE, MMM d')}
                </span>
                <span>
                  <Clock size={14} /> {time}
                </span>
              </div>
              <div className="form-grid">
                {FIELDS.map((f) => (
                  <div key={f.key} className={`field ${f.full ? 'full' : ''} ${errors[f.key] ? 'error' : ''}`}>
                    <label htmlFor={`f-${f.key}`}>{f.label}</label>
                    <input
                      id={`f-${f.key}`}
                      ref={(el) => {
                        inputRefs.current[f.key] = el;
                      }}
                      type={f.type}
                      inputMode={f.inputMode}
                      autoComplete={f.autoComplete}
                      placeholder={f.placeholder}
                      value={info[f.key]}
                      onChange={(e) => update(f.key, e.target.value)}
                      aria-invalid={Boolean(errors[f.key])}
                      aria-describedby={errors[f.key] ? `e-${f.key}` : undefined}
                    />
                    {errors[f.key] && (
                      <span className="err" id={`e-${f.key}`}>
                        {errors[f.key]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Back / Continue — becomes a sticky bottom bar on mobile */}
          <div className={`step-actions ${step === 0 ? 'first' : ''}`}>
            <div className="bar-total">
              <span>
                Step {step + 1} of {STEPS.length} · {STEPS[step]}
              </span>
              <span>
                Total <b>${total}</b>
              </span>
            </div>
            {step > 0 ? (
              <button type="button" className="btn btn-outline" onClick={goBack}>
                <span>
                  <ArrowLeft size={17} /> Back
                </span>
              </button>
            ) : (
              <span className="desktop-spacer" />
            )}
            <button type="button" className="btn btn-gold" onClick={goNext}>
              <span>
                {continueLabel} <ArrowRight size={17} />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
