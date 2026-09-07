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
  choosing: "Saving…",
  pickTitle: "Pick your weekend session",
  pickBody: "Choose a date for your paid course.",
  seatedBody: "Naa na kay weekend session for this course.",
  emptyTitle: "Wala pa’y open schedule",
  emptyPaidTitle: "Wala pa kay paid course nga need og schedule",
  emptyPaidBody:
    "Enroll and pay a course first. After payment, open dates for that course mo-gawas diri.",
  emptyBody:
    "Check back later when admin opens the next weekend training date.",
} as const;

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
  dateLabel: "Date completed",
  idLabel: "Certificate ID",
  signatoryName: trainer.name,
  signatoryTitle: "Medical VA Coach",
  scanPrompt: "Scan this code to verify this certificate is authentic.",
  scanNote:
    "This check confirms Bisaya MedVA issued it, not an edited copy.",
  authenticating: "Authenticating Certificate",
  authenticTitle: "Certificate is authentic",
  authenticBody:
    "This page is for clients to confirm Bisaya MedVA issued this certificate.",
  unverifiedTitle: "This certificate could not be verified",
  unverifiedBody:
    "We could not confirm this certificate was issued by Bisaya MedVA.",
} as const;

export const modulesCopy = {
  nav: "Modules",
  title: "Modules",
  description:
    "Open the lessons and quizzes for courses you enrolled in. Locked sila until your Zoom session starts.",
  dashboardDescription:
    "Imong Modules dashboard — lessons and quizzes for courses you enrolled in. Locked sila until your Zoom session starts.",
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
    "Enroll sa course una. Modules mo-open when your Zoom session starts.",
  emptyCta: "Browse courses",
  filterAll: "All courses",
  lockedBadge: "Locked",
  openBadge: "Open",
  lockedTitle: "Locked pa ni",
  lockedBody: "Open ni during your scheduled Zoom and after.",
  unlocksAt: "Opens",
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
