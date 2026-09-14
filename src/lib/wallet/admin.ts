import { createServiceClient } from "@/lib/supabase/admin";

export type AdminMemberWalletRow = {
  student_id: string;
  email: string | null;
  full_name: string | null;
  balance: number;
  currency: string;
  wallet_updated_at: string | null;
};

export async function listAdminMemberWallets(): Promise<AdminMemberWalletRow[]> {
  const admin = createServiceClient();

  const { data: students, error: studentsError } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "STUDENT")
    .order("full_name", { ascending: true })
    .limit(500);

  if (studentsError) {
    console.error("listAdminMemberWallets profiles", studentsError.message);
    return [];
  }

  const studentIds = (students ?? []).map((s) => s.id as string);
  if (!studentIds.length) return [];

  const { data: wallets, error: walletsError } = await admin
    .from("wallets")
    .select("student_id, balance, currency, updated_at")
    .in("student_id", studentIds);

  if (walletsError) {
    console.error("listAdminMemberWallets wallets", walletsError.message);
  }

  const walletByStudent = new Map(
    (wallets ?? []).map((w) => [
      w.student_id as string,
      {
        balance: Number(w.balance),
        currency: (w.currency as string) || "PHP",
        updated_at: (w.updated_at as string | null) ?? null,
      },
    ]),
  );

  const rows: AdminMemberWalletRow[] = (students ?? []).map((s) => {
    const id = s.id as string;
    const wallet = walletByStudent.get(id);
    return {
      student_id: id,
      email: (s.email as string | null) ?? null,
      full_name: (s.full_name as string | null) ?? null,
      balance: wallet?.balance ?? 0,
      currency: wallet?.currency ?? "PHP",
      wallet_updated_at: wallet?.updated_at ?? null,
    };
  });

  rows.sort((a, b) => b.balance - a.balance || (a.full_name ?? "").localeCompare(b.full_name ?? ""));
  return rows;
}
