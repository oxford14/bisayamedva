"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { AdminProfile } from "@/lib/supabase/auth";
import { cn } from "@/lib/utils";

type UserMenuProfile = Pick<
  AdminProfile,
  "email" | "full_name" | "role" | "avatar_url"
>;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function roleLabel(role: string) {
  return role.replaceAll("_", " ");
}

const itemClassName =
  "cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-navy/80 focus:bg-sand focus:text-navy";

function AvatarMark({
  name,
  email,
  avatarUrl,
  sizeClassName,
  textClassName,
}: {
  name: string;
  email: string;
  avatarUrl?: string | null;
  sizeClassName: string;
  textClassName: string;
}) {
  const letters = initials(name || email);
  if (avatarUrl) {
    return (
      // Signed URLs rotate; skip next/image caching.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={cn(sizeClassName, "object-cover")}
      />
    );
  }
  return (
    <span
      className={cn(
        sizeClassName,
        "flex items-center justify-center",
        textClassName,
      )}
      aria-hidden
    >
      {letters}
    </span>
  );
}

export function UserMenu({
  profile,
  className,
}: {
  profile: UserMenuProfile;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const admin = profile.role === "SUPER_ADMIN" || profile.role === "ADMIN";
  const student = profile.role === "STUDENT";
  const inAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const inMember = pathname === "/member" || pathname.startsWith("/member/");
  const showDashboard = (admin && !inAdmin) || (student && !inMember);
  const dashboardHref = admin ? "/admin" : "/member";
  const dashboardLabel = admin ? "Admin" : "My training";

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex size-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-navy text-[13px] font-semibold tracking-wide text-cream outline-none transition-[box-shadow,background-color] hover:bg-navy-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
          className,
        )}
        aria-label="Account menu"
      >
        <AvatarMark
          name={profile.full_name}
          email={profile.email}
          avatarUrl={profile.avatar_url}
          sizeClassName="size-full"
          textClassName="text-[13px] font-semibold"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-72 min-w-72 rounded-2xl border border-navy/10 bg-white p-2 text-ink shadow-[0_18px_40px_rgba(47,56,38,0.16)] ring-0"
      >
        <div className="flex flex-col items-center px-3 pt-4 pb-3 text-center">
          <span className="flex size-14 items-center justify-center overflow-hidden rounded-full bg-navy text-lg font-semibold text-cream">
            <AvatarMark
              name={profile.full_name}
              email={profile.email}
              avatarUrl={profile.avatar_url}
              sizeClassName="size-full"
              textClassName="text-lg font-semibold"
            />
          </span>
          <p className="mt-3 max-w-full truncate text-sm font-semibold text-ink">
            {profile.full_name}
          </p>
          <p className="mt-0.5 max-w-full truncate text-[12px] text-muted">
            {profile.email}
          </p>
          <span className="mt-2 inline-flex rounded-md bg-sand px-2 py-0.5 text-[10px] font-semibold tracking-wide text-navy/70 uppercase">
            {roleLabel(profile.role)}
          </span>
        </div>

        {showDashboard || student ? (
          <>
            <DropdownMenuSeparator className="mx-1 bg-border" />
            {showDashboard ? (
              <DropdownMenuItem
                render={<Link href={dashboardHref} />}
                className={itemClassName}
              >
                <LayoutDashboard className="size-4" aria-hidden />
                {dashboardLabel}
              </DropdownMenuItem>
            ) : null}
            {student ? (
              <DropdownMenuItem
                render={<Link href="/member/profile" />}
                className={itemClassName}
              >
                <UserRound className="size-4" aria-hidden />
                Profile
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}

        <DropdownMenuSeparator className="mx-1 bg-border" />
        <DropdownMenuItem
          variant="destructive"
          onClick={signOut}
          className="cursor-pointer gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium"
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
