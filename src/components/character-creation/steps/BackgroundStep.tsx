"use client";

import { Chip } from "@heroui/react";
import { useCallback, useMemo } from "react";

import {
  type CharacterBuild,
  getBackgroundSkillOptions,
  getBackgroundSkillPickCount,
  updateBackground,
  updateBackgroundSkillChoices,
} from "~/lib/character";
import {
  backgrounds,
  type Background,
} from "~/lib/chronicle/chronicle";

import { STEP_DESCRIPTIONS, STEP_LABELS } from "../stepLabels";
import { SkillSelectGrid } from "../SkillSelectGrid";
import { wizardTheme } from "../wizardTheme";

type BackgroundStepProps = {
  build: CharacterBuild;
  onChange: (build: CharacterBuild) => void;
};

const BOOK_SECTION_LABELS: Record<string, string> = {
  КИ: "Книга игрока",
  РИД: "Руководство по Wildemount",
};

const BOOK_ORDER = ["КИ", "РИД"] as const;

function groupBackgroundsByBook(items: readonly Background[]) {
  const byBook = new Map<string, Background[]>();

  for (const background of items) {
    const group = byBook.get(background.book) ?? [];
    group.push(background);
    byBook.set(background.book, group);
  }

  return BOOK_ORDER.filter((book) => byBook.has(book)).map((book) => ({
    book,
    label: BOOK_SECTION_LABELS[book] ?? book,
    items: byBook.get(book) ?? [],
  }));
}

type BackgroundCardProps = {
  background: Background;
  isSelected: boolean;
  onSelect: (backgroundId: string) => void;
};

function BackgroundCard({
  background,
  isSelected,
  onSelect,
}: BackgroundCardProps) {
  return (
    <button
      aria-pressed={isSelected}
      className={[
        wizardTheme.selectCard.base,
        "justify-between",
        isSelected
          ? wizardTheme.selectCard.selected
          : wizardTheme.selectCard.unselected,
      ].join(" ")}
      type="button"
      onClick={() => onSelect(background.id)}
    >
      <span className="truncate text-sm font-semibold text-stone-100">
        {background.name}
      </span>
      <Chip
        classNames={{
          base: isSelected ? "bg-amber-900/60" : "bg-stone-800/80",
          content: "text-[10px] font-semibold text-stone-300",
        }}
        size="sm"
        variant="flat"
      >
        {background.book}
      </Chip>
    </button>
  );
}

export function BackgroundStep({ build, onChange }: BackgroundStepProps) {
  const groupedBackgrounds = useMemo(
    () => groupBackgroundsByBook(backgrounds),
    [],
  );

  const selectedBackground = useMemo(
    () => backgrounds.find((entry) => entry.id === build.backgroundId) ?? null,
    [build.backgroundId],
  );

  const handleSelect = useCallback(
    (backgroundId: string) => {
      if (build.backgroundId === backgroundId) {
        return;
      }

      onChange(updateBackground(build, backgroundId));
    },
    [build, onChange],
  );

  const backgroundSkillOptions = useMemo(
    () =>
      build.backgroundId ? getBackgroundSkillOptions(build.backgroundId) : [],
    [build.backgroundId],
  );

  const handleSkillChange = useCallback(
    (skills: CharacterBuild["backgroundSkillChoices"]) => {
      onChange(updateBackgroundSkillChoices(build, skills));
    },
    [build, onChange],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className={wizardTheme.stepHeading}>{STEP_LABELS.background}</h2>
        <p className={wizardTheme.stepDescription}>
          {STEP_DESCRIPTIONS.background}
        </p>
      </div>

      {groupedBackgrounds.map((group) => (
        <section className="flex flex-col gap-3" key={group.book}>
          <div className="flex flex-col gap-1">
            <h3 className={wizardTheme.sectionLabel}>{group.label}</h3>
            <p className="text-sm text-stone-500">
              {group.items.length}{" "}
              {group.items.length === 1 ? "предыстория" : "предыстории"}
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {group.items.map((background) => (
              <li key={background.id}>
                <BackgroundCard
                  background={background}
                  isSelected={build.backgroundId === background.id}
                  onSelect={handleSelect}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {selectedBackground ? (
        <>
          <section aria-live="polite" className={wizardTheme.detailPanel}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={wizardTheme.detailTitle}>{selectedBackground.name}</h3>
              <Chip
                classNames={{
                  base: "bg-amber-900/60",
                  content: "text-[10px] font-semibold text-amber-100",
                }}
                size="sm"
                variant="flat"
              >
                {selectedBackground.book}
              </Chip>
            </div>
            <p className={wizardTheme.detailBody}>{selectedBackground.description}</p>
          </section>

          <section className="flex flex-col gap-3">
            <div>
              <h3 className={wizardTheme.sectionLabel}>Навыки предыстории</h3>
              <p className="mt-1 text-sm text-stone-400">
                Выберите {getBackgroundSkillPickCount()} навыка из списка, доступного
                для этой предыстории.
              </p>
            </div>
            <SkillSelectGrid
              options={backgroundSkillOptions}
              pickCount={getBackgroundSkillPickCount()}
              selected={build.backgroundSkillChoices}
              onChange={handleSkillChange}
            />
          </section>
        </>
      ) : (
        <p className={wizardTheme.detailPlaceholder}>
          Выберите предысторию, чтобы увидеть полное описание.
        </p>
      )}
    </div>
  );
}
