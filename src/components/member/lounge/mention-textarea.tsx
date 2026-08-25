"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { LoungeMentionCandidate } from "@/lib/member/lounge";

export function MentionTextarea({
  id,
  name,
  placeholder,
  defaultValue = "",
  candidates,
  rows = 3,
  className,
}: {
  id: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  candidates: LoungeMentionCandidate[];
  rows?: number;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const matches = useMemo(() => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    return candidates
      .filter((c) => c.full_name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [candidates, query]);

  useEffect(() => {
    setOpen(matches.length > 0 && query !== null);
  }, [matches.length, query]);

  function onChange(next: string) {
    setValue(next);
    const el = ref.current;
    if (!el) return;
    const cursor = el.selectionStart ?? next.length;
    const before = next.slice(0, cursor);
    const at = before.lastIndexOf("@");
    if (at === -1) {
      setQuery(null);
      return;
    }
    const fragment = before.slice(at + 1);
    if (fragment.includes("\n") || fragment.length > 40) {
      setQuery(null);
      return;
    }
    // Keep suggesting while typing a name (spaces allowed after first char)
    if (/^[A-Za-z][A-Za-z\s.'-]*$/.test(fragment) || fragment === "") {
      setQuery(fragment);
    } else {
      setQuery(null);
    }
  }

  function insertMention(person: LoungeMentionCandidate) {
    const el = ref.current;
    if (!el) return;
    const cursor = el.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);
    const at = before.lastIndexOf("@");
    if (at === -1) return;
    const next = `${before.slice(0, at)}@${person.full_name} ${after}`;
    setValue(next);
    setQuery(null);
    setOpen(false);
    requestAnimationFrame(() => {
      el.focus();
      const pos = at + person.full_name.length + 2;
      el.setSelectionRange(pos, pos);
    });
  }

  return (
    <div className="relative">
      <textarea
        ref={ref}
        id={id}
        name={name}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full resize-y rounded-[10px] border border-border bg-white px-3.5 py-3 text-sm text-ink placeholder:text-muted focus-visible:border-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal/25",
          className,
        )}
      />
      {open ? (
        <ul
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-border bg-white py-1 shadow-lg"
          role="listbox"
        >
          {matches.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                className="flex w-full cursor-pointer px-3 py-2 text-left text-sm text-ink hover:bg-sand"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertMention(person)}
              >
                @{person.full_name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
