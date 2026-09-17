import {
  CalendarClock,
  ClipboardList,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { practiceCopy } from "@/content/site";

export type PracticeSimTile = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

/** Add new practice simulations here — hub renders one square tile each. */
export const practiceSimTiles: PracticeSimTile[] = [
  {
    href: "/member/practice/registration",
    title: practiceCopy.registrationTitle,
    description: practiceCopy.registrationDescription,
    icon: ClipboardList,
  },
  {
    href: "/member/practice/scheduling",
    title: practiceCopy.schedulingTitle,
    description: practiceCopy.schedulingDescription,
    icon: CalendarClock,
  },
  {
    href: "/member/practice/mock-call",
    title: practiceCopy.mockCallTitle,
    description: practiceCopy.mockCallDescription,
    icon: Phone,
  },
];
