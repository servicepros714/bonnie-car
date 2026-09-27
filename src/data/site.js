// ───────────────────────────────────────────────────────────
//  Bonnie Car Detailing Buena Park — single source of truth
//  Edit business details, services and slots here.
// ───────────────────────────────────────────────────────────

export const BUSINESS = {
  name: 'Bonnie Car Detailing',
  fullName: 'Bonnie Car Detailing Buena Park',
  city: 'Buena Park',
  region: 'CA',
  address: 'Buena Park, CA',
  phoneDisplay: '(657) 701-3431',
  phoneHref: 'tel:+16577013431',
  hours: 'Mon – Sun · By appointment',
  hoursShort: '7 days a week',
  mapQuery: 'Buena Park, CA',
};

// Booking plumbing — shared portfolio conventions
export const SOURCE = 'bonnie';
export const ID_PREFIX = 'BON-';
export const TIMEZONE = 'America/Los_Angeles';
export const PREPAY_CODE = 'PREPAY';
export const PREPAY_DISCOUNT = 15;

// Interior packages (pick one)
export const PACKAGES = [
  {
    id: 'basic',
    name: 'Basic Detail',
    price: 150,
    tagline: 'The reset your daily driver needs.',
    items: [
      'Triple-Stage Vacuuming for Deep Debris Removal',
      'Complete Interior Surface Wipe-Down',
      'Floor Mat Cleaning & Restoration',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Detail',
    price: 200,
    tagline: 'Deep-clean, shampoo and protect — top to bottom.',
    featured: true,
    items: [
      'Triple-Stage Vacuuming',
      'Cabin Application',
      'Dust Elimination',
      'Interior Window Cleaning',
      'Deep Carpet Cleaning',
      'Cloth & Carpet Extraction',
      'Full Interior Shampooing',
      'UV-Protectant Coating',
    ],
  },
];

// Add-on (booked together with a package)
export const EXTERIOR = {
  id: 'exterior',
  name: 'Exterior Wash',
  price: 50,
  items: [
    'Hand-Washed Exterior',
    'Detailed Rim Cleaning',
    'Tire Scrub and Degrease',
    'Door Jamb & Panel Wipe-Down',
    'Premium Tire Shine Application',
    'Spot-Free Hand Drying',
  ],
};

// 30-minute slots, 7:00 AM – 7:00 PM, Mon–Sun
export const SLOT_START_MIN = 7 * 60;
export const SLOT_END_MIN = 19 * 60;
// Earliest bookable slot = current California time + 4 hours
export const LEAD_TIME_MIN = 4 * 60;
export const SLOT_STEP_MIN = 30;
export const BOOKING_WINDOW_DAYS = 60;

// Nearby areas shown in the service-area section — edit freely
export const SERVICE_AREAS = [
  'Buena Park',
  'Anaheim',
  'Fullerton',
  'Cypress',
  'La Palma',
  'Stanton',
  'Cerritos',
  'La Mirada',
];

export const GALLERY = [
  { src: '/images/audi-foam.jpg', alt: 'Silver sedan covered in thick snow-foam pre-wash' },
  { src: '/images/foam-wheel.jpg', alt: 'Close-up of a foamed wheel and tire during a hand wash' },
  { src: '/images/corvette-foam.jpg', alt: 'Mid-engine sports car foamed during a mobile wash' },
  { src: '/images/red-wheel.jpg', alt: 'Gloved hand scrubbing a red fender next to a soapy wheel' },
  { src: '/images/tesla-shine.jpg', alt: 'Freshly detailed white SUV gleaming in the driveway' },
];
