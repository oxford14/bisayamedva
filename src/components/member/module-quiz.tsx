"use client";

import { useState, useTransition } from "react";
import { submitModuleQuiz } from "@/app/(member)/member/modules-actions";
import { modulesCopy } from "@/content/site";
import { Button } from "@/components/ui/button";
import type { StudentQuizAttempt, StudentQuizQuestion } from "@/lib/member/modules";

export function ModuleQuiz({
  moduleId,
  questions,
  latestAttempt,
}: {
  moduleId: string;
  questions: StudentQuizQuestion[];
  latestAttempt: StudentQuizAttempt | null;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<StudentQuizAttempt | null>(latestAttempt);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [retaking, setRetaking] = useState(!latestAttempt);

  if (questions.length === 0) {
    return <p className="text-sm text-muted">{modulesCopy.noQuiz}</p>;
  }

  const showForm = retaking || !result;

  return (
    <div className="space-y-5">
      {result ? (
        <p className="rounded-xl bg-teal-bright/20 px-4 py-3 text-sm font-medium text-navy">
          {modulesCopy.quizScore}: {result.score}/{result.total}
        </p>
      ) : null}

      {showForm ? (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
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
              });
              setRetaking(false);
            });
          }}
        >
          {questions.map((question, index) => (
            <fieldset key={question.id} className="space-y-2">
              <legend className="text-sm font-semibold text-ink">
                {index + 1}. {question.prompt}
              </legend>
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
          ))}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="accent" disabled={pending}>
            {pending ? "Checking…" : modulesCopy.quizSubmit}
          </Button>
        </form>
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setAnswers({});
            setRetaking(true);
          }}
        >
          {modulesCopy.quizRetake}
        </Button>
      )}
    </div>
  );
}
