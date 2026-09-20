/** Client-side portfolio image compression — run in browser before upload. */

import {
  PORTFOLIO_IMAGE_MAX_BYTES,
  PORTFOLIO_IMAGE_MIME,
} from "@/lib/member/portfolio/storage";

/** Long edge cap — enough for retina on portfolio layout without huge files. */
export const PORTFOLIO_IMAGE_MAX_LONG_EDGE = 2048;
export const PORTFOLIO_IMAGE_WEBP_QUALITY = 0.92;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image."));
    };
    image.src = url;
  });
}

function scaledDimensions(width: number, height: number) {
  const longEdge = Math.max(width, height);
  if (longEdge <= PORTFOLIO_IMAGE_MAX_LONG_EDGE) {
    return { width, height };
  }
  const scale = PORTFOLIO_IMAGE_MAX_LONG_EDGE / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function portfolioWebpFileName(originalName: string) {
  const base = originalName.replace(/\.[^.]+$/, "") || "portfolio-image";
  return `${base}.webp`;
}

export function isPortfolioOptimizableImage(mimeType: string) {
  const normalized = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  return PORTFOLIO_IMAGE_MIME.includes(
    normalized as (typeof PORTFOLIO_IMAGE_MIME)[number],
  );
}

/**
 * Resize (if needed) and encode as WebP at high quality. Falls back to the
 * original file when optimization fails or would increase size.
 */
export async function optimizePortfolioImage(file: File): Promise<File> {
  if (!isPortfolioOptimizableImage(file.type)) {
    return file;
  }

  let image: HTMLImageElement;
  try {
    image = await loadImageFromFile(file);
  } catch {
    return file;
  }

  const { width, height } = scaledDimensions(
    image.naturalWidth,
    image.naturalHeight,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (result) => resolve(result),
      "image/webp",
      PORTFOLIO_IMAGE_WEBP_QUALITY,
    );
  });
  if (!blob) return file;

  if (blob.size >= file.size && file.type === "image/webp") {
    return file;
  }
  if (blob.size >= file.size * 1.05) {
    return file;
  }

  const optimized = new File([blob], portfolioWebpFileName(file.name), {
    type: "image/webp",
  });

  if (optimized.size > PORTFOLIO_IMAGE_MAX_BYTES) {
    const smaller = await encodeWithQuality(image, width, height, 0.85);
    if (smaller && smaller.size <= PORTFOLIO_IMAGE_MAX_BYTES) {
      return smaller;
    }
    throw new Error("Photo is too large after optimization. Try a smaller image.");
  }

  return optimized;
}

async function encodeWithQuality(
  image: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
): Promise<File | null> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/webp", quality);
  });
  if (!blob) return null;
  return new File([blob], "portfolio-image.webp", { type: "image/webp" });
}
