import { createServiceClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getAppOrigin } from "@/lib/payments/pay-url";
import { ensureReferralCode } from "@/lib/referrals/codes";

export type ReferralCommissionMode = "FIXED" | "PERCENT";

export type CourseReferralCommission = {
  courseId: string;
  title: string;
  price: number;
  currency: string;
  mode: ReferralCommissionMode;
  value: number;
  enabled: boolean;
};

export type ReferralRewardRow = {
  id: string;
  refereeId: string;
  friendName: string;
  courseTitle: string;
  amount: number;
  createdAt: string;
};

export type ReferralFriendCourse = {
  title: string;
  status: string;
};

export type ReferralFriend = {
  id: string;
  name: string;
  courses: ReferralFriendCourse[];
};

export type ReferralDashboard = {
  code: string;
  link: string;
  friendCount: number;
  enrolledCourses: number;
  earnings: number;
  rewards: ReferralRewardRow[];
  friends: ReferralFriend[];
};

export async function listCourseReferralCommissions(): Promise<
  CourseReferralCommission[]
> {
  const supabase = await createClient();
  const [{ data: courses }, { data: rows }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, title, price, currency, status")
      .neq("status", "ARCHIVED")
      .order("sort_order", { ascending: true }),
    supabase
      .from("course_referral_commissions")
      .select("course_id, mode, value, enabled"),
  ]);

  const byCourse = new Map(
    (rows ?? []).map((row) => [row.course_id as string, row]),
  );

  return (courses ?? []).map((course) => {
    const saved = byCourse.get(course.id as string);
    return {
      courseId: course.id as string,
      title: course.title as string,
      price: Number(course.price ?? 0),
      currency: (course.currency as string) || "PHP",
      mode: saved?.mode === "PERCENT" ? "PERCENT" : "FIXED",
      value: Number(saved?.value ?? 0),
      enabled: Boolean(saved?.enabled),
    };
  });
}

export async function getReferralDashboard(
  profileId: string,
  fullName: string,
): Promise<ReferralDashboard> {
  const code = await ensureReferralCode(profileId, fullName);
  const admin = createServiceClient();
  const { data: rewards } = await admin
    .from("referral_rewards")
    .select("id, referee_id, course_id, amount, created_at")
    .eq("referrer_id", profileId)
    .order("created_at", { ascending: false });

  const rows = rewards ?? [];
  const refereeIds = [...new Set(rows.map((row) => row.referee_id as string))];
  const courseIds = [...new Set(rows.map((row) => row.course_id as string))];

  const [{ data: people }, { data: courses }, { data: enrollments }] =
    await Promise.all([
      refereeIds.length
        ? admin.from("profiles").select("id, full_name").in("id", refereeIds)
        : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
      courseIds.length
        ? admin.from("courses").select("id, title").in("id", courseIds)
        : Promise.resolve({ data: [] as { id: string; title: string }[] }),
      refereeIds.length
        ? admin
            .from("enrollments")
            .select("student_id, status, created_at, courses(id, title)")
            .in("student_id", refereeIds)
            .in("status", ["ACTIVE", "COMPLETED", "PENDING_PAYMENT"])
            .order("created_at", { ascending: false })
        : Promise.resolve({
            data: [] as {
              student_id: string;
              status: string;
              created_at: string;
              courses: { id: string; title: string } | { id: string; title: string }[] | null;
            }[],
          }),
    ]);

  const names = new Map(
    (people ?? []).map((row) => [row.id, row.full_name || "Friend"]),
  );
  const titles = new Map(
    (courses ?? []).map((row) => [row.id, row.title || "Course"]),
  );

  const coursesByFriend = new Map<string, ReferralFriendCourse[]>();
  for (const enrollment of enrollments ?? []) {
    const studentId = enrollment.student_id as string;
    const course = Array.isArray(enrollment.courses)
      ? enrollment.courses[0]
      : enrollment.courses;
    const list = coursesByFriend.get(studentId) ?? [];
    list.push({
      title: (course?.title as string | undefined) || "Course",
      status: enrollment.status as string,
    });
    coursesByFriend.set(studentId, list);
  }

  const mapped: ReferralRewardRow[] = rows.map((row) => ({
    id: row.id as string,
    refereeId: row.referee_id as string,
    friendName: names.get(row.referee_id as string) ?? "Friend",
    courseTitle: titles.get(row.course_id as string) ?? "Course",
    amount: Number(row.amount),
    createdAt: row.created_at as string,
  }));

  const friends: ReferralFriend[] = refereeIds.map((id) => ({
    id,
    name: names.get(id) ?? "Friend",
    courses: coursesByFriend.get(id) ?? [],
  }));

  return {
    code,
    link: `${getAppOrigin()}/register?ref=${encodeURIComponent(code)}`,
    friendCount: refereeIds.length,
    enrolledCourses: rows.length,
    earnings: mapped.reduce((sum, row) => sum + row.amount, 0),
    rewards: mapped,
    friends,
  };
}
