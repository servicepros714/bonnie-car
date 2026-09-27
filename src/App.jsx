import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import MobileActionBar from './components/MobileActionBar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Book from './pages/Book';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 60);
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}

const FLOW_ROUTES = ['/book', '/checkout', '/confirmation'];

export default function App() {
  const { pathname } = useLocation();
  const inFlow = FLOW_ROUTES.includes(pathname);

  return (
    <>
      <ScrollManager />
      <Navbar solid={inFlow} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<Book />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/confirmation" element={<Confirmation />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!inFlow && <Footer />}
      {!inFlow && <MobileActionBar />}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#0b2350',
            color: '#e9eef4',
            border: '1px solid rgba(111,211,255,.28)',
            fontFamily: 'Sora, sans-serif',
            fontSize: '14px',
          },
          iconTheme: { primary: '#f7c520', secondary: '#140f00' },
        }}
      />
    </>
  );
}
