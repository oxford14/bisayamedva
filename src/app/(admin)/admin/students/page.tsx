import { redirect } from "next/navigation";

export default async function StudentsRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  redirect(q ? `/admin/progress?q=${encodeURIComponent(q)}` : "/admin/progress");
}
