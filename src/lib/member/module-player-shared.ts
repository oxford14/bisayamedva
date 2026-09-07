export const QUIZ_PASS_RATIO = 0.7;

export type PlayerItemKind = "FILE" | "QUIZ";
export type PlayerItemLabel = "Reading" | "Video" | "Quiz";

export type PlayerOutlineItem = {
  key: string;
  kind: PlayerItemKind;
  moduleId: string;
  itemId: string;
  title: string;
  label: PlayerItemLabel;
  complete: boolean;
  locked: boolean;
  href: string;
};

export type PlayerOutlineModule = {
  id: string;
  title: string;
  description: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  locked: boolean;
  items: PlayerOutlineItem[];
};

export function fileItemKey(fileId: string) {
  return `file-${fileId}`;
}

export function quizItemKey() {
  return "quiz";
}

export function parseItemKey(
  key: string,
): { kind: "FILE"; id: string } | { kind: "QUIZ" } | null {
  if (key === "quiz") return { kind: "QUIZ" };
  if (key.startsWith("file-")) {
    const id = key.slice(5);
    return id ? { kind: "FILE", id } : null;
  }
  return null;
}

export function itemHref(slug: string, moduleId: string, key: string) {
  return `/member/modules/${slug}/${moduleId}/${key}`;
}

export function quizPassed(score: number, total: number) {
  if (total <= 0) return false;
  return score / total >= QUIZ_PASS_RATIO;
}

const UUID_PREFIX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i;

export function displayFileName(fileName: string) {
  const base = fileName.split(/[/\\]/).pop()?.trim() || "lesson";
  return base.replace(UUID_PREFIX, "") || "lesson";
}

export function fileTitle(fileName: string) {
  const clean = displayFileName(fileName).replace(/\.[^.]+$/, "");
  return clean.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim() || "Lesson file";
}

export function moduleFileHref(fileId: string, download = false) {
  return download
    ? `/member/modules/file/${fileId}?download=1`
    : `/member/modules/file/${fileId}`;
}
