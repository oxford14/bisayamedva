import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));

  if (!tokenHash || type !== "recovery") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/forgot-password";
    url.search = "error=invalid_link";
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type: "recovery",
    token_hash: tokenHash,
  });

  if (error) {
    console.error("[auth/confirm] verifyOtp:", error.message);
    const url = request.nextUrl.clone();
    url.pathname = "/auth/forgot-password";
    url.search = "error=invalid_link";
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = next ?? "/auth/reset-password";
  url.search = "";
  return NextResponse.redirect(url);
}
