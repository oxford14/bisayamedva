"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteModuleQuestion,
  upsertModuleQuestion,
} from "@/app/(admin)/admin/modules-actions";
import { Field } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminQuizQuestion = {
  id: string;
  prompt: string;
  options: { id: string; label: string; isCorrect: boolean }[];
};

export function ModuleQuizEditor({
  moduleId,
  questions,
}: {
  moduleId: string;
  questions: AdminQuizQuestion[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      {questions.length === 0 ? (
        <p className="text-sm text-muted">No questions yet. Add a multiple-choice item below.</p>
      ) : (
        <ul className="space-y-3">
          {questions.map((question, index) => (
            <li
              key={question.id}
              className="rounded-xl border border-border bg-cream/40 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-ink">
                  {index + 1}. {question.prompt}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    const formData = new FormData();
                    formData.set("id", question.id);
                    formData.set("module_id", moduleId);
                    startTransition(async () => {
                      const result = await deleteModuleQuestion(formData);
                      if (!result.ok) {
                        setError(result.error);
                        return;
                      }
                      router.refresh();
                    });
                  }}
                >
                  Delete
                </Button>
              </div>
              <ul className="mt-2 space-y-1">
                {question.options.map((option) => (
                  <li key={option.id} className="text-sm text-muted">
                    {option.isCorrect ? (
                      <span className="font-semibold text-navy">Correct · </span>
                    ) : null}
                    {option.label}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      <form
        className="space-y-3 rounded-xl border border-dashed border-border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);
          setError("");
          startTransition(async () => {
            const result = await upsertModuleQuestion(formData);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            form.reset();
            router.refresh();
          });
        }}
      >
        <input type="hidden" name="module_id" value={moduleId} />
        <h3 className="text-sm font-semibold text-ink">Add question</h3>
        <Field label="Question" htmlFor="prompt">
          <Input
            id="prompt"
            name="prompt"
            required
            placeholder="Unsa ang first step sa eligibility check?"
          />
        </Field>
        {[0, 1, 2, 3].map((index) => (
          <label
            key={index}
            className="flex items-center gap-3 rounded-[10px] border border-border bg-white px-3 py-2"
          >
            <input
              type="radio"
              name="correct_index"
              value={String(index)}
              defaultChecked={index === 0}
              className="size-4 accent-[var(--navy,#5b6d49)]"
            />
            <Input
              name={`option_${index}`}
              required={index < 2}
              placeholder={index < 2 ? `Option ${index + 1}` : `Option ${index + 1} (optional)`}
              className="h-10 border-0 shadow-none focus-visible:ring-0"
            />
          </label>
        ))}
        <p className="text-xs text-muted">
          At least two options. The selected radio is the correct answer.
        </p>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Saving..." : "Add question"}
        </Button>
      </form>
    </div>
  );
}
