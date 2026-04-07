const SERVICE_MEDIA = {
  Electrician: {
    cover:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80",
    video:
      "https://videos.pexels.com/video-files/4489759/4489759-uhd_2560_1440_25fps.mp4",
  },
  Plumber: {
    cover:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
    video:
      "https://videos.pexels.com/video-files/4488643/4488643-uhd_2560_1440_25fps.mp4",
  },
  Carpenter: {
    cover:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    video:
      "https://videos.pexels.com/video-files/855143/855143-hd_1920_1080_25fps.mp4",
  },
  "Kitchen Cleaning": {
    cover:
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80",
    video:
      "https://videos.pexels.com/video-files/4106990/4106990-uhd_2732_1440_25fps.mp4",
  },
  "Deep Cleaning": {
    cover:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    video:
      "https://videos.pexels.com/video-files/4106993/4106993-hd_1920_1080_25fps.mp4",
  },
  "AC Service": {
    cover:
      "https://images.unsplash.com/photo-1623039405147-547794f92e9e?auto=format&fit=crop&w=1200&q=80",
    video:
      "https://videos.pexels.com/video-files/855126/855126-hd_1920_1080_25fps.mp4",
  },
  Painting: {
    cover:
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80",
    video:
      "https://videos.pexels.com/video-files/4121618/4121618-hd_1920_1080_30fps.mp4",
  },
};

export const SERVICE_BLUEPRINTS = [
  {
    slug: "electrician",
    name: "Electrician",
    category: "Repairs",
    description:
      "Fast electrical repairs, fan installation, switchboard replacement, and preventive safety checks by verified technicians.",
    startingPrice: 399,
    duration: "45-90 min",
    rating: 4.8,
    reviewsCount: 2140,
    rewardCoins: 30,
    discountCode: "SPARK150",
    locations: ["Bengaluru", "Mumbai", "Chennai", "Hyderabad", "Delhi NCR"],
    highlights: ["30-minute callback", "Background-verified experts", "7-day workmanship support"],
    includes: ["Switch and socket repair", "Fan and light installation", "MCB and wiring diagnostics"],
    howItWorks: [
      "Pick a date, time, and explain the issue in plain language.",
      "A nearby licensed technician is assigned and confirmed in real time.",
      "Track arrival, job progress, and invoice updates inside your dashboard.",
    ],
    faqs: [
      {
        question: "Do you carry spare parts?",
        answer: "Yes. Standard electrical consumables are carried by most technicians, and premium parts are billed transparently.",
      },
      {
        question: "Is there a post-service warranty?",
        answer: "Every completed visit includes a 7-day service support window for the same issue.",
      },
    ],
    reviews: [
      { author: "Ananya S.", rating: 5, comment: "The electrician arrived on time, diagnosed the issue quickly, and explained every part of the invoice." },
      { author: "Rohit P.", rating: 4.8, comment: "Clean work, great communication, and live tracking actually matched the technician's arrival." },
    ],
  },
  {
    slug: "plumber",
    name: "Plumber",
    category: "Repairs",
    description:
      "Leak fixes, tap replacement, drainage unclogging, and urgent plumbing support with real-time technician assignment.",
    startingPrice: 449,
    duration: "60-120 min",
    rating: 4.7,
    reviewsCount: 1894,
    rewardCoins: 28,
    discountCode: "FLOW10",
    locations: ["Bengaluru", "Pune", "Mumbai", "Delhi NCR", "Kochi"],
    highlights: ["Emergency same-day slots", "Material checklist before arrival", "Water damage-first response"],
    includes: ["Tap and faucet installation", "Leak detection", "Sink and drain service"],
    howItWorks: [
      "Add a note or photo-ready description of the leak, clog, or installation request.",
      "We match a local plumbing expert based on urgency and travel radius.",
      "Admin and worker dashboards receive the same booking instantly for coordinated follow-through.",
    ],
    faqs: [
      {
        question: "Can I book urgent leakage support?",
        answer: "Yes. Priority slots can be selected during checkout and are surfaced first to nearby workers.",
      },
      {
        question: "Will I know if extra materials are needed?",
        answer: "Yes. Workers can update the job notes in real time so you can approve additional material costs.",
      },
    ],
    reviews: [
      { author: "Midhun K.", rating: 4.8, comment: "The worker showed live progress updates and the admin quickly reassigned when traffic delayed the first slot." },
      { author: "Sarah L.", rating: 4.6, comment: "The status updates were clear and the worker arrived with the right tools for the job." },
    ],
  },
  {
    slug: "carpenter",
    name: "Carpenter",
    category: "Installation",
    description:
      "Furniture assembly, door alignment, shelf installation, and modular woodwork support for homes and offices.",
    startingPrice: 599,
    duration: "90-150 min",
    rating: 4.9,
    reviewsCount: 1320,
    rewardCoins: 35,
    discountCode: "WOOD200",
    locations: ["Bengaluru", "Mumbai", "Chennai", "Ahmedabad"],
    highlights: ["Precision tools included", "Before and after quality checks", "Office and residential jobs"],
    includes: ["Wardrobe adjustments", "Shelf mounting", "Furniture repair and assembly"],
    howItWorks: [
      "Choose the service and mention the furniture type or installation request.",
      "The assigned worker confirms tools and visit readiness from their dashboard.",
      "Completion photos and notes are logged in the booking history for future reference.",
    ],
    faqs: [
      {
        question: "Do you handle office furniture installations?",
        answer: "Yes. You can mention office access instructions and dimensions during booking.",
      },
      {
        question: "Can workers bring mounting accessories?",
        answer: "They can arrange standard fittings and will confirm special materials after assessment.",
      },
    ],
    reviews: [
      { author: "Divya M.", rating: 5, comment: "Excellent finish quality and surprisingly polished tracking from booking to completion." },
      { author: "Noel D.", rating: 4.9, comment: "The worker dashboard updates reflected instantly on my side, which made coordination very easy." },
    ],
  },
  {
    slug: "kitchen-cleaning",
    name: "Kitchen Cleaning",
    category: "Cleaning",
    description:
      "Degreasing, cabinet wipe-down, chimney exterior cleaning, and appliance-surface detailing for lived-in kitchens.",
    startingPrice: 799,
    duration: "2-3 hrs",
    rating: 4.8,
    reviewsCount: 980,
    rewardCoins: 45,
    discountCode: "KITCHEN15",
    locations: ["Bengaluru", "Mumbai", "Hyderabad", "Delhi NCR"],
    highlights: ["Eco-safe chemicals", "Appliance surface care", "Weekend-ready slots"],
    includes: ["Countertop sanitation", "Cabinet exterior cleaning", "Sink, stove, and backsplash detailing"],
    howItWorks: [
      "Choose the preferred slot and mention chimney size or heavy stain concerns.",
      "Workers receive your service requirements and can prepare specific consumables before arrival.",
      "Completion photos, service notes, and invoice summary are added to booking history automatically.",
    ],
    faqs: [
      {
        question: "Do you clean inside cabinets too?",
        answer: "External cabinet cleaning is included by default. Internal deep cleaning can be noted as a custom requirement.",
      },
      {
        question: "Are chemicals child-safe?",
        answer: "We use home-safe cleaning solutions and note special sensitivities in the booking requirements.",
      },
    ],
    reviews: [
      { author: "Sneha J.", rating: 4.8, comment: "The requirement form was detailed and the result matched exactly what I requested." },
      { author: "Arjun B.", rating: 4.7, comment: "Notifications were timely and the support team followed up after the visit." },
    ],
  },
  {
    slug: "deep-cleaning",
    name: "Deep Cleaning",
    category: "Cleaning",
    description:
      "A room-to-room deep cleaning service for apartments and villas with sanitization, dust removal, and detailing.",
    startingPrice: 1499,
    duration: "4-6 hrs",
    rating: 4.9,
    reviewsCount: 1575,
    rewardCoins: 60,
    discountCode: "DEEP300",
    locations: ["Bengaluru", "Mumbai", "Pune", "Hyderabad", "Delhi NCR"],
    highlights: ["Team-based cleaning crew", "Move-in and move-out ready", "Detailed checklist shared after service"],
    includes: ["Floors and skirting", "Bathroom sanitization", "Furniture surface detailing"],
    howItWorks: [
      "Select the home size, preferred date, and any access constraints or urgency.",
      "The admin team can assign a multi-worker crew and adjust service windows in real time.",
      "Status, checklists, and post-service notes remain available in your account history.",
    ],
    faqs: [
      {
        question: "Do you cover furnished homes?",
        answer: "Yes. Mention furniture density and occupied rooms so the crew size can be adjusted properly.",
      },
      {
        question: "Can I reschedule after confirmation?",
        answer: "Yes. Reschedule requests are visible to admin and workers immediately through booking updates.",
      },
    ],
    reviews: [
      { author: "Karthik R.", rating: 5, comment: "The analytics and timeline details made the premium pricing feel justified." },
      { author: "Isha T.", rating: 4.9, comment: "Very polished experience from scheduling to invoice generation." },
    ],
  },
  {
    slug: "ac-service",
    name: "AC Service",
    category: "Maintenance",
    description:
      "AC servicing, gas top-up inspections, cooling checks, and preventive maintenance for split and window units.",
    startingPrice: 599,
    duration: "60-120 min",
    rating: 4.8,
    reviewsCount: 1710,
    rewardCoins: 38,
    discountCode: "COOL100",
    locations: ["Bengaluru", "Chennai", "Hyderabad", "Mumbai", "Delhi NCR"],
    highlights: ["Summer priority queue", "Cooling diagnostics", "Indoor and outdoor unit checks"],
    includes: ["Filter cleaning", "Cooling performance check", "Drainage and noise inspection"],
    howItWorks: [
      "Select your unit type and describe cooling, leakage, or noise issues in the service requirements.",
      "Nearby AC specialists receive the request and can accept the assignment in real time.",
      "Every status update is pushed to the user dashboard, worker dashboard, and admin command center.",
    ],
    faqs: [
      {
        question: "Is gas charging included?",
        answer: "Inspection is included. Gas refill is quoted separately after diagnosis if required.",
      },
      {
        question: "Can you service multiple units in one visit?",
        answer: "Yes. Mention the unit count in the notes so the worker can plan time and materials.",
      },
    ],
    reviews: [
      { author: "Rahul G.", rating: 4.8, comment: "The technician handled two units in one booking and the updates stayed perfectly synced." },
      { author: "Priya N.", rating: 4.7, comment: "The technician explained the issue clearly and the whole visit stayed on schedule." },
    ],
  },
  {
    slug: "painting",
    name: "Painting",
    category: "Interiors",
    description:
      "Accent walls, repainting, touch-up jobs, and supervised painting crews for residential and commercial spaces.",
    startingPrice: 2299,
    duration: "1-2 days",
    rating: 4.9,
    reviewsCount: 620,
    rewardCoins: 80,
    discountCode: "PAINT500",
    locations: ["Bengaluru", "Mumbai", "Delhi NCR", "Pune"],
    highlights: ["Site inspection ready", "Color consultation notes", "Crew assignment support"],
    includes: ["Surface prep", "Putty and primer guidance", "Final finish review"],
    howItWorks: [
      "Explain the area size, preferred finish, and whether furniture shifting is needed.",
      "Admin can assign the right crew size and worker lead based on the project scope.",
      "You receive milestone updates, completion notes, and invoice-ready summaries in one workflow.",
    ],
    faqs: [
      {
        question: "Can I get a site estimate first?",
        answer: "Yes. Add it as a requirement, and the worker can mark the booking as inspection-first before final execution.",
      },
      {
        question: "Do you support partial room touch-ups?",
        answer: "Yes. Mention wall count or patch size in the requirement field for a more accurate first quote.",
      },
    ],
    reviews: [
      { author: "Aditi V.", rating: 5, comment: "Crew assignment was smooth, updates were timely, and the final finish looked great." },
      { author: "Mohammed F.", rating: 4.8, comment: "The service detail page explained everything clearly before I booked." },
    ],
  },
].map((service) => ({
  ...service,
  coverImage: SERVICE_MEDIA[service.name]?.cover,
  videoUrl: SERVICE_MEDIA[service.name]?.video,
}));

export const ROLE_MEDIA = {
  auth: {
    title: "Premium home services, coordinated in real time.",
    subtitle:
      "From instant bookings to worker dispatch and admin oversight, every step is built to stay clear, fast, and reliable.",
    video:
      "https://videos.pexels.com/video-files/3129957/3129957-uhd_2560_1440_25fps.mp4",
    poster:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  },
  user: {
    image:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80",
  },
  worker: {
    image:
      "https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&w=1600&q=80",
  },
  admin: {
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80",
  },
};

export function findServiceBlueprint(key) {
  if (!key) return null;

  const loweredKey = String(key).trim().toLowerCase();
  return (
    SERVICE_BLUEPRINTS.find((service) => service.slug === loweredKey) ||
    SERVICE_BLUEPRINTS.find((service) => service.name.toLowerCase() === loweredKey)
  );
}
