"use client";

import { useCallback, useEffect, useState } from "react";

import type { Chronicle } from "~/lib/chronicle";
import {
  formatNamePlaceholder,
  rollRaceName,
} from "~/lib/chronicle/raceNames";

export function CharacterNameControl({
  chronicle,
  value,
  exampleName = "",
  onChange,
  onExampleChange,
}: {
  chronicle: Chronicle;
  value: string;
  exampleName?: string;
  onChange: (name: string) => void;
  onExampleChange?: (example: string) => void;
}) {
  const [nameExample, setNameExample] = useState("");

  const rollName = useCallback(
    () => rollRaceName(chronicle.race.entry.id, chronicle.gender.entry.id),
    [chronicle.gender.entry.id, chronicle.race.entry.id],
  );

  useEffect(() => {
    const importedExample = exampleName.trim();
    if (importedExample) {
      setNameExample(importedExample);
      return;
    }

    const example = rollName();
    setNameExample(example);
    onExampleChange?.(example);
  }, [exampleName, onExampleChange, rollName]);

  function handleReroll() {
    const nextName = rollName();
    setNameExample(nextName);
    onExampleChange?.(nextName);
    onChange(nextName);
  }

  return (
    <div className="rounded-2xl border border-amber-900/30 bg-stone-950/70 p-4 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300/80">
            Имя персонажа
          </p>
          <button
            aria-label="Сгенерировать имя"
            className="cursor-pointer rounded-full border border-amber-500/40 p-2 text-amber-100 hover:border-amber-300 hover:bg-amber-300/10"
            type="button"
            onClick={handleReroll}
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              viewBox="0 0 24 24"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 16h5v5" />
            </svg>
          </button>
        </div>
        <input
          className="w-full rounded-xl border border-stone-700 bg-black/60 px-3 py-2 text-sm text-stone-100 outline-none placeholder:text-stone-500 focus:border-amber-300"
          placeholder={
            nameExample ? formatNamePlaceholder(nameExample) : "Например: …"
          }
          type="text"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <p className="text-xs text-stone-400">
          Используется в PDF-листе персонажа.
        </p>
      </div>
    </div>
  );
}
