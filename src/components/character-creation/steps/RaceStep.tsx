"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { RaceSelectCard } from "../RaceSelectCard";
import { STEP_DESCRIPTIONS, STEP_LABELS } from "../stepLabels";
import { wizardTheme } from "../wizardTheme";

import type { CharacterBuild } from "~/lib/character";
import { formatRacialAsiText, updateRace } from "~/lib/character";
import {
  buildRaceGroups,
  findRaceById,
  RACE_CATEGORY_LABELS,
} from "~/lib/character/raceGroups";
import { raceTable } from "~/lib/chronicle/chronicle";

type RaceStepProps = {
  build: CharacterBuild;
  onChange: (build: CharacterBuild) => void;
};

function RaceGroupAccordion({
  groupKey,
  title,
  optionCount,
  expanded,
  onToggle,
  children,
}: {
  groupKey: string;
  title: string;
  optionCount: number;
  expanded: boolean;
  onToggle: (groupKey: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-700/80 bg-black/40 shadow-sm">
      <button
        type="button"
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-stone-900/60"
        onClick={() => onToggle(groupKey)}
      >
        <span className="flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-[0.12em] text-stone-100">
            {title}
          </span>
          <span className="text-xs text-stone-500">
            {optionCount}{" "}
            {optionCount % 10 === 1 && optionCount % 100 !== 11
              ? "вариант"
              : optionCount % 10 >= 2 &&
                  optionCount % 10 <= 4 &&
                  (optionCount % 100 < 10 || optionCount % 100 >= 20)
                ? "варианта"
                : "вариантов"}
          </span>
        </span>
        <svg
          aria-hidden="true"
          className={[
            "h-5 w-5 shrink-0 text-stone-400 transition-transform",
            expanded ? "rotate-180" : "",
          ].join(" ")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {expanded ? (
        <div className="flex flex-col gap-2 border-t border-stone-700/80 bg-stone-950/40 p-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function RaceStep({ build, onChange }: RaceStepProps) {
  const raceGroups = useMemo(() => buildRaceGroups(raceTable), []);
  const selectedRace = useMemo(
    () => (build.raceId ? findRaceById(raceTable, build.raceId) : undefined),
    [build.raceId],
  );

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    () => {
      if (!build.raceId) {
        return {};
      }

      const selected = findRaceById(raceTable, build.raceId);
      const groupId =
        selected?.parentRace ??
        (raceGroups.groups.some((group) => group.parentId === build.raceId)
          ? build.raceId
          : undefined);

      return groupId ? { [groupId]: true } : {};
    },
  );

  const handleSelectRace = useCallback(
    (raceId: string) => {
      if (build.raceId === raceId) {
        return;
      }

      onChange(updateRace(build, raceId));
    },
    [build, onChange],
  );

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  }, []);

  const racialAsiText = build.raceId ? formatRacialAsiText(build.raceId) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className={wizardTheme.stepHeading}>{STEP_LABELS.race}</h2>
        <p className={wizardTheme.stepDescription}>{STEP_DESCRIPTIONS.race}</p>
      </div>

      {raceGroups.groups.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className={wizardTheme.sectionLabel}>
            Расы с подрасами и вариантами
          </h3>
          <div className="flex flex-col gap-3">
            {raceGroups.groups.map((group) => {
              const optionCount = group.subraces.length + 1;
              const expanded = expandedGroups[group.parentId] ?? false;

              return (
                <RaceGroupAccordion
                  key={group.parentId}
                  expanded={expanded}
                  groupKey={group.parentId}
                  optionCount={optionCount}
                  title={group.parent.name}
                  onToggle={toggleGroup}
                >
                  <RaceSelectCard
                    entry={group.parent}
                    selected={build.raceId === group.parent.id}
                    onSelect={handleSelectRace}
                  />
                  {group.subraces.map((subrace) => (
                    <RaceSelectCard
                      key={subrace.id}
                      entry={subrace}
                      selected={build.raceId === subrace.id}
                      onSelect={handleSelectRace}
                    />
                  ))}
                </RaceGroupAccordion>
              );
            })}
          </div>
        </section>
      ) : null}

      {raceGroups.standalone.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className={wizardTheme.sectionLabel}>Отдельные расы</h3>
          <ul className="flex flex-col gap-2">
            {raceGroups.standalone.map((entry) => (
              <li key={entry.id}>
                <RaceSelectCard
                  entry={entry}
                  selected={build.raceId === entry.id}
                  trailingIcon="chevron-right"
                  onSelect={handleSelectRace}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {selectedRace ? (
        <section className={wizardTheme.detailPanel}>
          <div className="flex flex-wrap items-center gap-2">
            <p className={wizardTheme.detailTitle}>{selectedRace.name}</p>
            <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-300">
              {RACE_CATEGORY_LABELS[selectedRace.category]}
            </span>
          </div>
          {selectedRace.general ? (
            <p className={wizardTheme.detailBody}>{selectedRace.general}</p>
          ) : null}
          {selectedRace.traits ? (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-300/80">
                Особенности
              </p>
              {racialAsiText ? (
                <p className="mt-2 text-sm leading-7 text-amber-100/90">
                  <span className="font-semibold text-amber-200">
                    Повышение характеристик:{" "}
                  </span>
                  {racialAsiText}
                </p>
              ) : null}
              <p className="mt-2 text-sm leading-7 text-stone-300">
                {selectedRace.traits}
              </p>
            </div>
          ) : racialAsiText ? (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-300/80">
                Особенности
              </p>
              <p className="mt-2 text-sm leading-7 text-amber-100/90">
                <span className="font-semibold text-amber-200">
                  Повышение характеристик:{" "}
                </span>
                {racialAsiText}
              </p>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
