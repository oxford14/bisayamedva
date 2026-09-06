export type QuizReviewSourceQuestion = {
  id: string;
  prompt: string;
  explanation: string | null;
  options: { id: string; label: string; is_correct: boolean }[];
};

export type StudentQuizReviewItem = {
  questionId: string;
  prompt: string;
  yourAnswer: string;
  correctAnswer: string;
  correct: boolean;
  explanation: string | null;
};

export function parseQuizAnswers(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(value)) {
    if (typeof val === "string" && val) out[key] = val;
  }
  return out;
}

export function buildQuizReview(
  questions: QuizReviewSourceQuestion[],
  answers: Record<string, string>,
): StudentQuizReviewItem[] {
  return questions.map((question) => {
    const selectedId = answers[question.id] ?? "";
    const selected = question.options.find((option) => option.id === selectedId);
    const correctOption = question.options.find((option) => option.is_correct);
    const explanation = question.explanation?.trim() || null;
    return {
      questionId: question.id,
      prompt: question.prompt,
      yourAnswer: selected?.label ?? "",
      correctAnswer: correctOption?.label ?? "",
      correct: Boolean(correctOption && selectedId === correctOption.id),
      explanation,
    };
  });
}

export function toStudentQuizAttempt(
  latest: {
    score: number;
    total: number;
    submitted_at: string;
    answers?: unknown;
  },
  questions: QuizReviewSourceQuestion[],
) {
  return {
    score: Number(latest.score),
    total: Number(latest.total),
    submittedAt: latest.submitted_at,
    review: buildQuizReview(questions, parseQuizAnswers(latest.answers)),
  };
}

export function mapQuizReviewQuestions(
  rows:
    | {
        id: string;
        prompt: string;
        explanation?: string | null;
        sort_order?: number;
        course_module_quiz_options:
          | {
              id: string;
              label: string;
              is_correct: boolean;
              sort_order?: number;
            }[]
          | null;
      }[]
    | null
    | undefined,
): QuizReviewSourceQuestion[] {
  return (rows ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((row) => ({
      id: row.id,
      prompt: row.prompt,
      explanation: row.explanation ?? null,
      options: (row.course_module_quiz_options ?? [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((option) => ({
          id: option.id,
          label: option.label,
          is_correct: option.is_correct,
        })),
    }));
}
