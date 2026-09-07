import {
  Award,
  BookOpen,
  CalendarDays,
  Gift,
  Layers,
  LayoutDashboard,
  MessagesSquare,
  UserRound,
  Wallet,
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
    href: "/member/modules",
    label: "Modules",
    icon: Layers,
  },
  {
    href: "/member/certificates",
    label: "Certificates",
    icon: Award,
  },
  {
    href: "/member/schedule",
    label: "Schedule",
    icon: CalendarDays,
    mobilePrimary: true,
  },
  {
    href: "/member/wallet",
    label: "Wallet",
    icon: Wallet,
  },
  {
    href: "/member/refer",
    label: "Refer a Friend",
    icon: Gift,
  },
  {
    href: "/member/lounge",
    label: "Student Lounge",
    icon: MessagesSquare,
    mobilePrimary: true,
  },
  {
    href: "/member/profile",
    label: "Profile",
    icon: UserRound,
  },
];
