"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { US_STATES } from "@/lib/practice/constants";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  value: string;
  onChange: (state: string) => void;
  className?: string;
};

export function StateSearchSelect({ id, value, onChange, className }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...US_STATES];
    return US_STATES.filter(
      (st) =>
        st.toLowerCase().includes(q) ||
        st.toLowerCase().startsWith(q.slice(0, 2)),
    );
  }, [query]);

  const pick = (state: string) => {
    onChange(state);
    setQuery(state);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        autoComplete="off"
        placeholder="Search state…"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (US_STATES.includes(e.target.value as (typeof US_STATES)[number])) {
            onChange(e.target.value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && options.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-[10px] border border-border bg-white py-1 shadow-md"
        >
          {options.map((st) => (
            <li key={st} role="option" aria-selected={value === st}>
              <button
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-cream",
                  value === st && "bg-teal-bright/15 font-medium",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(st)}
              >
                {st}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
