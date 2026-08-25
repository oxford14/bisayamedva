"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import {
  createLoungePost,
  type LoungeActionState,
} from "@/app/(member)/member/lounge-actions";
import { MentionTextarea } from "@/components/member/lounge/mention-textarea";
import { MemberCard } from "@/components/member/ui";
import { Button } from "@/components/ui/button";
import type { LoungeMentionCandidate } from "@/lib/member/lounge";

const initial: LoungeActionState = { ok: false, message: "" };

export function LoungeComposer({
  candidates,
}: {
  candidates: LoungeMentionCandidate[];
}) {
  const [state, action, pending] = useActionState(createLoungePost, initial);
  const [preview, setPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setPreview(null);
    }
  }, [state]);

  return (
    <MemberCard>
      <p className="text-[11px] font-semibold tracking-[0.16em] text-navy/50 uppercase">
        Share sa Lounge
      </p>
      <h2 className="mt-1 font-display text-xl font-semibold text-ink">
        Unsa imong question or success story?
      </h2>
      <form ref={formRef} action={action} className="mt-4 space-y-3">
        <MentionTextarea
          id="lounge-body"
          name="body"
          rows={4}
          candidates={candidates}
          placeholder="Type here… Use @Name to mention a co-student."
        />
        <input
          ref={fileRef}
          type="file"
          name="image"
          accept="image/webp,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) {
              setPreview(null);
              return;
            }
            setPreview(URL.createObjectURL(file));
          }}
        />
        {preview ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Attachment preview"
              className="max-h-64 w-full object-cover"
            />
            <button
              type="button"
              className="absolute top-2 right-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-navy/80 text-cream"
              aria-label="Remove photo"
              onClick={() => {
                setPreview(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus className="size-4" aria-hidden />
            Add photo
          </Button>
          <Button type="submit" variant="accent" disabled={pending} className="ml-auto">
            {pending ? "Posting…" : "Post"}
          </Button>
        </div>
        {state.message ? (
          <p
            className={`text-sm ${state.ok ? "text-navy" : "text-destructive"}`}
            role="status"
          >
            {state.message}
          </p>
        ) : null}
      </form>
    </MemberCard>
  );
}
