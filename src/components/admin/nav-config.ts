import {
  BookOpen,
  CalendarDays,
  CreditCard,
  Layers,
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  ClipboardList,
  TicketPercent,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  superAdminOnly?: boolean;
  /** Shown in mobile bottom bar (max ~4 + More). */
  mobilePrimary?: boolean;
  section: "manage" | "site";
};

export const adminNav: AdminNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
    mobilePrimary: true,
    section: "manage",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    mobilePrimary: true,
    section: "manage",
  },
  {
    href: "/admin/courses",
    label: "Courses",
    icon: BookOpen,
    section: "manage",
  },
  {
    href: "/admin/modules",
    label: "Modules",
    icon: Layers,
    section: "manage",
  },
  {
    href: "/admin/sessions",
    label: "Sessions",
    icon: CalendarDays,
    section: "manage",
  },
  {
    href: "/admin/enrollments",
    label: "Enrollments",
    icon: ClipboardList,
    mobilePrimary: true,
    section: "manage",
  },
  {
    href: "/admin/payments",
    label: "Payments",
    icon: CreditCard,
    mobilePrimary: true,
    section: "manage",
  },
  {
    href: "/admin/promos",
    label: "Promo codes",
    icon: TicketPercent,
    section: "manage",
  },
  {
    href: "/admin/content",
    label: "Content",
    icon: FileText,
    section: "site",
  },
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
    superAdminOnly: true,
    section: "site",
  },
];
