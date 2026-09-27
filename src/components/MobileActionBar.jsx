import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, CalendarCheck } from 'lucide-react';
import { BUSINESS } from '../data/site';

/** Sticky Call Now / Book Online bar — slides in once the hero is scrolled past (mobile only). */
export default function MobileActionBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    document.body.classList.add('has-mobile-bar');
    const onScroll = () => {
      const hero = document.querySelector('.hero');
      const limit = hero ? hero.offsetHeight - 120 : 400;
      setShow(window.scrollY > limit);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      document.body.classList.remove('has-mobile-bar');
    };
  }, []);

  return (
    <div className={`mobile-bar ${show ? 'show' : ''}`} aria-hidden={!show}>
      <div className="action-bar">
        <a href={BUSINESS.phoneHref} className="btn btn-outline" tabIndex={show ? 0 : -1}>
          <span>
            <Phone size={18} /> Call Now
          </span>
        </a>
        <Link to="/book" className="btn btn-gold" tabIndex={show ? 0 : -1}>
          <span>
            <CalendarCheck size={18} /> Book Online
          </span>
        </Link>
      </div>
    </div>
  );
}
