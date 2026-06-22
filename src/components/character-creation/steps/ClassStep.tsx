"use client";

import { useCallback, useMemo, useRef } from "react";

import { classOptions, type ClassEntry } from "~/lib/chronicle";
import {
  type CharacterBuild,
  addClassLevel,
  getPrimaryClassId,
  getTotalLevel,
  removeClassLevel,
  updateClassLevel,
  validateClassLevels,
} from "~/lib/character";

import { ClassSelectCard } from "../ClassSelectCard";
import { STEP_DESCRIPTIONS, STEP_LABELS } from "../stepLabels";
import { wizardTheme } from "../wizardTheme";

type ClassStepProps = {
  build: CharacterBuild;
  onChange: (build: CharacterBuild) => void;
};

const levelInputClass =
  "w-16 rounded-lg border border-stone-600 bg-stone-900 px-2 py-1.5 text-center text-sm text-stone-100 outline-none focus:border-amber-400";

export function ClassStep({ build, onChange }: ClassStepProps) {
  const classes = useMemo(
    () =>
      classOptions().filter(
        (entry) => entry.category === "base" && entry.source === "core",
      ),
    [],
  );

  const classById = useMemo(
    () => new Map(classes.map((entry) => [entry.id, entry])),
    [classes],
  );

  const primaryClassId = getPrimaryClassId(build);
  const totalLevel = getTotalLevel(build);
  const validation = validateClassLevels(build.classLevels);
  const primaryEntry =
    classes.find((entry) => entry.id === primaryClassId) ?? null;

  const levelRowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleCardSelect = (entry: ClassEntry) => {
    const alreadySelected = build.classLevels.some(
      (level) => level.classId === entry.id,
    );

    if (alreadySelected) {
      levelRowRefs.current
        .get(entry.id)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    onChange(addClassLevel(build, entry.id));
  };

  const handleLevelChange = (classId: string, rawValue: string) => {
    const parsed = Number.parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) {
      return;
    }

    onChange(updateClassLevel(build, classId, parsed));
  };

  const handleRemove = (classId: string) => {
    if (build.classLevels.length <= 1) {
      return;
    }

    onChange(removeClassLevel(build, classId));
  };

  const setLevelRowRef = useCallback(
    (classId: string) => (node: HTMLDivElement | null) => {
      if (node) {
        levelRowRefs.current.set(classId, node);
      } else {
        levelRowRefs.current.delete(classId);
      }
    },
    [],
  );

  const totalLevelOverLimit = totalLevel > 20;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className={wizardTheme.stepHeading}>{STEP_LABELS.class}</h2>
        <p className={wizardTheme.stepDescription}>{STEP_DESCRIPTIONS.class}</p>
      </div>

      <p
        className={[
          "text-sm font-semibold",
          totalLevelOverLimit ? "text-red-300" : "text-amber-200",
        ].join(" ")}
      >
        Суммарный уровень: {totalLevel} / 20
      </p>

      <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
        {classes.map((entry) => (
          <ClassSelectCard
            key={entry.id}
            entry={entry}
            selected={build.classLevels.some(
              (level) => level.classId === entry.id,
            )}
            onSelect={() => handleCardSelect(entry)}
          />
        ))}
      </div>

      {build.classLevels.length > 0 ? (
        <section className={wizardTheme.summaryCard}>
          <div className="flex flex-col gap-1">
            <h3 className={wizardTheme.sectionLabel}>Ваши классы</h3>
            <p className="text-xs leading-5 text-stone-400">
              Первый добавленный класс — стартовый уровень персонажа (порядок
              прокачки для HP).
            </p>
          </div>

          <ul className="flex flex-col gap-2">
            {build.classLevels.map((entry, index) => {
              const classEntry = classById.get(entry.classId);
              const canRemove = build.classLevels.length > 1;

              return (
                <li key={entry.classId}>
                  <div
                    ref={setLevelRowRef(entry.classId)}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-stone-700/80 bg-black/30 px-3 py-2.5"
                  >
                    <span className="min-w-0 flex-1 text-sm font-semibold text-stone-100">
                      {classEntry?.name ?? entry.classId}
                      {index === 0 ? (
                        <span className="ml-2 text-xs font-normal text-amber-300/80">
                          (стартовый)
                        </span>
                      ) : null}
                    </span>

                    <label className="flex items-center gap-2 text-xs text-stone-400">
                      Уровень
                      <input
                        aria-label={`Уровень класса ${classEntry?.name ?? entry.classId}`}
                        className={levelInputClass}
                        min={1}
                        type="number"
                        value={entry.level}
                        onChange={(event) =>
                          handleLevelChange(entry.classId, event.target.value)
                        }
                      />
                    </label>

                    <button
                      aria-label={`Удалить класс ${classEntry?.name ?? entry.classId}`}
                      className={wizardTheme.editButton}
                      disabled={!canRemove}
                      type="button"
                      onClick={() => handleRemove(entry.classId)}
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {!validation.valid && build.classLevels.length > 0 ? (
        <p aria-live="polite" className={wizardTheme.errorBanner}>
          {validation.message}
        </p>
      ) : null}

      {primaryEntry ? (
        <div className={wizardTheme.detailPanel}>
          <p className={wizardTheme.detailTitle}>{primaryEntry.name}</p>
          <p className="mt-1 text-xs text-amber-300/70">
            Основной класс (наибольший уровень)
          </p>
          <p className={wizardTheme.detailBody}>{primaryEntry.description}</p>
          <p className="mt-3 text-xs leading-6 text-stone-400">
            {primaryEntry.role}
          </p>
        </div>
      ) : (
        <p className={wizardTheme.detailPlaceholder}>
          Добавьте класс, чтобы увидеть описание.
        </p>
      )}
    </div>
  );
}
