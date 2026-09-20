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
      "Learn practical Medical VA skills with Bisaya MedVA and start building your foundation for a Medical Virtual Assistant career.",
  },
  featuredCourse: {
    id: "medical-va-masterclass",
    name: "Medical VA Masterclass",
    subtitle: "Front desk, workflow, and Medical VA fundamentals",
    type: "BASIC" as const,
    price: 499,
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
  admin: {
    /** Paid revenue on the admin dashboard counts from this PHT date (inclusive). */
    revenueCountStartLocal: "2026-09-09T00:00",
  },
} as const;

export const nav = {
  links: [
    { href: "/#medical-billing", label: "Medical Billing" },
    { href: "/#meet-trainer", label: "Trainer" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#faq", label: "FAQ" },
  ],
  login: { href: "/auth/login", label: "Login" },
  register: { href: "/register", label: "Register" },
} as const;

export const hero = {
  eyebrow: "BISAYA MEDVA",
  headline: "Start Your Medical VA Journey",
  support:
    "Ganahan ka makasugod sa Medical VA field pero wala pa kay solid foundation? Start with the Medical VA Masterclass — front desk, workflow, and the basics through a practical online training designed for aspiring Medical VAs.",
  primaryCta: { href: "/register", label: "Register" },
  secondaryCta: { href: "/#what-youll-learn", label: "See What You'll Learn" },
  image: {
    src: "/images/hero/HeroImage.png",
    alt: "Professional Bisaya woman sa desk, ready for Medical VA training.",
  },
  portrait: {
    src: "/images/hero/why-billing-portrait.png",
    alt: "Friendly Bisaya learner with glasses, ready for Medical Billing training.",
  },
} as const;

export const trustItems = [
  { title: "Every weekend", body: "Recurring online training. Day and time set by the coach." },
  { title: "Practical foundation", body: "Front desk and workflow basics from a Medical VA perspective." },
  { title: "Bisaya-English", body: "Natural Cebuano and English. Dili Tagalog. Dili jargon dump." },
  { title: "One-time fee", body: "Pay once for the introductory Medical VA Masterclass." },
] as const;

export const whyBilling = {
  eyebrow: "WHAT COMES AFTER",
  title: "Medical Billing and Upskill Topics open later.",
  body: "The course you enroll in now is the Medical VA Masterclass. Medical Billing Masterclass and the Upskill Topics (Insurance Verification, Claims, Denials) stay as later enrollments — dili apil sa first payment.",
  points: [
    {
      title: "Start with Medical VA work",
      body: "Front desk, intake, and daily workflow first so you have a usable foundation.",
    },
    {
      title: "Medical Billing comes next",
      body: "Billing is how healthcare work becomes payable work. We will open that Masterclass separately.",
    },
    {
      title: "A practical starting point",
      body: "This first course introduces the workflow. It does not claim to make you fully job-ready overnight.",
    },
  ],
} as const;

export const curriculum = {
  eyebrow: "WHAT YOU'LL LEARN",
  title: "Medical VA fundamentals, step by step.",
  intro:
    `The ₱${site.featuredCourse.price} ${site.featuredCourse.name} focuses on front desk, workflow, and day-to-day Medical VA work. Exact lessons stay with the coach. These are the core ideas you will meet.`,
  items: [
    {
      title: "Medical VA Fundamentals",
      body: "Learn how a Medical VA supports a clinic — intake, scheduling, and daily coordination.",
    },
    {
      title: "Front Desk Workflow",
      body: "Understand the flow from patient contact to the next handoff, step by step.",
    },
    {
      title: "Patient & Clinic Information",
      body: "Practice handling the details a Medical VA checks every day.",
    },
    {
      title: "Medical Terminology",
      body: "Become familiar with common terms used in real clinic and billing work.",
    },
    {
      title: "Where Billing Fits Later",
      body: "See how Medical Billing and Upskill Topics connect after this foundation. Separate enrollments, coming next.",
    },
  ],
} as const;

export const platformFeatures = {
  eyebrow: "INSIDE YOUR STUDENT ACCOUNT",
  title: "Practice, call handling, and verified certificates.",
  intro:
    "After you enroll, naa kay interactive tools sa member area — simulation lang, fake patients only, para ma-practice nimo ang Medical VA workflow before real clinic work.",
  enrollmentNote: "Available after enrollment and course access.",
  cta: { href: "/register", label: "Register to unlock" },
  items: [
    {
      id: "practiceLab",
      title: "Interactive Practice Lab",
      body:
        "Run front-desk drills sa imong browser — patient registration and scheduling workflows with demo data only.",
      bullets: [
        "US-style intake fields — demographics, Insurance, emergency contact",
        "Scheduling grid — providers, visit types, and appointment status",
        "Data stays sa imong device; cleared on logout",
      ],
      image: {
        src: "/images/marketing/feature-practice-lab.svg",
        alt: "Practice Lab hub showing patient registration and scheduling simulation tiles.",
      },
    },
    {
      id: "mockCall",
      title: "Mock Call",
      body:
        "Practice professional phone handling — learn the Medical VA call flow, then run guided scenarios with simulated caller lines.",
      bullets: [
        "Eight-step flow — opening to closing with example scripts",
        "Learn tab una, then Practice with mic-friendly drills",
        "Simulation only — no real Patient PHI",
      ],
      image: {
        src: "/images/marketing/feature-mock-call.svg",
        alt: "Mock Call practice screen with phone handling and call-flow steps.",
      },
    },
    {
      id: "certificateVerify",
      title: "Certificate authentication",
      body:
        "When you finish the course, makakuha ka og certificate of completion with a QR code employers or clients can scan to verify.",
      bullets: [
        "Unique certificate ID on every completion",
        "Public verify page confirms Bisaya MedVA issued it",
        "Helps show proof without edited screenshots",
      ],
      image: {
        src: "/images/marketing/feature-certificate-verify.svg",
        alt: "Course certificate with QR code and authentic verification check screen.",
      },
    },
  ],
} as const;

export const portfolioCopy = {
  pageTitle: "Portfolio Builder",
  pageDescription:
    "Build imong Medical VA portfolio — drag blocks, add photos, then share a public link when ready.",
  gateTitle: "Portfolio Builder is for enrolled students",
  gateBody:
    "Enroll sa usa ka session una para ma-create nimo ang imong portfolio ug public link.",
  gateCta: "Browse courses",
  templateIntro:
    "Pick a starter layout. You can edit everything after — drag to reorder, add blocks, or reset from another template.",
  useTemplate: "Use this template",
  addBlock: "Add block",
  urlSlug: "Public URL slug",
  publicToggle: "Show portfolio publicly",
  privateNote: "Private ra for now — turn on Public when ready to share.",
  preview: "Preview",
  copyLink: "Copy link",
  saving: "Saving…",
  saved: "Saved",
  saveError: "Could not save — check your connection.",
  unsaved: "Editing…",
  resetTemplate: "Reset from template",
  resetConfirm:
    "This replaces all blocks with the template defaults. Continue?",
  deleteBlockConfirm: "Remove this block?",
  dividerHint: "Visual spacer between sections.",
  canvasHint: "Tap a section to select · double-click or Edit to open settings · drag the handle to reorder.",
  canvasEmpty: "Add blocks from the sidebar (or Add on mobile) to start your layout.",
  dragHint: "Drag to reorder",
  editBlock: "Edit block",
  canvasUploadHint: "Tap Edit to upload",
  imageOptimizing: "Optimizing photo…",
  canvasNamePlaceholder: "Your name",
  canvasHeadlinePlaceholder: "Medical VA · your headline",
  canvasAboutPlaceholder: "Write a short intro employers can scan fast.",
  canvasEditSkillsHint: "Open Edit to add skill tags",
  canvasEditListHint: "Open Edit to add experience or certificates",
  canvasEditLinksHint: "Open Edit to add contact links",
  canvasImageEmpty: "Image block",
  mobileToolbarLabel: "Portfolio editor tools",
  mobileAdd: "Add",
  mobileEdit: "Edit",
  mobilePublic: "Public",
  mobileMore: "More",
  backToHome: "Back to Home",
  mobileHome: "Home",
} as const;

export const notIncluded = {
  eyebrow: "UPSKILL TOPICS",
  title: "Want to go deeper?",
  body: "After the Medical VA Masterclass, you can continue into Medical Billing and specialized Upskill Topics when they open. Each later course is a separate enrollment.",
  note: "Upskill courses are available inside your student account after you register.",
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
    image: "/images/people/career-shifter-2.webp",
    alt: "Young Filipina career shifter studying at the dining table with a laptop.",
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

export const trainer = {
  eyebrow: "MEET YOUR TRAINER",
  title: "Learn from someone who started from the bottom.",
  name: "Joy Manongsong",
  nickname: "Jhoie",
  role: "Medical VA Coach · Bisaya MedVA",
  yearsLabel: "8 years as a Medical Virtual Assistant",
  greeting: "Hi, I'm Jhoie.",
  body: [
    "I've been working as a Medical Virtual Assistant for 8 years and counting. My journey did not begin at the top — I started from the bottom, learning workflows, making mistakes, asking questions, and gradually gaining experience across different clients and systems.",
    "Through Bisaya MedVA, I teach how the work actually happens in a real workplace: the basics, the habits, the communication with clients, the mistakes to avoid, and what to do when you are stuck. Dili theory dump — practical lessons I wish someone had taught me when I was starting.",
  ],
  closing:
    "My goal is not to make you memorize hundreds of definitions. I want you to feel more confident when you enter a real Medical VA workplace — and to know how to approach the work even when you don't know everything yet.",
  philosophy: [
    { title: "Ask", body: "Don't assume. Clients appreciate clear questions." },
    { title: "Listen", body: "Understand before you respond." },
    { title: "Communicate", body: "Conversational, clear, and professional." },
    { title: "Take notes", body: "Don't rely on memory alone." },
    { title: "Follow the workflow", body: "Every client and practice may work differently." },
    { title: "Know your limits", body: "Don't guess when something is outside your role." },
    { title: "Work smarter", body: "Build habits that prevent mistakes." },
  ],
  image: {
    src: "/images/people/trainer-jhoie.webp",
    alt: "Joy Manongsong, Medical VA coach at Bisaya MedVA.",
  },
  cta: { href: "/register", label: "Train with Jhoie" },
} as const;

export const howItWorks = {
  eyebrow: "HOW IT WORKS",
  title: "Upat ka steps. Klaro ra.",
  steps: [
    {
      n: "01",
      title: "Register",
      body: "Create your Bisaya MedVA account and enroll in the Featured Course.",
    },
    {
      n: "02",
      title: "Pay",
      body: `Complete the one-time ₱${site.featuredCourse.price} ${site.featuredCourse.name} payment through PayMongo.`,
    },
    {
      n: "03",
      title: "Attend",
      body: "After you pay, pick a weekend session sa student Schedule — wala na'y extra bayad — then join the online training.",
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
      body: "The first product is the Medical VA Masterclass, not a giant LMS. You start with a real, usable foundation. Medical Billing and Upskill Topics come after.",
    },
    {
      title: "Accessible entry",
      body: "Foundation Masterclasses at a clear one-time price so more aspiring Medical VAs can begin without a heavy first payment.",
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
    a: `${site.featuredCourse.name}. An introductory, one-time course on front desk, workflow, and Medical VA fundamentals. It does not automatically include Medical Billing or Upskill Topics — those are separate, later enrollments.`,
  },
  {
    q: "Kanus-a ang training?",
    a: "Every weekend. The exact day and time can change, so the next open session is shown on this page. Timezone is Asia/Manila.",
  },
  {
    q: `Naa ba Insurance Verification, Claims, or Denials sa ₱${site.featuredCourse.price} ${site.featuredCourse.name}?`,
    a: "Wala. Insurance Verification, Claims, and Denials — and Medical Billing Masterclass — are separate later courses, each with its own enrollment inside your student account.",
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
    q: `Maka-job ready ba ko after ₱${site.featuredCourse.price}?`,
    a: "This course builds a foundation. It does not claim to make you fully job-ready by itself. After the Medical VA Masterclass, you can continue into Medical Billing and specialized Upskill Topics when they open.",
  },
  {
    q: "Unsaon pagbayad?",
    a: `Payment is ₱${site.featuredCourse.price} through PayMongo after you create your account. Pick your weekend session after payment sa student Schedule.`,
  },
] as const;

export const finalCta = {
  title: "Ready na ka mo-start?",
  body: "Enroll in the Featured Course, pay once, then pick your weekend session sa student app.",
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
    forgot: "Nakalimot sa password?",
    resetSuccess:
      "Password updated na. Log in gamit ang imong bag-ong password.",
  },
  forgot: {
    eyebrow: "PASSWORD",
    title: "Reset your password",
    body: "Ibutang ang email nga gigamit nimo sa register. Padala mi og reset link sa imong inbox.",
    submit: "Send reset link",
    sent: "Check your inbox. Kung naa ni nga email sa among records, makadawat ka og reset link within a few minutes.",
    invalidLink:
      "Expired na or invalid ang link. Request og bag-ong reset link below.",
  },
  resetPassword: {
    eyebrow: "NEW PASSWORD",
    title: "Set your new password",
    body: "Pick a strong password (at least 8 characters). After this, log in with your new password.",
    submit: "Save new password",
  },
  register: {
    eyebrow: "MEDICAL BILLING TRAINING",
    title: "Create your Bisaya MedVA account",
    body: "Dili kinahanglan nga expert ka daan. Fill this in, review the Featured Course, then continue to payment. After you pay, pick your weekend session sa student Schedule.",
    stepAccount: "Your details",
    stepSession: "Featured Course",
    stepSummary: "Order summary",
    submitAccount: "Continue to course",
    submitSession: "Review order",
    featuredLead: "Kini ang course nga imong i-enroll.",
    featuredAfterPay:
      "After payment, you can pick a weekend session sa Schedule. Wala na'y extra bayad.",
    submitPayment: "Proceed to payment",
    checkingEmail: "Checking email…",
    emailTaken:
      "Naa na ni nga email. Login to continue — dili ka maka-enroll gamit ang same email.",
    refCode: "Referral code (optional)",
    refCodeLocked: "Gi-lock ni. You opened a referral link.",
  },
  checkout: {
    eyebrow: "PAYMONGO",
    title: "Scan to pay with QR Ph",
    body: "I-scan ang live QR gamit ang imong bank or e-wallet app. After a successful pay, we confirm automatically and open your training dashboard.",
    back: "Back to registration",
    home: "Back to home",
    refresh: "Check payment status",
    download: "Download QR",
    retry: "Retry QR",
    missingTitle: "Complete registration first",
    missingDraft:
      "Wala mi nakit-an nga registration details for this browser. Balik sa register, finish the steps, then click Proceed to payment.",
    preparing: "Preparing your PayMongo QR…",
    paid: "Nabayran na. Redirecting to your training dashboard…",
    expiry: "This QR holds your seat for 10 minutes. After that, the seat goes back if wala pa bayad.",
    expired:
      "Napasagdan ang 10-minute hold. Retry para mag-reserve og new seat.",
  },
} as const;

export const referCopy = {
  nav: "Refer a Friend",
  title: "Refer a Friend",
  description:
    "Share your link. When a friend registers through it and enrolls sa course, you earn referral commission — credited to your Wallet.",
  codeLabel: "Your referral code",
  linkLabel: "Your referral link",
  copyLink: "Copy link",
  copied: "Copied",
  friends: "Referred friends",
  earnings: "Referral earnings",
  enrolled: "Enrolled courses",
  listTitle: "Direct referrals",
  emptyTitle: "Wala pa kay referred friends",
  emptyBody:
    "Share your Bisaya MedVA link. Commission mo-credit when they enroll and pay.",
  friend: "Friend",
  course: "Course",
  commission: "Commission",
  date: "Date",
  friendCourses: "Enrolled courses",
  noFriendCourses: "Wala pa enrolled course.",
} as const;

export const memberCheckoutCopy = {
  eyebrow: "Review enrollment",
  body: "Check your schedule and add a promo if you have one. Bayad via Wallet lang — if kulang ang balance, top up sa Wallet first, then balik dinhi.",
  walletNow: "Wallet now",
  proceed: "Proceed",
  proceeding: "Preparing…",
  openWallet: "Top up Wallet",
  backSchedule: "Back to Schedule",
  insufficientTitle: "Kulang ang wallet balance",
  insufficientBody:
    "Need {total} for this enrollment. Imong balance: {balance}. Top up at least {shortfall} sa Wallet, then click Proceed again.",
  insufficientHint:
    "Generate PayMongo QR sa Wallet page only — dili dinhi sa checkout.",
  lowBalanceWarning:
    "Kulang pa ang wallet para sa total. Top up sa Wallet before you proceed.",
  enrolledRedirect: "Nabayran via wallet. Redirecting…",
  enrolledActive: "Active na imong seat. Redirecting…",
} as const;

export const walletCopy = {
  button: "Top up",
  title: "Top up wallet",
  body: "Enter an amount, generate a QR Ph, then i-scan gamit ang imong bank or e-wallet app.",
  generate: "Generate QR Ph",
  generating: "Generating…",
  amountLabel: "Amount (PHP)",
  close: "Close",
  emptyActivity: "Tap Top up to add funds, or enroll after you add balance.",
  confirmed: "Top-up confirmed. Updating wallet…",
  confirmedShort: "Top-up confirmed.",
  minAmount: "Minimum top-up is ₱20 (PayMongo QR Ph).",
} as const;

export const withdrawCopy = {
  button: "Withdraw",
  title: "Request withdrawal",
  body: "I-request ang cash-out from your wallet. Admin will review, then send the payout to your GCash, Maya, or bank.",
  amountLabel: "Amount (PHP)",
  methodLabel: "Payout method",
  accountName: "Account name",
  accountNumber: "Account number / mobile",
  bankName: "Bank name",
  submit: "Send request",
  submitting: "Sending…",
  close: "Close",
  minAmount: "Minimum withdrawal is ₱200.",
  insufficient: "Kulang imong wallet balance for this amount.",
  profileSection: "Withdrawal",
  profileSectionBody:
    "Save your payout number and a 6-digit PIN. You still enter payout details when you withdraw, plus this PIN.",
  profileNumber: "Withdrawal number",
  profilePin: "Withdrawal PIN",
  profilePinConfirm: "Confirm PIN",
  profilePinCurrent: "Current PIN",
  profilePinSet: "PIN is set. Enter your current PIN to change it.",
  profilePinHint: "6 digits. I-enter ni nimo when you request a withdrawal.",
  profileSave: "Save withdrawal settings",
  profileSaving: "Saving…",
  profileSaved: "Saved. Updated na ang imong withdrawal details.",
  pinLabel: "Withdrawal PIN",
  pinRequired: "Set your withdrawal PIN on Profile first.",
  pinWrong: "Incorrect withdrawal PIN.",
  pinInvalid: "PIN must be 6 digits.",
  pinMismatch: "New PIN and confirm PIN do not match.",
  pendingOne: "Naa na kay pending withdrawal. Wait for admin review, or cancel it first.",
  pendingTitle: "Pending withdrawal",
  pendingBody:
    "Gihuwat na ang admin review. This amount is on hold sa imong wallet.",
  cancel: "Cancel request",
  cancelling: "Cancelling…",
  listTitle: "Withdrawal requests",
  emptyList: "Wala pa kay withdrawal request.",
  gcash: "GCash",
  maya: "Maya",
  bank: "Bank transfer",
  sent: "Request sent. Admin will review your withdrawal.",
} as const;

export const scheduleCopy = {
  title: "Schedule",
  description:
    "Pick a weekend session for a course you already paid. Wala na'y extra bayad.",
  chooseSession: "Choose this session",
  switchSession: "Switch to this date",
  choosing: "Saving…",
  pickTitle: "Pick your weekend session",
  pickBody: "Choose a date for your paid course.",
  currentSessionLabel: "Your session",
  reenrollBadge: "New cohort",
  reenrollBody:
    "Na-start na imong previous session. Enroll and pay again para maka-join sa ni nga date.",
  reenrollButton: "Enroll · {price}",
  seatedBody:
    "Ni nga date imong assigned weekend session. Pili og laing open date kung gusto mo mo-switch.",
  emptyTitle: "Wala pa’y open schedule",
  emptyPaidTitle: "Wala pa kay paid course nga need og schedule",
  emptyPaidBody:
    "Enroll and pay a course first. After payment, open dates for that course mo-gawas diri.",
  emptyBody:
    "Check back later when admin opens the next weekend training date.",
  meetingOpenLink: "Open meeting",
  meetingOpenDialogTitle: "Before you join",
  meetingOpenDialogBody:
    "Sa Zoom, gamita ang registered name nimo aron ma-confirm sa admin nga naka-enroll ka.",
  meetingOpenConfirm: "Okay",
  meetingOpenCancel: "Cancel",
} as const;

export const inboxCopy = {
  bellLabel: "Notifications and announcements",
  tabNotifications: "Notifications",
  tabAnnouncements: "Announcements",
  markRead: "Mark read",
  notificationsEmpty:
    "Wala pa kay notifications. Check the bell later for updates from the team or Lounge activity.",
  announcementsEmpty:
    "Wala pa’y announcements. Mo-gawas diri kung naay update gikan sa admin.",
  announcementLabel: "Announcement",
  dialogClose: "Close",
  homeUpdatesTitle: "Updates",
  homeUpdatesHint:
    "Para sa full list, open ang bell sa taas — Notifications ug Announcements.",
  homeUpdatesEmpty: "Wala pa’y bag-ong announcement.",
  newBadge: "New",
} as const;

/** Set true when client PDF certificate generation is ready for students. */
export const certificatesEnabled = false;

/** When certificatesEnabled is false, only these emails may generate/view PDF certificates. */
export const certificateGenerationAllowlistEmails = [
  "neilandrewfuerzas@gmail.com",
] as const;

export const certificatesCopy = {
  nav: "Certificates",
  title: "Certificates",
  description:
    "Diri nimo makita ang certificates for courses you already finished — all modules complete.",
  view: "View certificate",
  print: "Download PDF",
  savingPdf: "Saving PDF…",
  pdfError: "Dili ma-download ang PDF. Try again.",
  back: "All certificates",
  emptyTitle: "Wala pa kay certificate",
  emptyBody:
    "Finish every lesson and pass the quizzes in a course. Your certificate mo-gawas diri after the last item.",
  emptyCta: "Open modules",
  issued: "Issued by Bisaya MedVA",
  certifies: "This certifies that",
  completed: "has completed",
  completedLead: "has successfully completed the",
  certificateProgramLine: "Medical VA Masterclass",
  certificateBody:
    "demonstrating foundational knowledge in the U.S. medical office environment, communication and documentation standards, front desk patient management, basic EHR and practice software concepts, daily Medical VA front desk workflow, and HIPAA essentials for Medical VAs.",
  certificateBodyBySlug: {
    "medical-va-masterclass":
      "demonstrating foundational knowledge in the U.S. medical office environment, communication and documentation standards, front desk patient management, basic EHR and practice software concepts, daily Medical VA front desk workflow, and HIPAA essentials for Medical VAs.",
  },
  signatureImageSrc: "/images/brand/certificate-signature-joy.png",
  dateLabel: "Date completed",
  idLabel: "Certificate ID",
  signatoryName: trainer.name,
  signatoryTitle: "Medical VA Coach",
  scanPrompt: "Scan this code to verify this certificate is authentic.",
  scanPromptShort: "Scan to verify",
  scanNote:
    "This check confirms Bisaya MedVA issued it, not an edited copy.",
  authenticating: "Authenticating Certificate",
  authenticTitle: "Certificate is authentic",
  authenticBody:
    "This page is for clients to confirm Bisaya MedVA issued this certificate.",
  unverifiedTitle: "This certificate could not be verified",
  unverifiedBody:
    "We could not confirm this certificate was issued by Bisaya MedVA.",
  unavailableTitle: "Certificate generation is currently unavailable",
  unavailableBody:
    "Naka-pass na ka sa last quiz. Imong certificate dili pa ma-generate for now — i-release namo ni later.",
  verifyTestLead:
    "PDF generation off pa, pero pwede nimo i-test ang public verify link:",
  verifyTestOpen: "Open verify page",
  verifyPortfolioLead:
    "Gusto nimo tan-awon ang ilang Medical VA portfolio? Open lang ang public link below.",
  verifyPortfolioCta: "View student portfolio",
  verifyHipaaApprovedLead:
    "External HIPAA certificate — approved na sa Bisaya MedVA admin review.",
  verifyHipaaViewCta: "View HIPAA certificate",
  verifyHipaaViewError:
    "Dili namo ma-open ang HIPAA certificate right now. Try again later.",
  hipaaBlockedTitle: "HIPAA certificate review pending",
  hipaaBlockedBody:
    "Finish external HIPAA training, upload your certificate, then wait for admin approval before you generate your BisayaMedVA course certificate.",
  hipaaBlockedUploadCta: "Go to HIPAA upload",
  hipaaBlockedPendingBody:
    "Under review na ang imong HIPAA certificate. Mo-notify mi when approved — you can keep studying other modules.",
} as const;

export const hipaaCopy = {
  outlineModuleTitle: "External HIPAA certificate",
  stepTitle: "External HIPAA certificate",
  stepLead:
    "Dili mi mo-issue ug HIPAA certificate — complete ang free training sa partner site, then upload ang imong certificate diri for admin review.",
  openTraining: "Open HIPAA training",
  iframeHint:
    "Ang embed sometimes dili mo-scroll sa Module 1 — use Module 1 sa new tab for training. If blank ang frame, open directly:",
  openModule1Link: "HIPAA Module 1 (new tab)",
  uploadLabel: "Upload your HIPAA certificate",
  uploadHint: "PDF or clear photo (JPG, PNG, WebP). Max 10MB.",
  uploadCta: "Upload certificate",
  optimizing: "Optimizing photo…",
  uploading: "Uploading…",
  uploadStorageError:
    "Upload storage wala pa ready — contact support or try again later. (Admin: apply HIPAA migration sa Supabase.)",
  uploadSuccess: "Uploaded — under admin review na.",
  viewUpload: "View your upload",
  viewerTitle: "HIPAA certificate",
  viewerLoading: "Loading file…",
  viewerClose: "Close",
  viewerZoomIn: "Zoom in",
  viewerZoomOut: "Zoom out",
  viewerResetZoom: "Reset",
  viewerReplace: "Replace file",
  viewerDelete: "Delete upload",
  viewerDeleting: "Deleting…",
  viewerDeleteConfirm:
    "Delete ang imong upload? Pwede ka mag-upload og bag-o after.",
  pendingTitle: "Under admin review",
  pendingBody:
    "Salamat — naa na ang imong file. Continue sa other modules while we verify.",
  approvedTitle: "HIPAA certificate approved",
  approvedBody:
    "Approved na — pwede na nimo i-generate ang BisayaMedVA course certificate when you finish all modules.",
  rejectedTitle: "Please upload again",
  nextItem: "Continue course",
  adminNav: "HIPAA reviews",
  adminTitle: "HIPAA certificate reviews",
  adminDescription:
    "Review external HIPAA certificates uploaded by Medical VA Masterclass students. Staff can test without enrolling — upload from Member → Medical VA Masterclass → External HIPAA certificate.",
  adminEmpty: "No HIPAA uploads yet.",
  adminLoadErrorTitle: "Could not load HIPAA reviews",
  adminLoadErrorBody:
    "Something went wrong loading submissions. Check server logs or try again later.",
  adminStaffPreviewBadge: "Staff preview (not enrolled)",
  adminViewFile: "View file",
  adminApprove: "Approve",
  adminReject: "Reject",
  adminReviewNotePlaceholder: "Note to student (optional)",
} as const;

export const practiceCopy = {
  nav: "Practice Lab",
  hubTitle: "Practice Lab",
  hubDescription:
    "Interactive Medical VA drills — client-side lang ni, wala sa database. Use fake patients only.",
  disclaimer:
    "Simulation only. Do not enter real Patient PHI. Data stays sa imong browser (IndexedDB) and clears when you log out.",
  hubSimulationsLabel: "Simulations",
  registrationTitle: "Patient registration",
  registrationDescription:
    "Practice US-style intake: demographics, address, emergency contact, and primary Insurance fields.",
  registrationCta: "Open registration sim",
  schedulingTitle: "Patient scheduling",
  schedulingDescription:
    "Book fake appointments for registered patients — provider, visit type, date/time, and status. Simulation only; wala real scheduling rules.",
  schedulingCta: "Open scheduling sim",
  schedulingSimNote:
    "No real provider availability rules — practice lang sa front-desk workflow.",
  schedulingSearchPlaceholder: "Search patient or provider…",
  schedulingNew: "Book appointment",
  schedulingSelect: "Select an appointment or book new.",
  schedulingEmptyList: "No appointments yet.",
  schedulingNoPatients:
    "Mark at least one patient as registered sa registration sim una.",
  schedulingSave: "Save appointment",
  schedulingDeleteConfirm: "Delete this practice appointment?",
  schedulingPatient: "Patient",
  schedulingProvider: "Provider",
  schedulingVisitType: "Visit type",
  schedulingLocation: "Location",
  schedulingDateTime: "Date and time",
  schedulingDuration: "Duration (minutes)",
  schedulingReason: "Reason for visit",
  schedulingStatus: "Status",
  schedulingNotes: "Notes",
  schedulingStatusScheduled: "Scheduled",
  schedulingStatusCheckedIn: "Checked in",
  schedulingStatusCompleted: "Completed",
  schedulingStatusCancelled: "Cancelled",
  schedulingStatusNoShow: "No show",
  schedulingToday: "Today",
  schedulingWeek: "Week",
  schedulingDay: "Day",
  schedulingWeekLabel: "Week",
  schedulingPractitioner: "Practitioner",
  schedulingAllProviders: "All providers",
  schedulingBookAppointment: "Book appointment",
  schedulingEditAppointment: "Edit appointment",
  schedulingNewBlock: "Time block",
  schedulingKindAppointment: "Patient appointment",
  schedulingKindBlock: "Note / time block",
  schedulingEmptyGrid: "Click a time slot to book — simulation only.",
  schedulingLegendTitle: "Legend",
  schedulingLegendNew: "New",
  schedulingLegendNewHint:
    "Scheduled sa system — patient confirmation simulated lang.",
  schedulingLegendRequested: "Requested",
  schedulingLegendRequestedHint:
    "Patient-side request simulated — confirm sa front desk.",
  schedulingLegendConfirmed: "Confirmed",
  schedulingLegendConfirmedHint: "Visit complete or confirmed sa both sides.",
  schedulingLegendBlock: "Note / block",
  schedulingLegendBlockHint:
    "Blocked time — dili patient visit (e.g. admin note).",
  resetData: "Reset practice data",
  resetConfirm:
    "I-reset ang tanan demo patients ug appointments sa ni nga browser? Dili ni ma-undo.",
  gateTitle: "Practice Lab is for enrolled students",
  gateBody:
    "Enroll and activate sa course una para ma-open ang practice simulations.",
  gateCta: "Browse courses",
  gatePreviewTitle: "Practice Lab — preview mode",
  gatePreviewBody:
    "Practice Lab is for enrolled students ug SUPER_ADMIN staff preview. Sign in with a student account para ma-open.",
  gatePreviewCta: "Back to home",
  searchPlaceholder: "Search by last name…",
  newPatient: "New patient",
  saveDraft: "Save draft",
  markRegistered: "Mark registered",
  deletePatient: "Delete patient",
  deleteConfirm: "Delete this practice patient record?",
  draftBadge: "Draft",
  registeredBadge: "Registered",
  selectPatient: "Select a patient or create new.",
  storageNote: "Saved locally sa imong browser while logged in.",
  sectionDemographics: "Demographics",
  sectionContact: "Contact",
  sectionAddress: "US address",
  sectionEmergency: "Emergency contact",
  sectionInsurance: "Primary insurance",
  sectionNotes: "Notes",
  mockCallSimulationDialogTitle: "Simulation reminder",
  mockCallSimulationDialogBody:
    "Simulation only. Do not enter real Patient PHI. Practice data is stored locally in your browser and is cleared when you log out.",
  mockCallSimulationDialogOk: "OK",
  mockCallTitle: "Mock Call",
  mockCallDescription:
    "Practice Medical VA phone handling — learn the call flow, then run guided scenarios with AI caller lines (simulation only).",
  mockCallTabLearn: "Learn flow",
  mockCallTabPractice: "Practice",
  mockCallTabHistory: "History",
  mockCallWelcomeTitle: "Welcome to Mock Call",
  mockCallWelcomeLead:
    "Simulation lang ni — practice professional phone handling for Medical VA work without real Patient PHI.",
  mockCallWelcomeBullet1:
    "Eight-step call flow — opening to closing, with example scripts.",
  mockCallWelcomeBullet2:
    "Guided scenarios with AI caller audio (bundled clips sa browser).",
  mockCallWelcomeBullet3:
    "Optional per-step recording — saved locally until you log out.",
  mockCallWelcomeContinue: "Continue",
  mockCallHubTitle: "Unsa ang imong sugdan?",
  mockCallHubSubtitle:
    "Pick Learn flow first kung bag-o ka, or dive into Practice — My history is inside Practice.",
  mockCallHubTileLearnTitle: "Learn flow first",
  mockCallHubTileLearnDesc:
    "Walk through each call step — VA focus, example lines, ug typical caller behavior.",
  mockCallHubTilePracticeTitle: "Practice",
  mockCallHubTilePracticeDesc:
    "Run mock calls with scenarios, Riverside PM tools, ug review recordings sa My history tab.",
  mockCallHubTileAudioSetupTitle: "Test mic ug speaker first",
  mockCallHubTileAudioSetupDesc:
    "Pick imong microphone ug speaker, record a quick test, ug play a test sound before mock call.",
  mockCallHubTileHistoryTitle: "My history",
  mockCallHubTileHistoryDesc:
    "Review saved mock calls — replay imong responses ug caller clips from this browser.",
  mockCallBackToHub: "Back to hub",
  mockCallBackToHubShort: "Hub",
  mockCallNavPhaseWelcome: "Welcome",
  mockCallNavPhaseHub: "Home",
  mockCallNavPhaseAudioSetup: "Audio setup",
  mockCallLearnSlideProgress: "Step {current} of {total}",
  mockCallLearnPrev: "Previous",
  mockCallLearnNext: "Next step",
  mockCallLearnFinish: "Finish flow",
  mockCallLearnGoPractice: "Go to Practice",
  mockCallLearnSummaryTitle: "Call flow summary",
  mockCallLearnSummaryLead:
    "Quick recap sa eight steps — use this order on every mock call ug sa real phone work.",
  mockCallLearnSummaryCta:
    "Ready na? Finish the flow or jump straight to Practice scenarios.",
  mockCallLearnExtraTipLabel: "Extra call tip",
  mockCallLearnExtraTipHoldTitle: "Before you place the caller on hold",
  mockCallLearnExtraTipHoldBody:
    "Always ask permission first — dili lang silent hold. Then give a clear timeframe in minutes (e.g. two to three minutes), and balik sooner if you can. If hold mag-dugay, check back briefly: \"Thanks for waiting — still working on this, about one more minute.\"",
  mockCallLearnExtraTipHoldExample:
    "May I place you on a brief hold while I verify that in our system? It should be about two minutes.",
  mockCallLearnViewSummary: "View summary",
  mockCallLearnSummaryProgressLabel: "Summary",
  mockCallLearnVaLabel: "VA focus",
  mockCallLearnExampleLabel: "Example script",
  mockCallLearnCallerLabel: "Typical caller",
  mockCallPracticeSegmentCall: "Practice call",
  mockCallPracticeSegmentHistory: "My history",
  mockCallLearnIntro:
    "Eight steps for professional call handling — positive language ug clear next steps for billing, Insurance, ug scheduling.",
  mockCallRecordingNote:
    "Per step, pwede nimo i-record ang imong response (Record / Stop / Replay). Clips save locally sa browser lang — log out clears practice data.",
  mockCallRecordResponse: "Record response",
  mockCallRecordOpeningSpiel: "Record opening spiel",
  mockCallSayLineRecordHeading:
    "Say your line aloud — record your opening spiel if you want, then Continue.",
  mockCallSayLineNoRecordingYet:
    "Optional — i-record ang imong line before Continue, or skip sa training mode.",
  mockCallRecordAgain: "Record again",
  mockCallStopRecording: "Stop recording",
  mockCallReplayMyResponse: "Replay my response",
  mockCallRecordingThisStep: "Recording this step…",
  mockCallNoRecordingYet:
    "Optional — i-record ang imong response before Next step, or skip sa training mode.",
  mockCallStepsRecordedLabel: "Steps recorded",
  mockCallLegacyWholeCallRecording: "Whole-call recording (older session)",
  mockCallMicDenied:
    "Mic permission wala — pwede gihapon mu-practice sa script ug caller text, pero dili ma-save ang imong voice track.",
  mockCallTtsUnavailable:
    "Caller audio wala available — basaha ang script below. I-set ang ElevenLabs keys sa server para ma-play ang AI voice.",
  mockCallAudioMissing:
    "ElevenLabs clip wala ma-load — hard refresh Mock Call or check DevTools Network for manifest.json ug .mp3. Basaha ang script below meantime.",
  mockCallAudioPrefetching: "Loading caller audio sa browser cache…",
  mockCallAudioPrefetchReady:
    "Caller audio ready ({loaded}/{total}) — bundled ElevenLabs clips. Play when you reach each step.",
  mockCallAudioPrefetchPartial:
    "Caller audio incomplete ({loaded}/{total}). Hard refresh (Ctrl+Shift+R), or run npm run generate:mock-call-audio on the project.",
  mockCallSelectScenario: "Pick a scenario",
  mockCallScenarioUnavailable: "Unavailable",
  mockCallStudentScenarioHint:
    "Basic call flow (training) lang available karon. Other scenarios unavailable for now.",
  mockCallIncomingTitle: "Incoming call",
  mockCallIncomingSubtitle:
    "Simulation lang — tap Answer when you're ready to pick up like a real Medical VA line.",
  mockCallAnswerCall: "Answer call",
  mockCallBeatSayGuide: "1. Say your line",
  mockCallBeatOpeningSpiel: "1. Opening spiel",
  mockCallBeatCallerAndRespond: "2. Caller + your turn",
  mockCallBeatHearCaller: "2. Hear caller",
  mockCallBeatYourTurn: "3. Your turn",
  mockCallContinueToCaller: "Continue — caller + your turn",
  mockCallContinueToDialogue: "Continue — patient on the line",
  mockCallDialoguePageLabel: "Exchange",
  mockCallBookTenBeforeNext:
    "Book Monday 10:00 a.m. sa Schedule ug Save appointment before Next step.",
  mockCallContinueToRespond: "Continue — your turn",
  mockCallCallerPlaying: "Playing caller…",
  mockCallVaLineLabel: "Your line (say aloud)",
  mockCallStartCall: "Start mock call",
  mockCallEndCall: "End call",
  mockCallInCallLabel: "Active mock call",
  mockCallGenericCallerName: "Caller",
  mockCallPreviousStep: "Previous step",
  mockCallNextStep: "Next step",
  mockCallPlayCaller: "Play caller line",
  mockCallStepLabel: "Step",
  mockCallCoachHint: "Coach hint",
  mockCallCallerScript: "Caller script",
  mockCallStudentGuide: "Suggested response (guide)",
  mockCallStudentGuideNote:
    "Guide lang — pwede imong own words basta naa ang key steps sa call flow.",
  mockCallToolSectionTitle: "Practice tool (click guide)",
  mockCallToolSectionIntro:
    "Fake Riverside PM lang ni — walay real patient data. Navigate like real software: pick the right module ug buttons para sa caller, sunod-sunod sa numbered guide.",
  mockCallToolWrongControl:
    "Dili ni ang sunod step — tan-awa ang guide ug unsa ang gikinahanglan sa caller.",
  mockCallToolStepDone: "done",
  mockCallToolOptionalNote:
    "Optional: finish the click guide when you can — pwede gihapon Next step sa training.",
  mockCallToolWrongOrder:
    "Sunod nga step sa guide first — tan-awa ang numbered list.",
  mockCallToolAllDone: "Click guide complete — nice work sa system navigation.",
  mockCallYourTurn:
    "Your turn — respond out loud, record if you want, then tap Next step.",
  mockCallHistoryEmpty: "No mock calls saved yet.",
  mockCallDeleteSession: "Delete session",
  mockCallDeleteConfirm: "Delete this mock call recording from this browser?",
  mockCallReplayStudent: "Play your recording",
  mockCallReplayCaller: "Play caller clips",
  mockCallReplayFullConversation: "Play full conversation",
  mockCallReplayFullConversationHint:
    "Opening to close — imong lines ug caller sa correct order.",
  mockCallStopPlayback: "Stop playback",
  mockCallReplayNothing: "Walay audio to replay for this session.",
  mockCallDownloadConversation: "Download conversation",
  mockCallDownloadingConversation: "Preparing download…",
  mockCallDownloadPhaseFetching: "Fetching clips",
  mockCallDownloadPhaseMerging: "Merging audio",
  mockCallDownloadPhaseSaving: "Saving file",
  mockCallDownloadProgressLabel: "{percent}% — {phase}",
  mockCallDownloadMergeFailed:
    "Could not merge clips sa imong browser — try Play full conversation or a different browser (Chrome recommended).",
  mockCallDownloadNothing: "Walay audio to download for this session.",
  mockCallAudioSetupTitle: "Mic ug speaker setup",
  mockCallAudioSetupLead:
    "Choose devices before mock call — settings save locally sa browser lang.",
  mockCallAudioSetupMicLabel: "Microphone",
  mockCallAudioSetupSpeakerLabel: "Speaker / headphones",
  mockCallAudioSetupDefaultDevice: "System default",
  mockCallAudioSetupRecordTest: "Record mic test",
  mockCallAudioSetupStopTest: "Stop test",
  mockCallAudioSetupPlayTest: "Play back mic test",
  mockCallAudioSetupPlaySpeakerTest: "Play speaker test sound",
  mockCallAudioSetupSpeakerPlaying: "Playing test sound…",
  mockCallAudioSetupMicDenied:
    "Mic permission wala — allow microphone sa browser settings, then refresh.",
  mockCallSpeakerSelectUnsupported:
    "Speaker pick works best sa Chrome or Edge. Other browsers gamiton ang system default output.",
  mockCallAudioSetupSavedNote:
    "Saved — mock call recording gamiton ni nga mic; replay gamiton ang speaker kung supported.",
  mockCallMoodHappy: "Happy caller",
  mockCallMoodNeutral: "Neutral caller",
  mockCallMoodUpset: "Upset caller",
  mockCallMoodWorried: "Worried caller",
  mockCallStepOpeningTitle: "Opening spiel",
  mockCallStepOpeningVaFocus:
    "Greet the caller, name the clinic or practice, say your role as Medical VA, and offer help.",
  mockCallStepOpeningExample:
    "Good morning, thank you for calling Riverside Family Medicine. My name is ________, Medical VA support. How can I help you today?",
  mockCallStepOpeningCaller: "Brief hello or they state why they're calling.",
  mockCallStepRapportTitle: "Build rapport",
  mockCallStepRapportVaFocus:
    "Ask how they are today. Match mood — empathize if sad, frustrated, or worried; stay warm if they're upbeat.",
  mockCallStepRapportExample:
    "I'm glad you reached out. Before we dive in, how are you doing today?",
  mockCallStepRapportCaller: "Short answer about their day or emotional tone.",
  mockCallStepMainConcernTitle: "Main concern",
  mockCallStepMainConcernVaFocus:
    "Use open questions. Listen, clarify dates, Insurance, and account details without interrupting.",
  mockCallStepMainConcernExample:
    "So I understand clearly — what would you like us to help you with on this call?",
  mockCallStepMainConcernCaller:
    "States billing balance, Eligibility, prior auth, scheduling, or chart update.",
  mockCallStepApologyTitle: "Apologize + assurance",
  mockCallStepApologyVaFocus:
    "Acknowledge inconvenience or confusion. Assure them you will do your best to resolve the issue today.",
  mockCallStepApologyExample:
    "I'm sorry for the confusion on your statement. I'll review your account with you and we'll work through this together.",
  mockCallStepApologyCaller: "May vent, worry, or accept your empathy.",
  mockCallStepSolutionTitle: "Positive solution",
  mockCallStepSolutionVaFocus:
    "Use positive framing: here's what we can do, here's what you need to do. Clear timeline and next steps.",
  mockCallStepSolutionExample:
    "Here's what we can do today: I'll verify the claim with your payer and send you a portal message within two business days.",
  mockCallStepSolutionCaller: "Confirms understanding or asks a quick follow-up.",
  mockCallStepMoreConcernsTitle: "More concerns?",
  mockCallStepMoreConcernsVaFocus:
    "Invite other questions about the visit, Insurance, or billing before you wrap up.",
  mockCallStepMoreConcernsExample:
    "Before we finish, is there anything else I can help you with today?",
  mockCallStepMoreConcernsCaller: "Yes/no or a small add-on question.",
  mockCallStepAllAddressedTitle: "All concerns addressed?",
  mockCallStepAllAddressedVaFocus:
    "Summarize what you did. Confirm they're comfortable with the plan.",
  mockCallStepAllAddressedExample:
    "Just to recap: we updated your Insurance and resubmitted the claim. Does that cover everything for you today?",
  mockCallStepAllAddressedCaller: "Confirms or raises one last item.",
  mockCallStepClosingTitle: "Closing spiel",
  mockCallStepClosingVaFocus:
    "Thank them for calling, recap key action, invite them to call back, warm goodbye.",
  mockCallStepClosingExample:
    "Thank you for calling Riverside Family Medicine. We appreciate your patience. Have a great day!",
  mockCallStepClosingCaller: "Thanks and goodbye.",
} as const;

export const modulesCopy = {
  nav: "Modules",
  title: "Modules",
  description:
    "Open the lessons and quizzes for courses you enrolled and paid for. Live Zoom schedule is separate — modules are ready once activated.",
  dashboardDescription:
    "Imong Modules dashboard — lessons and quizzes for courses you enrolled and paid for. Open na once activated.",
  statEnrolled: "Enrolled",
  statOpen: "Open now",
  statLocked: "Locked",
  statNextUnlock: "Next unlock",
  continueEyebrow: "Continue",
  continueCta: "Open modules",
  openCta: "Open",
  unlockedSince: "Unlocked since",
  catalogSection: "Your courses",
  moduleCountOne: "1 module",
  moduleCountOther: "{n} modules",
  openLessons: "Open a module to view files and take the quiz.",
  allModules: "All modules",
  emptyTitle: "Wala pa kay enrolled course",
  emptyBody:
    "Enroll sa course una ug complete payment. Modules mo-open once activated.",
  emptyCta: "Browse courses",
  filterAll: "All courses",
  lockedBadge: "Locked",
  openBadge: "Open",
  lockedTitle: "Locked pa ni",
  lockedBody:
    "Complete payment or enrollment activation first. Zoom schedule does not block modules once paid.",
  unlocksAt: "Your Zoom session",
  filesTitle: "Lesson files",
  quizTitle: "Quiz",
  quizCta: "Take the quiz",
  quizSubmit: "Submit quiz",
  quizNext: "Next question",
  quizQuestionOf: "Question {n} of {total}",
  quizYourAnswer: "Imong answer",
  quizCorrect: "Correct",
  quizIncorrect: "Incorrect",
  quizCorrectAnswer: "Correct answer",
  quizExplanation: "Explanation",
  quizNoAnswer: "Wala ka ni-pili",
  quizRetake: "Retake quiz",
  quizScore: "Your score",
  noModulesTitle: "No modules yet",
  noModulesBody: "The team is still preparing the lessons for this course.",
  noFiles: "No files uploaded yet for this module.",
  noQuiz: "Wala pa quiz for this module.",
  download: "Download",
  openFile: "Open file",
  notEnrolledTitle: "Kini nga course wala sa imong Modules",
  notEnrolledBody:
    "You can only open modules for courses you already enrolled and activated.",
  staffPreview:
    "Admin preview — you can open all Modules without enrolling.",
  draftBadge: "Draft",
  nextItem: "Go to next item",
  viewCertificate: "View certificate of completion",
  finishCourseCta: "Finish na ang last item",
  certificateNotReadyTitle: "Certificate dili pa ready",
  certificateNotReadyBody:
    "Finish every lesson and pass the quizzes. Imong certificate mo-gawas diri after the last item.",
  backToModules: "Back to modules",
  readingLabel: "Reading",
  videoLabel: "Video",
  quizLabel: "Quiz",
  quizGrade: "Graded Assignment · Grade: 70%",
  quizNeedPass: "Kinahanglan 70% para ma-unlock ang next item.",
  todayGoal: 3,
  todayGoalTitle: "Today's Goal",
  todayGoalBody: "Complete 3 items today to stay at a good pace!",
  outlineTitle: "Course outline",
  fullscreen: "Fullscreen",
  itemLockedBody: "Finish the previous item una para ma-open ni.",
  moduleQuizLocked: "Pass the previous Quiz una para ma-open ni.",
  pdfLoading: "Gi-load ang lesson…",
  pdfError: "Dili ma-open ang PDF. Try again.",
  viewAsPdf:
    "Kini nga file dili ma-view sa player. Ask the team to upload a PDF or video.",
  pageLabel: "Page",
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
  modules: {
    default: "/images/modules/default.png",
  },
} as const;
