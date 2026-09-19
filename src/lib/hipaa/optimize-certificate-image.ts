import { validateHipaaCertificateFile } from "@/lib/hipaa/storage";

const MAX_LONG_EDGE = 2560;
const WEBP_QUALITY = 0.92;

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export function isOptimizableImage(mimeType: string) {
  const normalized = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  return IMAGE_MIME.has(normalized);
}

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
  if (longEdge <= MAX_LONG_EDGE) {
    return { width, height };
  }
  const scale = MAX_LONG_EDGE / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function webpFileName(originalName: string) {
  const base = originalName.replace(/\.[^.]+$/, "") || "hipaa-certificate";
  return `${base}.webp`;
}

export async function optimizeCertificateImage(file: File): Promise<File> {
  const mimeType = file.type || "application/octet-stream";
  if (!isOptimizableImage(mimeType)) {
    return file;
  }

  const image = await loadImageFromFile(file);
  const { width, height } = scaledDimensions(image.naturalWidth, image.naturalHeight);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return file;
  }

  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), "image/webp", WEBP_QUALITY);
  });
  if (!blob) {
    return file;
  }

  if (blob.size >= file.size) {
    return file;
  }

  const optimized = new File([blob], webpFileName(file.name), {
    type: "image/webp",
  });
  const invalid = validateHipaaCertificateFile(optimized.type, optimized.size);
  if (invalid) {
    throw new Error(invalid);
  }
  return optimized;
}
