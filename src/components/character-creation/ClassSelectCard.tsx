"use client";

import type { ClassEntry } from "~/lib/chronicle";

import { wizardTheme } from "./wizardTheme";

type ClassSelectCardProps = {
  entry: ClassEntry;
  selected: boolean;
  onSelect: () => void;
};

const CLASS_ICON: Record<string, string> = {
  barbarian: "⚔️",
  bard: "🎵",
  cleric: "✨",
  druid: "🌿",
  fighter: "🛡️",
  monk: "👊",
  paladin: "⚜️",
  ranger: "🏹",
  rogue: "🗡️",
  sorcerer: "🔥",
  warlock: "👁️",
  wizard: "📜",
};

export function ClassSelectCard({
  entry,
  selected,
  onSelect,
}: ClassSelectCardProps) {
  const icon = CLASS_ICON[entry.id] ?? "🎲";

  return (
    <button
      aria-pressed={selected}
      className={[
        wizardTheme.selectCard.base,
        selected ? wizardTheme.selectCard.selected : wizardTheme.selectCard.unselected,
      ].join(" ")}
      type="button"
      onClick={onSelect}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-800/80 text-lg"
      >
        {icon}
      </span>
      <span className="min-w-0 truncate text-sm font-semibold text-stone-100">
        {entry.name}
      </span>
    </button>
  );
}
