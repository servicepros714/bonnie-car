import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, CalendarCheck } from 'lucide-react';
import { BUSINESS, PACKAGES, EXTERIOR } from '../data/site';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src="/images/logo-sm.webp" alt={BUSINESS.fullName} width="360" height="264" loading="lazy" />
          <p>
            Mobile car detailing in {BUSINESS.city}, {BUSINESS.region}. We roll up to your driveway, your
            office or your curb — you get your day back and a car that looks it.
          </p>
        </div>

        <div>
          <h4>Services</h4>
          <ul>
            {PACKAGES.map((p) => (
              <li key={p.id}>
                <Link to={`/book?service=${p.id}`}>
                  {p.name} — ${p.price}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/book">
                {EXTERIOR.name} — +${EXTERIOR.price}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Explore</h4>
          <ul>
            <li>
              <Link to="/#process">How It Works</Link>
            </li>
            <li>
              <Link to="/#gallery">Gallery</Link>
            </li>
            <li>
              <Link to="/#area">Service Area</Link>
            </li>
            <li>
              <Link to="/#faq">FAQ</Link>
            </li>
            <li>
              <Link to="/book">Book Online</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Contact</h4>
          <ul>
            <li className="row">
              <Phone size={15} />
              <a href={BUSINESS.phoneHref}>{BUSINESS.phoneDisplay}</a>
            </li>
            <li className="row">
              <MapPin size={15} />
              <span>{BUSINESS.address}</span>
            </li>
            <li className="row">
              <Clock size={15} />
              <span>{BUSINESS.hours}</span>
            </li>
            <li className="row">
              <CalendarCheck size={15} />
              <Link to="/book">Book online anytime</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-word" aria-hidden="true">
        BONNIE
      </div>
      <div className="footer-bottom">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span>
            © {year} {BUSINESS.fullName}. All rights reserved.
          </span>
          <span>Mobile Car Detailing · Buena Park, CA</span>
        </div>
      </div>
    </footer>
  );
}
