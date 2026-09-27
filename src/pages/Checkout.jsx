import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, ExpressCheckoutElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeft, Lock, LoaderCircle, ShieldCheck, Tag } from 'lucide-react';
import { PACKAGES, EXTERIOR, PREPAY_CODE, PREPAY_DISCOUNT } from '../data/site';
import { fromDateKey } from '../utils/time';
import { API_URL, apiConfigured, clearPending, createBooking, getBookedTimes, loadPending } from '../utils/bookingDb';

const PK = (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim();
const stripeReady = PK.startsWith('pk_') && apiConfigured;
const stripePromise = stripeReady ? loadStripe(PK) : null;

const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#0a4fa8',
    colorText: '#0b1830',
    colorDanger: '#d93b3b',
    fontFamily: 'Sora, system-ui, sans-serif',
    borderRadius: '10px',
  },
};

function serviceLabel(pending) {
  const pkg = PACKAGES.find((p) => p.id === pending.packageId);
  return `${pkg?.name || 'Detail'}${pending.exterior ? ` + ${EXTERIOR.name}` : ''}`;
}

function buildBooking(pending, { paymentStatus, total, discount }) {
  const { info } = pending;
  const lines = [`Total: $${total}`];
  if (discount) lines.push(`${PREPAY_CODE} -$${discount}`);
  lines.push(paymentStatus === 'Paid' ? 'Paid online (Stripe)' : 'Pay on service day');
  return {
    date: pending.date,
    time: pending.time,
    service: serviceLabel(pending),
    name: info.name,
    phone: info.phone,
    email: info.email,
    vehicle: info.vehicle,
    address: info.address,
    notes: lines.join(' · '),
    payment_status: paymentStatus,
  };
}

/* ─── Stripe form (inside <Elements>) ─── */
function PayForm({ clientSecret, total, onPaid, disabled }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [expressVisible, setExpressVisible] = useState(true);

  async function confirm() {
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: `${window.location.origin}/confirmation` },
      redirect: 'if_required',
    });
    if (error) {
      toast.error(error.message || 'Payment failed. Please try another method.');
      return false;
    }
    if (paymentIntent && ['succeeded', 'processing', 'requires_capture'].includes(paymentIntent.status)) {
      await onPaid(paymentIntent.id);
      return true;
    }
    toast.error('Payment was not completed.');
    return false;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy(true);
    try {
      await confirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="pay-card">
      <h3>
        <Lock size={16} /> Pay securely
      </h3>
      {expressVisible && (
        <>
          <ExpressCheckoutElement
            onReady={({ availablePaymentMethods }) => {
              if (!availablePaymentMethods) setExpressVisible(false);
            }}
            onConfirm={async () => {
              setBusy(true);
              try {
                await confirm();
              } finally {
                setBusy(false);
              }
            }}
          />
          <div className="pay-divider">or pay with card</div>
        </>
      )}
      <PaymentElement options={{ layout: 'tabs', wallets: { applePay: 'never', googlePay: 'never' } }} />
      <button type="submit" className="btn btn-gold btn-block" disabled={!stripe || busy || disabled}>
        <span>
          {busy ? <LoaderCircle size={18} className="spin" /> : <Lock size={17} />}
          {busy ? 'Processing…' : `Pay $${total}`}
        </span>
      </button>
      <p className="pay-note">
        <ShieldCheck size={14} /> Payments processed securely by Stripe
      </p>
    </form>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const pending = useMemo(() => loadPending(), []);

  const [code, setCode] = useState('');
  const [applied, setApplied] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [intentError, setIntentError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!pending) navigate('/book', { replace: true });
  }, [pending, navigate]);

  const subtotal = pending?.subtotal || 0;
  const discount = applied ? PREPAY_DISCOUNT : 0;
  const total = subtotal - discount;

  // Create / refresh the PaymentIntent whenever the total changes
  useEffect(() => {
    if (!pending || !stripeReady) return undefined;
    let alive = true;
    setClientSecret('');
    setIntentError('');
    fetch(`${API_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: total * 100,
        description: `Bonnie Car Detailing — ${serviceLabel(pending)} on ${pending.date} ${pending.time}`,
        email: pending.info.email,
      }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!alive) return;
        if (!ok || !d.clientSecret) throw new Error(d.error || 'Could not start payment.');
        setClientSecret(d.clientSecret);
      })
      .catch((err) => alive && setIntentError(err.message || 'Could not start payment.'));
    return () => {
      alive = false;
    };
  }, [pending, total]);

  if (!pending) return null;

  function applyCode(value = code) {
    if (value.trim().toUpperCase() === PREPAY_CODE) {
      setApplied(true);
      setCode('');
      toast.success(`$${PREPAY_DISCOUNT} prepay discount applied`);
    } else {
      toast.error('That code is not valid.');
    }
  }

  async function finalize(paymentStatus, paidTotal, paidDiscount) {
    setSaving(true);
    try {
      const { booking } = await createBooking(
        buildBooking(pending, { paymentStatus, total: paidTotal, discount: paidDiscount })
      );
      clearPending();
      navigate('/confirmation', { state: { booking } });
    } catch (err) {
      if (err.code === 'SLOT_TAKEN') {
        toast.error('Sorry — that time was just booked. Please choose another slot.');
        navigate('/book');
      } else {
        toast.error(err.message || 'Something went wrong saving your booking. Please call us.');
      }
    } finally {
      setSaving(false);
    }
  }

  async function payLater() {
    if (saving) return;
    const taken = await getBookedTimes(pending.date);
    if (taken.includes(pending.time)) {
      toast.error('Sorry — that time was just booked. Please choose another slot.');
      navigate('/book');
      return;
    }
    finalize('Pay Later', subtotal, 0);
  }

  const dateLabel = format(fromDateKey(pending.date), 'EEE, MMM d, yyyy');

  return (
    <section className="book-page checkout-page">
      <div className="container checkout-single">
        <Link to="/book" className="back-link">
          <ArrowLeft size={16} /> Back to booking
        </Link>
        <span className="eyebrow" style={{ display: 'flex' }}>
          Secure checkout
        </span>
        <h1 className="checkout-title">Confirm & pay</h1>

        {stripeReady && !applied && (
          <div className="prepay-banner">
            <span className="big">$15 OFF</span>
            <div>
              <strong>Prepay now & save ${PREPAY_DISCOUNT}</strong>
              Use code <b>{PREPAY_CODE}</b> when you pay online today.
            </div>
            <button type="button" onClick={() => applyCode(PREPAY_CODE)}>
              Apply
            </button>
          </div>
        )}

        <div className="summary-card">
          <div className="summary-row">
            <span>{serviceLabel(pending)}</span>
            <span>${subtotal}</span>
          </div>
          {applied && (
            <div className="summary-row discount">
              <span>Prepay discount ({PREPAY_CODE})</span>
              <span>−${PREPAY_DISCOUNT}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>{stripeReady ? 'Total due today' : 'Total'}</span>
            <b>${total}</b>
          </div>
          <p className="summary-meta">
            {dateLabel} · {pending.time} · {pending.info.vehicle}
          </p>
        </div>

        {!stripeReady ? null : applied ? (
          <div className="coupon-applied">
            <span>
              <Tag size={14} style={{ verticalAlign: '-2px' }} /> {PREPAY_CODE} applied — you save ${PREPAY_DISCOUNT}
            </span>
            <button type="button" onClick={() => setApplied(false)}>
              Remove
            </button>
          </div>
        ) : (
          <form
            className="coupon"
            onSubmit={(e) => {
              e.preventDefault();
              applyCode();
            }}
          >
            <label htmlFor="coupon" className="sr-only">
              Coupon code
            </label>
            <input
              id="coupon"
              placeholder="Coupon code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
            />
            <button type="submit" className="btn btn-outline">
              <span>Apply</span>
            </button>
          </form>
        )}

        {stripeReady ? (
          intentError ? (
            <div className="pay-card">
              <p className="demo-note">
                {intentError} You can still reserve your spot below and pay on the day.
              </p>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance }} key={clientSecret}>
              <PayForm
                clientSecret={clientSecret}
                total={total}
                disabled={saving}
                onPaid={() => finalize('Paid', total, discount)}
              />
            </Elements>
          ) : (
            <div className="pay-card">
              <div className="slots-loading" style={{ color: '#6b7890' }}>
                <LoaderCircle size={18} className="spin" /> Preparing secure payment…
              </div>
            </div>
          )
        ) : (
          <div className="pay-card">
            <h3>
              <Lock size={16} /> Online payment
            </h3>
            <p className="demo-note">
              Online payments aren&apos;t switched on yet (demo mode). Your booking will be reserved and you can
              pay on the day of service.
            </p>
            <button type="button" className="btn btn-gold btn-block" onClick={payLater} disabled={saving}>
              <span>
                {saving && <LoaderCircle size={18} className="spin" />} Reserve my spot
              </span>
            </button>
          </div>
        )}

        <button type="button" className="pay-later" onClick={payLater} disabled={saving}>
          I&apos;ll pay later
        </button>
      </div>
    </section>
  );
}
