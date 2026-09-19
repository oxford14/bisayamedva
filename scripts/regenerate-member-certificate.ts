/**
 * Re-bootstrap completion rows + enrollment for certificate testing.
 * Usage: npx tsx scripts/regenerate-member-certificate.ts <email> [courseSlug]
 */
import { loadDotEnvForScripts } from "./load-env-for-scripts";

async function main() {
  loadDotEnvForScripts();
  const email = process.argv[2]?.trim().toLowerCase();
  const slug = process.argv[3]?.trim() || "medical-va-masterclass";
  if (!email) {
    console.error("Usage: npx tsx scripts/regenerate-member-certificate.ts <email> [slug]");
    process.exit(1);
  }

  const { createServiceClient } = await import("../src/lib/supabase/admin");
  const { ensureMemberCertificate } = await import("../src/lib/member/certificates");
  const { certificateCode } = await import("../src/lib/member/certificate-shared");

  const admin = createServiceClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("id, email, role, full_name")
    .ilike("email", email)
    .maybeSingle();

  if (error || !profile?.id) {
    console.error("Profile not found:", error?.message ?? email);
    process.exit(1);
  }

  const certificate = await ensureMemberCertificate(
    profile.id,
    slug,
    profile.role as "STUDENT",
    profile.email,
  );

  if (!certificate) {
    console.error("Could not issue certificate — check modules, HIPAA, enrollment.");
    process.exit(1);
  }

  console.log("Certificate ready for:", profile.full_name ?? profile.email);
  console.log("Enrollment:", certificate.enrollmentId);
  console.log("Certificate ID:", certificate.certificateId);
  console.log("Verify code matches:", certificateCode(certificate.enrollmentId));
  console.log("View:", `/member/modules/${slug}/certificate`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
