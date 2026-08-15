import {
  BookOpen,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  ClipboardList,
} from "lucide-react";

export const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/sessions", label: "Sessions", icon: CalendarDays },
  { href: "/admin/enrollments", label: "Enrollments", icon: ClipboardList },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings, superAdminOnly: true },
] as const;

export type AdminNavItem = (typeof adminNav)[number];
