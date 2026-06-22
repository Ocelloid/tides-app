"use client";

import {
  formatSkillLabel,
  type SkillName,
} from "~/lib/character/skillProficiencies";

import { wizardTheme } from "./wizardTheme";

type SkillSelectGridProps = {
  options: SkillName[];
  selected: SkillName[];
  pickCount: number;
  onChange: (selected: SkillName[]) => void;
  disabled?: boolean;
};

export function SkillSelectGrid({
  options,
  selected,
  pickCount,
  onChange,
  disabled = false,
}: SkillSelectGridProps) {
  const selectedSet = new Set(selected);

  function toggleSkill(skill: SkillName) {
    if (disabled) {
      return;
    }

    if (selectedSet.has(skill)) {
      if (selected.length <= pickCount && selected.length === options.length) {
        return;
      }

      onChange(selected.filter((entry) => entry !== skill));
      return;
    }

    if (selected.length >= pickCount) {
      onChange([...selected.slice(1), skill]);
      return;
    }

    onChange([...selected, skill]);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-stone-400">
        Выбрано {selected.length} из {pickCount}
      </p>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((skill) => {
          const isSelected = selectedSet.has(skill);

          return (
            <li key={skill}>
              <button
                aria-pressed={isSelected}
                className={[
                  wizardTheme.selectCard.base,
                  "justify-between py-2.5",
                  isSelected
                    ? wizardTheme.selectCard.selected
                    : wizardTheme.selectCard.unselected,
                  disabled ? "cursor-default opacity-80" : "",
                ].join(" ")}
                disabled={disabled}
                type="button"
                onClick={() => toggleSkill(skill)}
              >
                <span className="text-sm font-medium text-stone-100">
                  {formatSkillLabel(skill)}
                </span>
                {isSelected ? (
                  <span className="text-xs font-semibold text-amber-300">✓</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
