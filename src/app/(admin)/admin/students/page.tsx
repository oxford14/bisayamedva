import { redirect } from "next/navigation";

export default async function StudentsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  redirect(q ? `/admin/users?q=${encodeURIComponent(q)}` : "/admin/users");
}
