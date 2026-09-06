import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/supabase/auth";
import { createServiceClient } from "@/lib/supabase/admin";
import { MODULE_FILES_BUCKET } from "@/lib/modules/storage";
import { authorizePlayerFile } from "@/lib/member/module-player";
import { displayFileName } from "@/lib/member/module-player-shared";

export const runtime = "nodejs";

function contentDisposition(fileName: string, attachment: boolean) {
  const clean = displayFileName(fileName);
  const ascii = clean.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const kind = attachment ? "attachment" : "inline";
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(clean)}`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await context.params;
  if (!z.guid().safeParse(fileId).success) {
    return new NextResponse("Not found", { status: 404 });
  }

  const profile = await requireStudent();
  const authorized = await authorizePlayerFile(profile.id, fileId, profile.role);
  if (!authorized) {
    return new NextResponse("Not found", { status: 404 });
  }

  const wantDownload =
    authorized.staff &&
    new URL(request.url).searchParams.get("download") === "1";

  const admin = createServiceClient();
  const { data, error } = await admin.storage
    .from(MODULE_FILES_BUCKET)
    .download(authorized.storagePath);
  if (error || !data) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(data.stream(), {
    headers: {
      "Content-Type": authorized.mimeType || "application/octet-stream",
      "Content-Disposition": contentDisposition(
        authorized.fileName,
        wantDownload,
      ),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
