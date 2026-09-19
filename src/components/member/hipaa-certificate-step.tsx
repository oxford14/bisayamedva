"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  confirmHipaaCertificateUpload,
  deleteOwnHipaaCertificateUpload,
  getOwnHipaaCertificateViewUrl,
  prepareHipaaCertificateUpload,
} from "@/app/(member)/member/hipaa-actions";
import { HipaaCertificateViewTrigger } from "@/components/hipaa/hipaa-certificate-view-trigger";
import { Button } from "@/components/ui/button";
import { hipaaCopy, modulesCopy } from "@/content/site";
import { HipaaTrainingEmbed } from "@/components/member/hipaa-training-embed";
import { optimizeCertificateImage } from "@/lib/hipaa/optimize-certificate-image";
import {
  HIPAA_CERTIFICATES_BUCKET,
  hipaaCertificateAcceptAttribute,
  isHipaaStorageInfrastructureError,
  validateHipaaCertificateFile,
} from "@/lib/hipaa/storage";
import { createClient } from "@/lib/supabase/client";
import type { HipaaGateState } from "@/lib/member/hipaa-gate";

type Props = {
  courseSlug: string;
  gate: HipaaGateState;
  nextHref: string | null;
  courseCertificateHref?: string | null;
};

export function HipaaCertificateStep({
  courseSlug,
  gate,
  nextHref,
  courseCertificateHref = null,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [uploadDone, setUploadDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const status = gate.approved
    ? "APPROVED"
    : gate.rejected
      ? "REJECTED"
      : gate.submitted || uploadDone
        ? "PENDING"
        : "NONE";

  const mapClientUploadError = (message: string) =>
    isHipaaStorageInfrastructureError(message)
      ? hipaaCopy.uploadStorageError
      : message;

  const uploadFile = (file: File) => {
    setError("");
    setUploadDone(false);
    const mimeType = file.type || "application/octet-stream";
    const invalid = validateHipaaCertificateFile(mimeType, file.size);
    if (invalid) {
      setError(invalid);
      return;
    }
    setProgress(
      mimeType.startsWith("image/") ? hipaaCopy.optimizing : hipaaCopy.uploading,
    );
    startTransition(async () => {
      let uploadFile = file;
      try {
        if (mimeType.startsWith("image/")) {
          uploadFile = await optimizeCertificateImage(file);
          setProgress(hipaaCopy.uploading);
        }
      } catch (err) {
        setProgress("");
        setError(err instanceof Error ? err.message : "Could not optimize photo.");
        return;
      }

      const uploadMime = uploadFile.type || mimeType;
      const prepared = await prepareHipaaCertificateUpload({
        courseSlug,
        fileName: uploadFile.name,
        mimeType: uploadMime,
        byteSize: uploadFile.size,
      });
      if (!prepared.ok) {
        setProgress("");
        setError(prepared.error);
        return;
      }
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(HIPAA_CERTIFICATES_BUCKET)
        .uploadToSignedUrl(prepared.path, prepared.token, uploadFile);
      if (uploadError) {
        setProgress("");
        setError(mapClientUploadError(uploadError.message || "Upload failed."));
        return;
      }
      const confirmed = await confirmHipaaCertificateUpload({
        courseSlug,
        storagePath: prepared.path,
        fileName: uploadFile.name,
        mimeType: uploadMime,
        byteSize: uploadFile.size,
      });
      if (!confirmed.ok) {
        setProgress("");
        setError(confirmed.error);
        return;
      }
      setUploadDone(true);
      setProgress(hipaaCopy.uploadSuccess);
      router.refresh();
    });
  };

  const hasStoredUpload =
    gate.approved || gate.submitted || gate.rejected || Boolean(gate.submission);

  const canMutateUpload = !gate.approved;

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-muted">{hipaaCopy.stepLead}</p>

      <HipaaTrainingEmbed
        autoLaunch={status === "NONE" || status === "REJECTED"}
        launchSessionKey={
          status === "REJECTED" ? "hipaa-module1-retry" : "hipaa-module1-opened"
        }
      />

      {status === "APPROVED" ? (
        <div
          className="rounded-xl border border-teal-bright/40 bg-teal-bright/15 px-4 py-3"
          role="status"
        >
          <p className="text-sm font-semibold text-ink">{hipaaCopy.approvedTitle}</p>
          <p className="mt-1 text-sm text-muted">{hipaaCopy.approvedBody}</p>
          {courseCertificateHref || hasStoredUpload ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {courseCertificateHref ? (
                <Button asChild variant="accent">
                  <Link href={courseCertificateHref}>
                    {modulesCopy.viewCertificate}
                  </Link>
                </Button>
              ) : null}
              {hasStoredUpload ? (
                <HipaaCertificateViewTrigger
                  fetchAsset={async () => {
                    const result = await getOwnHipaaCertificateViewUrl(courseSlug);
                    if (!result.ok) return result;
                    return {
                      ok: true as const,
                      url: result.url,
                      mimeType: result.mimeType,
                      fileName: result.fileName,
                    };
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : status === "PENDING" ? (
        <div
          className="rounded-xl border border-border bg-cream/60 px-4 py-3"
          role="status"
        >
          <p className="text-sm font-semibold text-ink">{hipaaCopy.pendingTitle}</p>
          <p className="mt-1 text-sm text-muted">{hipaaCopy.pendingBody}</p>
          {hasStoredUpload ? (
            <div className="mt-3">
              <HipaaCertificateViewTrigger
                fetchAsset={async () => {
                  const result = await getOwnHipaaCertificateViewUrl(courseSlug);
                  if (!result.ok) return result;
                  return {
                    ok: true as const,
                    url: result.url,
                    mimeType: result.mimeType,
                    fileName: result.fileName,
                  };
                }}
                canReplace={canMutateUpload}
                canDelete={canMutateUpload}
                onReplaceFile={(file) => uploadFile(file)}
                onDelete={async () => {
                  const result = await deleteOwnHipaaCertificateUpload(courseSlug);
                  if (!result.ok) {
                    setError(result.error);
                    return result;
                  }
                  setUploadDone(false);
                  router.refresh();
                  return { ok: true as const };
                }}
              />
            </div>
          ) : null}
        </div>
      ) : status === "REJECTED" ? (
        <div
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3"
          role="alert"
        >
          <p className="text-sm font-semibold text-ink">{hipaaCopy.rejectedTitle}</p>
          {gate.reviewNote ? (
            <p className="mt-1 text-sm text-muted">{gate.reviewNote}</p>
          ) : null}
          {hasStoredUpload ? (
            <div className="mt-3">
              <HipaaCertificateViewTrigger
                fetchAsset={async () => {
                  const result = await getOwnHipaaCertificateViewUrl(courseSlug);
                  if (!result.ok) return result;
                  return {
                    ok: true as const,
                    url: result.url,
                    mimeType: result.mimeType,
                    fileName: result.fileName,
                  };
                }}
                canReplace={canMutateUpload}
                canDelete={canMutateUpload}
                onReplaceFile={(file) => uploadFile(file)}
                onDelete={async () => {
                  const result = await deleteOwnHipaaCertificateUpload(courseSlug);
                  if (!result.ok) {
                    setError(result.error);
                    return result;
                  }
                  router.refresh();
                  return { ok: true as const };
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {!gate.approved && (status === "NONE" || status === "REJECTED") ? (
        <div className="rounded-2xl border border-border bg-white p-4">
          <p className="font-semibold text-ink">{hipaaCopy.uploadLabel}</p>
          <p className="mt-1 text-sm text-muted">{hipaaCopy.uploadHint}</p>
          <label className="mt-4 block">
            <span className="sr-only">{hipaaCopy.uploadCta}</span>
            <input
              type="file"
              accept={hipaaCertificateAcceptAttribute()}
              disabled={pending}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-[10px] file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cream"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) uploadFile(file);
              }}
            />
          </label>
          {progress ? <p className="mt-2 text-sm text-navy">{progress}</p> : null}
          {error ? (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      {nextHref ? (
        <div className="flex justify-end">
          <Button asChild variant="secondary">
            <Link href={nextHref}>{hipaaCopy.nextItem} →</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
