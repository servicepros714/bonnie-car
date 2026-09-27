import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, CalendarCheck, ChevronRight, Clock, MapPin } from 'lucide-react';
import { BUSINESS } from '../data/site';

const LINKS = [
  { to: '/#packages', label: 'Packages', num: '01' },
  { to: '/#process', label: 'How It Works', num: '02' },
  { to: '/#gallery', label: 'Gallery', num: '03' },
  { to: '/#area', label: 'Service Area', num: '04' },
  { to: '/#faq', label: 'FAQ', num: '05' },
];

export default function Navbar({ solid = false }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const cls = ['nav', scrolled && 'scrolled', solid && 'solid'].filter(Boolean).join(' ');

  return (
    <>
      <header className={cls}>
        <div className="container nav-inner">
          <Link to="/" className="nav-logo" aria-label={`${BUSINESS.fullName} home`}>
            <img src="/images/logo-sm.webp" alt={BUSINESS.fullName} width="360" height="264" />
          </Link>

          <nav className="nav-links" aria-label="Main">
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to}>
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="nav-actions">
            <a href={BUSINESS.phoneHref} className="nav-phone">
              <span className="ico">
                <Phone size={16} />
              </span>
              <span>
                <small>Call or text</small>
                {BUSINESS.phoneDisplay}
              </span>
            </a>
            <Link to="/book" className="btn btn-gold btn-sm">
              <span>
                <CalendarCheck size={16} /> Book Online
              </span>
            </Link>
          </div>

          <button
            className="nav-burger"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Mobile bottom-sheet menu */}
      <div className={`sheet-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sheet ${open ? 'open' : ''}`} aria-hidden={!open} aria-label="Mobile menu">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <img src="/images/logo-sm.webp" alt="" width="360" height="264" />
          <button className="sheet-close" onClick={() => setOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="sheet-links">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              {l.label}
              <span>
                {l.num} <ChevronRight size={14} style={{ verticalAlign: '-2px' }} />
              </span>
            </Link>
          ))}
        </nav>
        <div className="sheet-meta">
          <span>
            <Clock size={13} style={{ verticalAlign: '-2px' }} /> {BUSINESS.hours}
          </span>
          <span>
            <MapPin size={13} style={{ verticalAlign: '-2px' }} /> {BUSINESS.address}
          </span>
        </div>
        <div className="action-bar">
          <a href={BUSINESS.phoneHref} className="btn btn-outline" tabIndex={open ? 0 : -1}>
            <span>
              <Phone size={18} /> Call Now
            </span>
          </a>
          <Link to="/book" className="btn btn-gold" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
            <span>
              <CalendarCheck size={18} /> Book Online
            </span>
          </Link>
        </div>
      </aside>
    </>
  );
}
