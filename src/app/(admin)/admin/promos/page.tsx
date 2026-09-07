import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/ui";
import {
  PromoManager,
  type PromoManagerRow,
  type PromoRedemptionRow,
} from "@/components/admin/promo-manager";

type EnrollmentJoin = {
  profiles:
    | { full_name: string | null; email: string | null }
    | { full_name: string | null; email: string | null }[]
    | null;
  courses: { title: string | null } | { title: string | null }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function PromosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("promo_codes")
    .select(
      "id, code, discount_type, discount_value, max_redemptions, redeemed_count, active, ends_at, note",
    )
    .order("created_at", { ascending: false });

  const promos: PromoManagerRow[] = (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    discount_type: row.discount_type as "FIXED" | "PERCENT",
    discount_value: Number(row.discount_value),
    max_redemptions: row.max_redemptions,
    redeemed_count: row.redeemed_count,
    active: row.active,
    ends_at: row.ends_at,
    note: row.note,
  }));

  const promoIds = promos.map((promo) => promo.id);
  const { data: paymentRows } =
    promoIds.length > 0
      ? await supabase
          .from("payments")
          .select(
            "id, status, created_at, promo_code_id, enrollments(profiles(full_name, email), courses(title))",
          )
          .in("promo_code_id", promoIds)
          .order("created_at", { ascending: false })
      : { data: [] as never[] };

  const redemptions: Record<string, PromoRedemptionRow[]> = {};
  for (const row of paymentRows ?? []) {
    if (!row.promo_code_id) continue;
    const enrollment = one(row.enrollments as EnrollmentJoin | EnrollmentJoin[] | null);
    const profile = one(enrollment?.profiles ?? null);
    const course = one(enrollment?.courses ?? null);
    const list = redemptions[row.promo_code_id] ?? [];
    list.push({
      id: row.id,
      fullName: profile?.full_name?.trim() || "Unnamed student",
      email: profile?.email?.trim() || "—",
      courseTitle: course?.title?.trim() || "—",
      status: row.status,
      createdAt: row.created_at,
    });
    redemptions[row.promo_code_id] = list;
  }

  return (
    <div>
      <AdminPageHeader
        title="Promo codes"
        description="Create registration discounts — fixed ₱ or percent, with limited or unlimited slots."
      />
      <PromoManager promos={promos} redemptions={redemptions} />
    </div>
  );
}
