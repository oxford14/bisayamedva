import { quizPassed } from "@/lib/member/module-player-shared";

export type CompletionRow = {
  item_kind: string;
  item_id: string;
  completed_at?: string;
};

export type AttemptRow = {
  module_id: string;
  score: number;
  total: number;
  submitted_at?: string;
};

export function buildDoneItemKeys(
  completions: CompletionRow[],
  attempts: AttemptRow[],
): Set<string> {
  const done = new Set(
    completions.map((row) => `${row.item_kind}:${row.item_id}`),
  );
  for (const attempt of attempts) {
    if (quizPassed(Number(attempt.score), Number(attempt.total))) {
      done.add(`QUIZ:${attempt.module_id}`);
    }
  }
  return done;
}

export type ItemProgressStatus = "complete" | "in_progress" | "not_started";

export function moduleStatusForKeys(
  requiredKeys: string[],
  done: Set<string>,
): ItemProgressStatus {
  if (requiredKeys.length === 0) return "not_started";
  const doneCount = requiredKeys.filter((key) => done.has(key)).length;
  if (doneCount === 0) return "not_started";
  if (doneCount === requiredKeys.length) return "complete";
  return "in_progress";
}
