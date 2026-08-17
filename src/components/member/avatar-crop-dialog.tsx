"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  AVATAR_MAX_BYTES,
  AVATAR_OUTPUT_SIZE,
  AVATAR_QUALITY,
} from "@/lib/member/avatar";

type AvatarCropDialogProps = {
  open: boolean;
  imageSrc: string | null;
  onCancel: () => void;
  onCropped: (file: File, previewUrl: string) => void;
};

async function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = url;
  });
}

async function getCroppedWebp(
  imageSrc: string,
  pixelCrop: Area,
): Promise<{ file: File; previewUrl: string }> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_OUTPUT_SIZE;
  canvas.height = AVATAR_OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not prepare the crop canvas.");
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    AVATAR_OUTPUT_SIZE,
    AVATAR_OUTPUT_SIZE,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error("Could not export the cropped photo."));
          return;
        }
        resolve(result);
      },
      "image/webp",
      AVATAR_QUALITY,
    );
  });

  if (blob.size > AVATAR_MAX_BYTES) {
    throw new Error(
      "Cropped photo is still over 1 MB. Try a clearer, smaller source photo.",
    );
  }

  const file = new File([blob], "avatar.webp", { type: "image/webp" });
  const previewUrl = URL.createObjectURL(blob);
  return { file, previewUrl };
}

function AvatarCropDialogInner({
  imageSrc,
  onCancel,
  onCropped,
}: {
  imageSrc: string;
  onCancel: () => void;
  onCropped: (file: File, previewUrl: string) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) {
      setError("Adjust the crop first, then confirm.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await getCroppedWebp(imageSrc, croppedAreaPixels);
      onCropped(result.file, result.previewUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not crop the photo. Try another image.",
      );
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-crop-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-navy/45 backdrop-blur-[2px]"
        aria-label="Close crop dialog"
        onClick={() => {
          if (!busy) onCancel();
        }}
      />
      <div className="relative z-10 flex max-h-[min(92dvh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.35rem] border border-border bg-cream shadow-[0_-18px_50px_rgba(47,56,38,0.22)] sm:mx-4 sm:rounded-[1.35rem]">
        <div className="border-b border-border/80 px-5 pt-5 pb-4">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-navy/45 uppercase">
            Profile photo
          </p>
          <h2
            id="avatar-crop-title"
            className="mt-1 font-display text-xl font-semibold text-ink"
          >
            Crop your photo
          </h2>
          <p className="mt-1 text-sm text-muted">
            Square crop lang. We save it as a clear WebP before upload.
          </p>
        </div>

        <div className="relative mx-5 mt-4 h-72 overflow-hidden rounded-2xl bg-navy/90">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="space-y-4 px-5 pt-4 pb-5">
          <label className="block">
            <span className="text-sm font-medium text-navy">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-2 w-full accent-navy"
              aria-label="Zoom photo"
            />
          </label>

          {error ? (
            <p
              className="rounded-xl bg-sand px-3.5 py-2.5 text-sm text-destructive"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="accent"
              disabled={busy}
              onClick={handleConfirm}
            >
              {busy ? "Preparing…" : "Use this crop"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AvatarCropDialog({
  open,
  imageSrc,
  onCancel,
  onCropped,
}: AvatarCropDialogProps) {
  if (!open || !imageSrc) return null;

  return (
    <AvatarCropDialogInner
      key={imageSrc}
      imageSrc={imageSrc}
      onCancel={onCancel}
      onCropped={onCropped}
    />
  );
}
