"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteModuleQuestion,
  upsertModuleQuestion,
} from "@/app/(admin)/admin/modules-actions";
import { Field } from "@/components/forms/field";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminQuizQuestion = {
  id: string;
  prompt: string;
  explanation: string | null;
  options: { id: string; label: string; isCorrect: boolean }[];
};

function truncatePrompt(prompt: string) {
  const trimmed = prompt.trim();
  if (trimmed.length <= 80) return trimmed;
  return `${trimmed.slice(0, 80)}…`;
}

function QuestionFields({
  moduleId,
  question,
  promptRef,
  error,
}: {
  moduleId: string;
  question?: AdminQuizQuestion;
  promptRef?: React.Ref<HTMLInputElement>;
  error?: string;
}) {
  const fieldId = question?.id ?? "new";
  const padded = [0, 1, 2, 3].map((index) => question?.options[index] ?? null);
  const correctIndex = Math.max(
    0,
    padded.findIndex((option) => option?.isCorrect),
  );

  return (
    <div className="space-y-3">
      <input type="hidden" name="module_id" value={moduleId} />
      {question ? <input type="hidden" name="id" value={question.id} /> : null}
      <Field label="Question" htmlFor={`prompt-${fieldId}`}>
        <Input
          ref={promptRef}
          id={`prompt-${fieldId}`}
          name="prompt"
          required
          defaultValue={question?.prompt ?? ""}
          placeholder="Unsa ang first step sa eligibility check?"
        />
      </Field>
      {padded.map((option, index) => (
        <label
          key={`${fieldId}-${option?.id ?? index}`}
          className="flex items-center gap-3 rounded-[10px] border border-border bg-white px-3 py-2"
        >
          <input
            type="radio"
            name="correct_index"
            value={String(index)}
            defaultChecked={index === correctIndex}
            className="size-4 accent-[var(--navy,#5b6d49)]"
          />
          <Input
            name={`option_${index}`}
            required={index < 2}
            defaultValue={option?.label ?? ""}
            placeholder={
              index < 2 ? `Option ${index + 1}` : `Option ${index + 1} (optional)`
            }
            className="h-10 border-0 shadow-none focus-visible:ring-0"
          />
        </label>
      ))}
      <p className="text-xs text-muted">
        At least two options. The selected radio is the correct answer.
      </p>
      <Field
        label="Explanation"
        htmlFor={`explanation-${fieldId}`}
        hint="Optional. Shown if the student gets this wrong."
      >
        <textarea
          id={`explanation-${fieldId}`}
          name="explanation"
          rows={3}
          maxLength={1000}
          defaultValue={question?.explanation ?? ""}
          placeholder="Shown if the student gets this wrong."
          className="flex min-h-24 w-full rounded-[10px] border border-border bg-white px-3.5 py-3 text-base text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-colors placeholder:text-muted/70 focus-visible:border-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/25"
        />
      </Field>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function ModuleQuizEditor({
  moduleId,
  questions,
}: {
  moduleId: string;
  questions: AdminQuizQuestion[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [errorAt, setErrorAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [formKey, setFormKey] = useState(0);
  const [focusAdd, setFocusAdd] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const addPromptRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!focusAdd) return;
    addPromptRef.current?.focus();
    setFocusAdd(false);
  }, [focusAdd, formKey]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function saveQuestion(form: HTMLFormElement, source: string) {
    const formData = new FormData(form);
    setError("");
    setErrorAt(source);
    startTransition(async () => {
      const result = await upsertModuleQuestion(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError("");
      setErrorAt(null);
      setToast(source === "new" ? "Question saved." : "Question updated.");
      if (source === "new") {
        setOpenItems([]);
        setFormKey((key) => key + 1);
        setFocusAdd(true);
      }
      router.refresh();
    });
  }

  function removeQuestion(questionId: string) {
    const formData = new FormData();
    formData.set("id", questionId);
    formData.set("module_id", moduleId);
    setError("");
    setErrorAt(questionId);
    startTransition(async () => {
      const result = await deleteModuleQuestion(formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpenItems((items) => items.filter((item) => item !== questionId));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 z-[55] max-w-sm rounded-xl border border-navy/10 bg-navy px-4 py-3 text-sm font-medium text-cream shadow-[0_12px_28px_rgba(69,83,56,0.22)] bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:right-6 lg:bottom-6"
        >
          {toast}
        </div>
      ) : null}
      {questions.length === 0 ? (
        <p className="text-sm text-muted">
          No questions yet. Add a multiple-choice item below.
        </p>
      ) : (
        <Accordion
          type="multiple"
          value={openItems}
          onValueChange={setOpenItems}
          className="overflow-hidden rounded-xl border border-border bg-cream/40"
        >
          {questions.map((question, index) => (
            <AccordionItem
              key={question.id}
              value={question.id}
              className="border-border px-4 last:border-b-0"
            >
              <AccordionTrigger className="py-3 text-sm font-medium text-ink hover:text-navy">
                <span className="truncate">
                  {index + 1}. {truncatePrompt(question.prompt)}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pr-0 text-ink">
                <form
                  className="space-y-3 pb-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveQuestion(event.currentTarget, question.id);
                  }}
                >
                  <QuestionFields
                    moduleId={moduleId}
                    question={question}
                    error={errorAt === question.id ? error : undefined}
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="accent" disabled={pending}>
                      {pending && errorAt === question.id
                        ? "Saving..."
                        : "Save question"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={() => removeQuestion(question.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </form>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <form
        key={formKey}
        className="space-y-3 rounded-xl border border-dashed border-border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          saveQuestion(event.currentTarget, "new");
        }}
      >
        <h3 className="text-sm font-semibold text-ink">Add question</h3>
        <QuestionFields
          moduleId={moduleId}
          promptRef={addPromptRef}
          error={errorAt === "new" ? error : undefined}
        />
        <Button type="submit" variant="accent" disabled={pending}>
          {pending && errorAt === "new" ? "Saving..." : "Save question"}
        </Button>
      </form>
    </div>
  );
}
