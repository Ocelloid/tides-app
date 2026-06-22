"use client";

import type { RaceEntry } from "~/lib/chronicle/chronicle";
import { RACE_CATEGORY_LABELS } from "~/lib/character/raceGroups";

import { wizardTheme } from "./wizardTheme";

type RaceSelectCardProps = {
  entry: RaceEntry;
  selected: boolean;
  onSelect: (raceId: string) => void;
  trailingIcon?: "chevron-right" | "chevron-down" | "none";
};

function ChevronIcon({ direction }: { direction: "right" | "down" }) {
  const path =
    direction === "down" ? "M6 9l6 6 6-6" : "M9 5l7 7-7 7";

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0 text-stone-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RaceCategoryBadge({ entry }: { entry: RaceEntry }) {
  const label = RACE_CATEGORY_LABELS[entry.category];

  if (entry.category === "supernatural-gift") {
    return (
      <span className="inline-flex items-center gap-1">
        <span className="rounded-full bg-violet-900/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
          {label}
        </span>
        <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-300">
          Legacy
        </span>
      </span>
    );
  }

  return (
    <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-300">
      {label}
    </span>
  );
}

export function RaceSelectCard({
  entry,
  selected,
  onSelect,
  trailingIcon = "none",
}: RaceSelectCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[
        wizardTheme.selectCard.base,
        "justify-between py-2",
        selected ? wizardTheme.selectCard.selected : wizardTheme.selectCard.unselected,
      ].join(" ")}
      onClick={() => onSelect(entry.id)}
    >
      <span className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="truncate text-sm font-semibold text-stone-100">
          {entry.name}
        </span>
        <RaceCategoryBadge entry={entry} />
      </span>

      {trailingIcon === "none" ? null : (
        <ChevronIcon direction={trailingIcon === "chevron-down" ? "down" : "right"} />
      )}
    </button>
  );
}
