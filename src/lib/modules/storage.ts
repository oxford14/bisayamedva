export const MODULE_FILES_BUCKET = "course-modules";
export const MODULE_FILE_SIGNED_TTL_SECONDS = 60 * 60;
export const MODULE_VIDEO_MAX_BYTES = 104_857_600;
export const MODULE_DOC_MAX_BYTES = 20_971_520;

const VIDEO_MIME = new Set(["video/mp4", "video/webm"]);

const ALLOWED_MIME = new Map<string, number>([
  ["application/pdf", MODULE_DOC_MAX_BYTES],
  ["video/mp4", MODULE_VIDEO_MAX_BYTES],
  ["video/webm", MODULE_VIDEO_MAX_BYTES],
  ["application/msword", MODULE_DOC_MAX_BYTES],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    MODULE_DOC_MAX_BYTES,
  ],
  ["application/vnd.ms-powerpoint", MODULE_DOC_MAX_BYTES],
  [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    MODULE_DOC_MAX_BYTES,
  ],
  ["application/vnd.ms-excel", MODULE_DOC_MAX_BYTES],
  [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    MODULE_DOC_MAX_BYTES,
  ],
  ["text/plain", MODULE_DOC_MAX_BYTES],
  ["image/jpeg", MODULE_DOC_MAX_BYTES],
  ["image/png", MODULE_DOC_MAX_BYTES],
  ["image/webp", MODULE_DOC_MAX_BYTES],
]);

const EXT_MIME: Record<string, string> = {
  pdf: "application/pdf",
  mp4: "video/mp4",
  webm: "video/webm",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function isVideoMime(mime: string) {
  return VIDEO_MIME.has(mime);
}

export function inferModuleMimeType(fileName: string, mimeType: string) {
  if (mimeType && ALLOWED_MIME.has(mimeType)) return mimeType;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MIME[ext] ?? mimeType;
}

export function allowedMaxBytes(mime: string) {
  return ALLOWED_MIME.get(mime) ?? null;
}

export function validateModuleFile(mimeType: string, byteSize: number) {
  const max = allowedMaxBytes(mimeType);
  if (!max) {
    return "That file type is not allowed. Upload a PDF, video (MP4/WebM), or a common document.";
  }
  if (byteSize <= 0) return "The file is empty.";
  if (byteSize > max) {
    const mb = Math.round(max / (1024 * 1024));
    return isVideoMime(mimeType)
      ? `Video must be ${mb} MB or smaller.`
      : `File must be ${mb} MB or smaller.`;
  }
  return null;
}

export function sanitizeModuleFileName(name: string) {
  const base = name.split(/[/\\]/).pop()?.trim() || "file";
  return base.replace(/[^\w.\- ()]+/g, "_").slice(0, 120);
}

export function moduleObjectPath(
  courseId: string,
  moduleId: string,
  fileName: string,
) {
  const safe = sanitizeModuleFileName(fileName);
  return `${courseId}/${moduleId}/${crypto.randomUUID()}-${safe}`;
}

export function formatByteSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
