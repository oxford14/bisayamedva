import {
  BookOpen,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  UserRound,
  type LucideIcon,
} from "lucide-react";

export type MemberNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  mobilePrimary?: boolean;
};

export const memberNav: MemberNavItem[] = [
  {
    href: "/member",
    label: "Home",
    icon: LayoutDashboard,
    exact: true,
    mobilePrimary: true,
  },
  {
    href: "/member/course",
    label: "Courses",
    icon: BookOpen,
    mobilePrimary: true,
  },
  {
    href: "/member/schedule",
    label: "Schedule",
    icon: CalendarDays,
    mobilePrimary: true,
  },
  {
    href: "/member/payments",
    label: "Payments",
    icon: CreditCard,
    mobilePrimary: true,
  },
  {
    href: "/member/profile",
    label: "Profile",
    icon: UserRound,
  },
];
