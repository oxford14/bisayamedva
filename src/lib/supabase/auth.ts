import { cache } from "react";
import { redirect } from "next/navigation";
import { createAvatarSignedUrl } from "@/lib/member/avatar";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "STUDENT";
export type LoungeBadge = "COACH" | "ADMIN";

export type AdminProfile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  lounge_badge: LoungeBadge | null;
  mobile: string | null;
  occupation: string | null;
  experience_level: string | null;
  messenger_handle: string | null;
  referral_source: string | null;
  avatar_path: string | null;
  avatar_url: string | null;
};

export type MemberProfile = AdminProfile;

export function isAdminRole(role: string | null | undefined) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function isStudentRole(role: string | null | undefined) {
  return role === "STUDENT";
}

export function canAccessMemberApp(role: string | null | undefined) {
  return isStudentRole(role) || isAdminRole(role);
}

/** Profile row only — avatar_url deferred to keep nav fast. */
export const getCurrentProfile = cache(async (): Promise<AdminProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, lounge_badge, mobile, occupation, experience_level, messenger_handle, referral_source, avatar_path",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return {
    ...profile,
    lounge_badge:
      profile.lounge_badge === "COACH" || profile.lounge_badge === "ADMIN"
        ? profile.lounge_badge
        : null,
    avatar_url: null,
  } as AdminProfile;
});

export const getProfileAvatarUrl = cache(
  async (avatarPath: string | null | undefined) => {
    if (!avatarPath) return null;
    const supabase = await createClient();
    return createAvatarSignedUrl(supabase, avatarPath);
  },
);

export async function enrichProfileWithAvatar(
  profile: AdminProfile,
): Promise<AdminProfile> {
  const avatar_url = await getProfileAvatarUrl(profile.avatar_path);
  return { ...profile, avatar_url };
}

export async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/auth/login?next=/admin");
  }
  if (!isAdminRole(profile.role)) {
    redirect("/auth/access-denied");
  }
  return profile;
}

export async function requireSuperAdmin() {
  const profile = await requireAdmin();
  if (profile.role !== "SUPER_ADMIN") {
    redirect("/auth/access-denied");
  }
  return profile;
}

export async function requireStudent() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/auth/login?next=/member");
  }
  if (!canAccessMemberApp(profile.role)) {
    redirect("/auth/access-denied");
  }
  return profile as MemberProfile;
}

/** Use in member pages — layout already gates; shares cached profile fetch. */
export async function getStudentProfile() {
  return requireStudent();
}

/** Lightweight auth for server actions — no avatar signing. */
export async function getActionUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getActionStudentId() {
  const profile = await getCurrentProfile();
  if (!profile || !canAccessMemberApp(profile.role)) return null;
  return profile.id;
}
