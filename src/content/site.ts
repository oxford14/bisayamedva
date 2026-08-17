export const experienceLevels = [
  "Complete Beginner",
  "Aspiring Medical VA",
  "Current VA",
  "BPO Professional",
  "Healthcare Professional",
  "Career Shifter",
  "Other",
] as const;

export const referralSources = [
  "Facebook",
  "TikTok",
  "Google",
  "Messenger",
  "Referral",
  "Organic",
  "Direct",
  "Other",
] as const;

export const site = {
  name: "Bisaya MedVA",
  domain: "bisayamedva.com",
  email: "info@bisayamedva.com",
  url: "https://bisayamedva.com",
  tagline: "Medical Virtual Assistant Training & Career Development",
  seo: {
    title: "Bisaya MedVA | Medical VA Training",
    description:
      "Learn practical Medical Billing skills with Bisaya MedVA and start building your foundation for a Medical Virtual Assistant career.",
  },
  featuredCourse: {
    id: "medical-billing-training",
    name: "Medical Billing Training",
    subtitle: "Medical Billing Fundamentals for Aspiring Medical VAs",
    type: "BASIC" as const,
    price: 200,
    currency: "PHP" as const,
    priceLabel: "One-time training",
  },
  nextSession: {
    id: "mb-weekend-next",
    label: "NEXT WEEKEND TRAINING",
    day: "Saturday",
    dateLabel: "August 16, 2026",
    startTime: "7:00 PM",
    endTime: "9:00 PM",
    timezone: "Asia/Manila",
    timezoneLabel: "PHT",
    format: "Online",
    capacity: 30,
  },
} as const;

export const nav = {
  links: [
    { href: "/#medical-billing", label: "Medical Billing" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#faq", label: "FAQ" },
  ],
  login: { href: "/auth/login", label: "Login" },
  register: { href: "/register", label: "Register" },
} as const;

export const hero = {
  eyebrow: "BISAYA MEDVA",
  headline: "Start Your Medical VA Journey with Medical Billing",
  support:
    "Ganahan ka makasugod sa Medical VA field pero wala pa kay solid foundation? Start with Medical Billing and learn the basics through a practical online training designed for aspiring Medical VAs.",
  primaryCta: { href: "/register", label: "Register" },
  secondaryCta: { href: "/#what-youll-learn", label: "See What You'll Learn" },
  image: {
    src: "/images/hero/HeroImage.png",
    alt: "Professional Bisaya woman sa desk, ready for Medical VA training.",
  },
  portrait: {
    src: "/images/hero/portrait.webp",
    alt: "Close-up of a Bisaya learner preparing for Medical Billing training.",
  },
} as const;

export const trustItems = [
  { title: "Every weekend", body: "Recurring online training. Day and time set by the coach." },
  { title: "Practical foundation", body: "Medical Billing basics from a Medical VA perspective." },
  { title: "Bisaya-English", body: "Natural Cebuano and English. Dili Tagalog. Dili jargon dump." },
  { title: "One-time fee", body: "Pay once for the introductory Medical Billing course." },
] as const;

export const whyBilling = {
  eyebrow: "WHY MEDICAL BILLING?",
  title: "Before the specialties, masabtan nimo ang billing workflow.",
  body: "Before ka mag-deep dive sa different Medical VA specialties, importante nga masabtan nimo ang basic Medical Billing workflow. Billing is how healthcare work becomes payable work. If you understand that foundation, the rest of the Medical VA path becomes clearer.",
  points: [
    {
      title: "How billing fits healthcare operations",
      body: "Patient information, provider details, and documentation all feed the billing process.",
    },
    {
      title: "Why Medical VAs need this foundation",
      body: "Daghang Medical VA roles touch billing even if the job title sounds different.",
    },
    {
      title: "A practical starting point",
      body: "This course introduces the workflow. It does not claim to make you fully job-ready overnight.",
    },
  ],
} as const;

export const curriculum = {
  eyebrow: "WHAT YOU'LL LEARN",
  title: "Medical Billing fundamentals, step by step.",
  intro:
    "The ₱200 course focuses only on Medical Billing. Exact lessons stay with the coach. These are the core ideas you will meet.",
  items: [
    {
      title: "Medical Billing Fundamentals",
      body: "Learn the basic concepts and terminology used in Medical Billing.",
    },
    {
      title: "Billing Workflow",
      body: "Understand how a basic billing workflow operates from start to follow-through.",
    },
    {
      title: "Patient & Provider Information",
      body: "Understand the information involved in a billing process.",
    },
    {
      title: "Medical Billing Terminology",
      body: "Become familiar with common Medical Billing terms used in real work.",
    },
    {
      title: "Revenue Cycle Basics",
      body: "Understand where Medical Billing fits within the healthcare revenue cycle.",
    },
  ],
} as const;

export const notIncluded = {
  eyebrow: "UPSKILL TOPICS",
  title: "Want to go deeper?",
  body: "After Medical Billing, Bisaya MedVA will offer specialized Upskill Topics. Each topic is a separate training offer with its own price, schedule, and enrollment.",
  topics: [
    "Insurance",
    "Eligibility",
    "Verification",
    "Claims",
    "Denial Management",
    "EHR",
  ],
  note: "Prices for future courses stay unpublished until they are finalized.",
} as const;

export const audiences = [
  {
    id: "beginner",
    title: "New to Medical VA",
    body: "Wala pa kay experience sa Medical VA? Okay ra. This training starts with the fundamentals.",
    image: "/images/people/beginner.webp",
    alt: "Young Filipina student with laptop, starting from Medical Billing basics.",
  },
  {
    id: "career-shifter",
    title: "Career Shifters",
    body: "Nag-plan ka ug career shift? Start by building a healthcare-related skill foundation.",
    image: "/images/people/career-shifter.webp",
    alt: "Filipina career shifter studying Medical Billing at the dining table.",
  },
  {
    id: "current-va",
    title: "Current VAs",
    body: "Already working as a VA? Add Medical Billing knowledge to your skill set.",
    image: "/images/people/current-va.webp",
    alt: "Filipino virtual assistant with headset during a training session.",
  },
  {
    id: "bpo",
    title: "BPO Professionals",
    body: "If naa kay customer service or administrative background, this can be a useful starting point for exploring Medical VA work.",
    image: "/images/people/bpo.webp",
    alt: "Filipina professional with customer service background exploring Medical VA work.",
  },
] as const;

export const howItWorks = {
  eyebrow: "HOW IT WORKS",
  title: "Upat ka steps. Klaro ra.",
  steps: [
    {
      n: "01",
      title: "Register",
      body: "Create your Bisaya MedVA account and choose a weekend session.",
    },
    {
      n: "02",
      title: "Pay",
      body: "Complete the one-time Medical Billing payment through PayMongo.",
    },
    {
      n: "03",
      title: "Attend",
      body: "Join the scheduled weekend training online.",
    },
    {
      n: "04",
      title: "Keep learning",
      body: "After the basic course, explore additional Upskill Topics when available.",
    },
  ],
} as const;

export const whyBisaya = {
  eyebrow: "WHY BISAYA MEDVA?",
  title: "Local in identity. Global in ambition.",
  items: [
    {
      title: "Bisaya identity",
      body: "Training that sounds like home. We teach in Bisaya-English because that is how many of us actually think and work.",
    },
    {
      title: "Practical skills",
      body: "The first product is Medical Billing, not a giant LMS. You start with a real, usable foundation.",
    },
    {
      title: "Accessible entry",
      body: "A low-cost introductory course so more aspiring Medical VAs can begin without a heavy first payment.",
    },
    {
      title: "Career path, not a hospital brand",
      body: "We are a training and career-development platform. Dili staffing agency. Dili healthcare provider.",
    },
  ],
} as const;

export const faqs = [
  {
    q: `Unsa gyud ang ₱${site.featuredCourse.price} course?`,
    a: `${site.featuredCourse.name}. An introductory, one-time course on Medical Billing fundamentals for aspiring Medical VAs. It is not a full Medical VA program and it does not automatically include Upskill Topics.`,
  },
  {
    q: "Kanus-a ang training?",
    a: "Every weekend. The exact day and time can change, so the next open session is shown on this page. Timezone is Asia/Manila.",
  },
  {
    q: "Naa ba Insurance, Claims, or EHR sa ₱200?",
    a: "Wala. Insurance, Eligibility, Verification, Claims, Denial Management, and EHR are separate Upskill Topics. Each will have its own price and enrollment when it launches.",
  },
  {
    q: "Unsa nga language ang gamiton?",
    a: "Bisaya-English. Natural Cebuano mixed with English. Technical terms like Medical Billing stay in English. Dili Tagalog.",
  },
  {
    q: "Online ba ni?",
    a: "Yes. Weekend training is online. The meeting link is shared before the session.",
  },
  {
    q: "Maka-job ready ba ko after ₱200?",
    a: "This course builds a foundation. It does not claim to make you fully job-ready by itself. After Medical Billing, you can continue into specialized Upskill Topics.",
  },
  {
    q: "Unsaon pagbayad?",
    a: "Payment is ₱200 through PayMongo after you create your account and select a weekend session.",
  },
] as const;

export const finalCta = {
  title: "Ready na ka mo-start?",
  body: "Reserve a weekend slot, pay once, and learn Medical Billing with Bisaya MedVA.",
  cta: { href: "/register", label: "Register" },
} as const;

export const authCopy = {
  shell: {
    welcome: "Maayong adlaw!",
    support: "Enter your details to continue sa imong Bisaya MedVA account.",
    tagline:
      "Medical Billing training for aspiring Medical VAs — klaro, practical, Bisaya-English.",
  },
  login: {
    eyebrow: "WELCOME BACK",
    title: "Login to Bisaya MedVA",
    body: "Maayong pag-abot. Open your student account to see your training details.",
    submit: "Log In",
    noAccount: "Wala pa kay account?",
    register: "Register",
    forgot: "Forgot password?",
  },
  forgot: {
    eyebrow: "PASSWORD",
    title: "Reset your password",
    body: "Enter the email you used to register. We will send reset instructions when email is connected.",
    submit: "Send reset link",
    sent: "Check your inbox. If that email is on file, a reset link will arrive when email delivery is live.",
  },
  register: {
    eyebrow: "MEDICAL BILLING TRAINING",
    title: "Create your Bisaya MedVA account",
    body: "Dili kinahanglan nga expert ka daan. Fill this in, choose a weekend session, then continue to payment.",
    stepAccount: "Your details",
    stepSession: "Weekend session",
    stepSummary: "Order summary",
    submitAccount: "Continue to session",
    submitSession: "Review order",
    submitPayment: "Proceed to payment",
  },
  checkout: {
    eyebrow: "PAYMONGO",
    title: "Scan to pay with QR Ph",
    body: "I-scan ang live QR gamit ang imong bank or e-wallet app. For testing, you can also use Simulate Payment without scanning.",
    back: "Back to registration",
    home: "Back to home",
    simulate: "Simulate Payment",
    refresh: "Check payment status",
    download: "Download QR",
    retry: "Retry QR",
    missingTitle: "Complete registration first",
    missingDraft:
      "Wala mi nakit-an nga registration details for this browser. Balik sa register, finish the steps, then click Proceed to payment.",
    preparing: "Preparing your PayMongo QR…",
    paid: "Nabayran na. Redirecting to your training dashboard…",
    expiry: "This QR Ph code expires in about 30 minutes if unused.",
  },
} as const;

export const images = {
  weekend: {
    src: "/images/hero/weekend-wide.webp",
    alt: "Student sa weekend online Medical Billing training with Bisaya MedVA.",
  },
  cta: {
    src: "/images/hero/cta.webp",
    alt: "Aspiring Medical VA ready to register for weekend training.",
  },
  auth: {
    character: {
      src: "/images/auth/medva-character.png",
      alt: "Friendly Medical VA character ready to help you login.",
    },
    wave: {
      src: "/images/auth/auth-wave-bg.png",
      alt: "",
    },
  },
  texture: "/images/brand/texture-linen.webp",
  og: "/images/og/share.jpg",
} as const;
