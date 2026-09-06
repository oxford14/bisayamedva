"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitModuleQuiz } from "@/app/(member)/member/modules-actions";
import { modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import { quizPassed } from "@/lib/member/module-player-shared";
import type { StudentQuizAttempt, StudentQuizQuestion } from "@/lib/member/modules";

export function ModuleQuiz({
  moduleId,
  questions,
  latestAttempt,
  nextHref,
}: {
  moduleId: string;
  questions: StudentQuizQuestion[];
  latestAttempt: StudentQuizAttempt | null;
  nextHref?: string | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<StudentQuizAttempt | null>(latestAttempt);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [retaking, setRetaking] = useState(!latestAttempt);
  const [continueHref, setContinueHref] = useState<string | null>(nextHref ?? null);

  if (questions.length === 0) {
    return <p className="text-sm text-muted">{modulesCopy.noQuiz}</p>;
  }

  const passed = result ? quizPassed(result.score, result.total) : false;
  const showForm = retaking || !result;
  const last = step >= questions.length - 1;
  const question = questions[step];
  const answered = Boolean(answers[question.id]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">{modulesCopy.quizGrade}</p>
      <p className="text-sm text-muted">{modulesCopy.quizNeedPass}</p>
      {result ? (
        <p className="rounded-xl bg-teal-bright/20 px-4 py-3 text-sm font-medium text-navy">
          {modulesCopy.quizScore}: {result.score}/{result.total}
          {passed ? "" : ` · ${modulesCopy.quizNeedPass}`}
        </p>
      ) : null}

      {showForm ? (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!answered) return;
            if (!last) {
              setStep((current) => current + 1);
              return;
            }
            setError("");
            startTransition(async () => {
              const submitted = await submitModuleQuiz(moduleId, answers);
              if (!submitted.ok) {
                setError(submitted.error);
                return;
              }
              setResult({
                score: submitted.score,
                total: submitted.total,
                submittedAt: new Date().toISOString(),
                review: submitted.review,
              });
              setContinueHref(submitted.nextHref);
              setRetaking(false);
            });
          }}
        >
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-ink">
              {modulesCopy.quizQuestionOf
                .replace("{n}", String(step + 1))
                .replace("{total}", String(questions.length))}
            </legend>
            <p className="text-sm font-semibold text-ink">{question.prompt}</p>
            <div className="space-y-2">
              {question.options.map((option) => (
                <label
                  key={option.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-cream/50 px-3 py-2.5 text-sm has-[:checked]:border-navy has-[:checked]:bg-white"
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={option.id}
                    checked={answers[question.id] === option.id}
                    onChange={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: option.id,
                      }))
                    }
                    className="size-4 accent-[var(--navy,#5b6d49)]"
                    required
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="accent" disabled={pending || !answered}>
            {pending
              ? "Checking…"
              : last
                ? modulesCopy.quizSubmit
                : modulesCopy.quizNext}
          </Button>
        </form>
      ) : (
        <div className="space-y-5">
          {result.review.length > 0 ? (
            <ol className="space-y-3">
              {result.review.map((item, index) => (
                <li
                  key={item.questionId}
                  className="rounded-xl border border-border bg-cream/50 px-4 py-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    {modulesCopy.quizQuestionOf
                      .replace("{n}", String(index + 1))
                      .replace("{total}", String(result.review.length))}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{item.prompt}</p>
                  <p className="mt-2 text-sm text-ink">
                    {modulesCopy.quizYourAnswer}: {item.yourAnswer || modulesCopy.quizNoAnswer}{" "}
                    <span
                      className={
                        item.correct
                          ? "font-semibold text-navy"
                          : "font-semibold text-destructive"
                      }
                    >
                      · {item.correct ? modulesCopy.quizCorrect : modulesCopy.quizIncorrect}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-ink">
                    {modulesCopy.quizCorrectAnswer}: {item.correctAnswer}
                  </p>
                  {!item.correct && item.explanation ? (
                    <p className="mt-2 text-sm text-muted">
                      {modulesCopy.quizExplanation}: {item.explanation}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAnswers({});
                setStep(0);
                setRetaking(true);
              }}
            >
              {modulesCopy.quizRetake}
            </Button>
            {passed && continueHref ? (
              <Button
                type="button"
                variant="accent"
                onClick={() => router.push(continueHref)}
              >
                {modulesCopy.nextItem} →
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
