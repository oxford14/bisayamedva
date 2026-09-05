import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/ui";
import {
  PromoManager,
  type PromoManagerRow,
} from "@/components/admin/promo-manager";

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

  return (
    <div>
      <AdminPageHeader
        title="Promo codes"
        description="Create registration discounts — fixed ₱ or percent, with limited or unlimited slots."
      />
      <PromoManager promos={promos} />
    </div>
  );
}
