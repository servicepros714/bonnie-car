import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  CalendarCheck,
  Check,
  Plus,
  ArrowRight,
  Truck,
  ShieldCheck,
  Droplets,
  Sparkles,
  CreditCard,
  Clock,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Hand,
} from 'lucide-react';
import useReveal from '../components/useReveal';
import { BUSINESS, PACKAGES, EXTERIOR, SERVICE_AREAS, GALLERY, PREPAY_DISCOUNT } from '../data/site';

/* ─── Hero ───────────────────────────────────────────── */
function Bubbles() {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: `${(i * 61) % 100}%`,
        size: 8 + ((i * 7) % 22),
        dur: 11 + ((i * 3) % 12),
        delay: -((i * 1.7) % 14),
        dx: `${((i % 5) - 2) * 26}px`,
      })),
    []
  );
  return (
    <div className="bubbles" aria-hidden="true">
      {bubbles.map((b, i) => (
        <i
          key={i}
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
            '--dx': b.dx,
          }}
        />
      ))}
    </div>
  );
}

function Hero() {
  const ribbon = [
    'Mobile Detailing',
    'Buena Park, CA',
    'We Come To You',
    'Open 7 Days',
    'Interior Deep Cleans',
    'Hand Wash Add-On',
  ];
  return (
    <section className="hero" id="top">
      <div className="hero-grid-bg" />
      <Bubbles />
      <div className="container hero-inner">
        <div>
          <span className="hero-kicker reveal">
            <b>Mobile</b> Car detailing · {BUSINESS.city}, {BUSINESS.region}
          </span>
          <h1 className="reveal" style={{ '--d': '80ms' }}>
            <span className="chrome">We bring the</span> <span className="shine">shine</span>
            <br />
            <span className="chrome">to your driveway.</span>
          </h1>
          <p className="hero-sub reveal" style={{ '--d': '160ms' }}>
            Deep interior details and hand-washed exteriors, done right where your car is parked. Pick a
            package, pick a time — we handle the rest.
          </p>
          <div className="hero-ctas reveal" style={{ '--d': '240ms' }}>
            <Link to="/book" className="btn btn-gold">
              <span>
                <CalendarCheck size={18} /> Book Online
              </span>
            </Link>
            <a href={BUSINESS.phoneHref} className="btn btn-outline">
              <span>
                <Phone size={18} /> {BUSINESS.phoneDisplay}
              </span>
            </a>
          </div>
          <div className="hero-trust reveal" style={{ '--d': '320ms' }}>
            <span>
              <Truck size={16} /> Fully mobile
            </span>
            <span>
              <Clock size={16} /> Open 7 days
            </span>
            <span>
              <CreditCard size={16} /> Pay online or later
            </span>
          </div>
        </div>

        <div className="hero-visual reveal" style={{ '--d': '120ms' }}>
          <div className="hex hero-hex-outline" />
          <div className="hex hero-hex-photo">
            <img
              src="/images/audi-foam.jpg"
              alt="Sedan covered in snow foam during a Bonnie Car Detailing wash"
            />
          </div>
          <div className="hero-badge">
            <small>Details from</small>
            <strong>$150</strong>
          </div>
          <div className="hero-badge hero-badge-2">
            <span className="dot">
              <Droplets size={20} />
            </span>
            <span>
              <b>Save ${PREPAY_DISCOUNT}</b>
              <small>when you prepay</small>
            </span>
          </div>
        </div>
      </div>

      <div className="ribbon" aria-hidden="true">
        <div className="ribbon-track">
          {[0, 1].map((k) => (
            <span key={k}>
              {ribbon.map((t) => (
                <span key={t + k}>
                  {t} <Sparkles size={16} />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Packages ───────────────────────────────────────── */
function Packages() {
  return (
    <section className="section packages" id="packages">
      <div className="container">
        <div className="section-head">
          <div className="reveal">
            <span className="eyebrow">The Detail Menu</span>
            <h2 className="section-title">
              Pick your <span className="gold">package</span>
            </h2>
          </div>
          <p className="section-lead reveal" style={{ '--d': '100ms' }}>
            Two interior packages, one simple add-on. Flat pricing, no surprises — every detail is done by hand
            at your location.
          </p>
        </div>

        <div className="pkg-grid">
          {PACKAGES.map((p, i) => (
            <article
              key={p.id}
              className={`pkg reveal ${p.featured ? 'pkg-featured' : ''}`}
              style={{ '--d': `${i * 120}ms` }}
            >
              <span className="pkg-ghost" aria-hidden="true">
                0{i + 1}
              </span>
              {p.featured && <span className="pkg-flag">Most complete</span>}
              <div className="pkg-top">
                <div>
                  <h3 className="pkg-name">{p.name}</h3>
                  <p className="pkg-tag">{p.tagline}</p>
                </div>
              </div>
              <div className="pkg-price">
                <sup>$</sup>
                <b>{p.price}</b>
                <small>Interior</small>
              </div>
              <ul className="pkg-list">
                {p.items.map((it) => (
                  <li key={it}>
                    <span className="tick">
                      <Check size={14} strokeWidth={3} />
                    </span>
                    {it}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="addon reveal">
          <div className="addon-price hex">
            <div>
              <small>Add-on</small>
              <b>+${EXTERIOR.price}</b>
            </div>
          </div>
          <div>
            <h3>{EXTERIOR.name}</h3>
            <p>Add it to either package during booking for a full inside-and-out finish.</p>
            <ul>
              {EXTERIOR.items.map((it) => (
                <li key={it}>
                  <Plus size={14} strokeWidth={3} />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pkg-cta reveal">
          <Link to="/book" className="btn btn-gold">
            <span>
              Book Now <ArrowRight size={17} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Process ────────────────────────────────────────── */
function Process() {
  const laps = [
    {
      title: 'Pick a package',
      text: 'Choose Basic or Premium, then decide if you want the Exterior Wash added on.',
    },
    {
      title: 'Lock in a time',
      text: 'Grab any open 30-minute slot, 7:00 AM to 7:00 PM, seven days a week.',
    },
    {
      title: 'We pull up & detail',
      text: `We come to your spot in ${BUSINESS.city}. You carry on with your day — we hand back a fresh car.`,
    },
  ];
  return (
    <section className="section process" id="process">
      <div className="container">
        <div className="section-head center reveal">
          <span className="eyebrow blue">How it works</span>
          <h2 className="section-title">
            Three laps to <span className="blue">clean</span>
          </h2>
        </div>
        <div className="road">
          {laps.map((l, i) => (
            <div className="lap reveal" key={l.title} style={{ '--d': `${i * 140}ms` }}>
              <div className="lap-num">
                <span>0{i + 1}</span>
              </div>
              <div>
                <h3>{l.title}</h3>
                <p>{l.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Gallery ────────────────────────────────────────── */
const TILE_LABELS = ['Snow foam pre-wash', 'Wheels & tires', 'Full-body foam', 'Hand wash', 'Driveway finish'];

function Gallery() {
  const [idx, setIdx] = useState(null);

  useEffect(() => {
    if (idx === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setIdx(null);
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % GALLERY.length);
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + GALLERY.length) % GALLERY.length);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [idx]);

  return (
    <section className="section gallery" id="gallery">
      <div className="container">
        <div className="section-head">
          <div className="reveal">
            <span className="eyebrow">Foam files</span>
            <h2 className="section-title">
              Work from the <span className="gold">driveway</span>
            </h2>
          </div>
          <p className="section-lead reveal" style={{ '--d': '100ms' }}>
            Thick foam, careful hands, spotless finish. Tap any shot to see it full size.
          </p>
        </div>
        <div className="bento reveal">
          {GALLERY.map((g, i) => (
            <button key={g.src} className={`tile tile-${i + 1}`} onClick={() => setIdx(i)} aria-label={`View ${g.alt}`}>
              <img src={g.src} alt={g.alt} loading="lazy" />
              <span className="tile-label">{TILE_LABELS[i]}</span>
            </button>
          ))}
        </div>
        <p className="gallery-hint" style={{ display: 'none', justifyContent: 'center', gap: 6, color: 'var(--muted)', fontSize: '0.8rem', marginTop: 12 }}>
          <Hand size={14} /> Swipe for more
        </p>
      </div>

      {idx !== null && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setIdx(null)}>
          <img src={GALLERY[idx].src} alt={GALLERY[idx].alt} onClick={(e) => e.stopPropagation()} />
          <button className="lb-btn lb-close" aria-label="Close" onClick={() => setIdx(null)}>
            <X size={20} />
          </button>
          <button
            className="lb-btn lb-prev"
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i - 1 + GALLERY.length) % GALLERY.length);
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            className="lb-btn lb-next"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => (i + 1) % GALLERY.length);
            }}
          >
            <ChevronRight size={22} />
          </button>
        </div>
      )}
    </section>
  );
}

/* ─── Why Bonnie ─────────────────────────────────────── */
function Why() {
  const items = [
    {
      icon: Truck,
      title: 'We come to you',
      text: `Home, work or apartment lot in ${BUSINESS.city} — no drop-offs, no waiting rooms, no rides needed.`,
    },
    {
      icon: Sparkles,
      title: 'Interior-first detailing',
      text: 'Triple-stage vacuuming, extraction and shampooing that pulls out what a quick wipe leaves behind.',
    },
    {
      icon: ShieldCheck,
      title: 'Protection built in',
      text: 'Premium finishes with a UV-protectant coating to help keep dash and trim from fading in the SoCal sun.',
    },
    {
      icon: CreditCard,
      title: 'Book & pay your way',
      text: `Reserve online in a few taps. Prepay to save $${PREPAY_DISCOUNT}, or choose to pay later.`,
    },
  ];
  return (
    <section className="section why" id="why">
      <div className="container why-grid">
        <div className="why-photo reveal">
          <div className="frame">
            <img src="/images/tesla-shine.jpg" alt="Freshly detailed white SUV shining in a driveway" loading="lazy" />
          </div>
          <div className="stamp" aria-hidden="true">
            <div>
              <b>7</b>days
              <br />a week
            </div>
          </div>
        </div>
        <div>
          <div className="reveal">
            <span className="eyebrow">Why Bonnie</span>
            <h2 className="section-title">
              Built for <span className="gold">busy</span> drivers
            </h2>
            <p className="section-lead">
              Your schedule stays yours. We bring the equipment, the products and the patience to get every
              corner right.
            </p>
          </div>
          <div className="why-list">
            {items.map(({ icon: Icon, title, text }, i) => (
              <div className="why-item reveal" key={title} style={{ '--d': `${i * 90}ms` }}>
                <span className="ico">
                  <Icon size={24} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="stats reveal">
            <div className="stat">
              <b>100%</b>
              <small>Mobile</small>
            </div>
            <div className="stat">
              <b>7</b>
              <small>Days open</small>
            </div>
            <div className="stat">
              <b>7AM–7PM</b>
              <small>Booking hours</small>
            </div>
            <div className="stat">
              <b>${PREPAY_DISCOUNT}</b>
              <small>Prepay savings</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Service area ───────────────────────────────────── */
function Area() {
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(BUSINESS.mapQuery)}&t=&z=12&ie=UTF8&iwloc=&output=embed`;
  return (
    <section className="section area" id="area">
      <div className="container">
        <div className="area-card reveal">
          <div className="area-copy">
            <span className="eyebrow blue">Service area</span>
            <h2 className="section-title">
              Rolling through <span className="gold">{BUSINESS.city}</span>
            </h2>
            <p className="section-lead">
              Based in {BUSINESS.city} and detailing across the neighborhoods around it. Not sure if we reach
              you? Give us a call.
            </p>
            <div className="chips">
              {SERVICE_AREAS.map((a, i) => (
                <span key={a} className={`chip ${i === 0 ? 'home' : ''}`}>
                  <MapPin size={13} /> {a}
                </span>
              ))}
            </div>
            <div className="area-info">
              <div>
                <Clock size={18} /> {BUSINESS.hours}
              </div>
              <div>
                <Phone size={18} /> <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>
              </div>
            </div>
          </div>
          <div className="area-map">
            <iframe title={`Map of ${BUSINESS.city}`} src={mapSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ────────────────────────────────────────────── */
const FAQS = [
  {
    q: 'Do you really come to me?',
    a: `Yes — Bonnie Car Detailing is fully mobile. Book a time and we meet your car where it's parked in and around ${BUSINESS.city}.`,
  },
  {
    q: "What's the difference between Basic and Premium?",
    a: 'Basic Detail ($150) is a thorough interior refresh: triple-stage vacuuming, a full surface wipe-down and floor mat cleaning. Premium Detail ($200) goes deeper with carpet extraction, full interior shampooing, interior glass and a UV-protectant coating.',
  },
  {
    q: 'Can I get the outside washed too?',
    a: `Absolutely. Add the Exterior Wash for +$${EXTERIOR.price} during booking — hand wash, rims, tire scrub and shine, door jambs and a spot-free hand dry.`,
  },
  {
    q: 'How does payment work?',
    a: `Prepay securely online with card, Apple Pay or Google Pay and save $${PREPAY_DISCOUNT} with code PREPAY, or choose "I'll pay later" at checkout and pay on the day.`,
  },
  {
    q: 'What hours can I book?',
    a: 'Appointments run in 30-minute slots from 7:00 AM to 7:00 PM, Monday through Sunday. Online bookings open 4 hours from now — for anything sooner, give us a call.',
  },
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section faq" id="faq">
      <div className="container faq-grid">
        <div className="reveal">
          <span className="eyebrow">Questions</span>
          <h2 className="section-title">
            Good to <span className="gold">know</span>
          </h2>
          <p className="section-lead">Anything else on your mind? We&apos;re a quick call away.</p>
          <a href={BUSINESS.phoneHref} className="btn btn-outline" style={{ marginTop: 26 }}>
            <span>
              <Phone size={17} /> {BUSINESS.phoneDisplay}
            </span>
          </a>
        </div>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div key={f.q} className={`faq-item reveal ${open === i ? 'open' : ''}`} style={{ '--d': `${i * 70}ms` }}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                {f.q}
                <span className="pm">
                  <Plus size={18} />
                </span>
              </button>
              <div className="faq-a">
                <div>
                  <p>{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA band ───────────────────────────────────────── */
function Cta() {
  return (
    <section className="cta">
      <div className="container">
        <div className="cta-band reveal">
          <div>
            <span className="eyebrow">
              <Star size={14} /> Ready when you are
            </span>
            <h2 style={{ marginTop: 12 }}>Your car&apos;s next clean starts here.</h2>
            <p>Pick a package and a time in a few taps — we&apos;ll bring the shine to you.</p>
          </div>
          <div className="actions">
            <Link to="/book" className="btn btn-gold">
              <span>
                <CalendarCheck size={18} /> Book Online
              </span>
            </Link>
            <a href={BUSINESS.phoneHref} className="btn btn-outline">
              <span>
                <Phone size={18} /> Call Now
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useReveal([]);
  return (
    <>
      <Hero />
      <Packages />
      <Process />
      <Gallery />
      <Why />
      <Area />
      <Faq />
      <Cta />
    </>
  );
}
