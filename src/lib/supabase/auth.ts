import { createAvatarSignedUrl } from "@/lib/member/avatar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "STUDENT";

export type AdminProfile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
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

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, mobile, occupation, experience_level, messenger_handle, referral_source, avatar_path",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  const avatar_url = await createAvatarSignedUrl(supabase, profile.avatar_path);

  return {
    ...profile,
    avatar_url,
  } as AdminProfile;
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
  if (!isStudentRole(profile.role)) {
    if (isAdminRole(profile.role)) {
      redirect("/admin");
    }
    redirect("/auth/access-denied");
  }
  return profile as MemberProfile;
}
