"use client";

import {
  rerollSection,
  setSectionChoice,
  type Chronicle,
  type SectionKey,
} from "~/lib/chronicle";

import { RollBadge } from "./RollBadge";
import { describeOption, type SelectOption } from "./types";

export function SectionControl({
  title,
  section,
  value,
  options,
  chronicle,
  onChange,
  index,
  dice,
  roll,
  locked = false,
}: {
  title: string;
  section: SectionKey;
  value: string;
  options: SelectOption[];
  chronicle: Chronicle;
  onChange: (next: Chronicle) => void;
  index?: number;
  dice: string;
  roll: number;
  locked?: boolean;
}) {
  function choose(event: React.ChangeEvent<HTMLSelectElement>) {
    onChange(
      setSectionChoice(chronicle, section, event.currentTarget.value, index),
    );
  }

  return (
    <div
      className="rounded-2xl border border-amber-900/30 bg-stone-950/70 p-4 shadow-xl shadow-black/20"
      title={locked ? "Задано в wizard" : undefined}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-300/80">
            {title}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <RollBadge dice={dice} roll={roll} />
            <button
              className={
                locked
                  ? "cursor-not-allowed rounded-full border border-stone-600/40 px-3 py-1 text-xs font-semibold text-stone-500 opacity-60"
                  : "cursor-pointer rounded-full border border-amber-500/40 px-3 py-1 text-xs font-semibold text-amber-100 hover:border-amber-300 hover:bg-amber-300/10"
              }
              disabled={locked}
              type="button"
              onClick={() => onChange(rerollSection(chronicle, section, index))}
            >
              Перебросить
            </button>
          </div>
        </div>
        <select
          className={
            locked
              ? "w-full cursor-not-allowed rounded-xl border border-stone-700 bg-black/60 px-3 py-2 text-sm text-stone-400 opacity-70 outline-none"
              : "w-full cursor-pointer rounded-xl border border-stone-700 bg-black/60 px-3 py-2 text-sm text-stone-100 outline-none focus:border-amber-300"
          }
          disabled={locked}
          value={value}
          onChange={choose}
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {describeOption(option)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
