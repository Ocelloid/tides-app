"use client";

import { useMemo, type ReactNode } from "react";

import {
  ABILITY_KEYS,
  formatClassLevelForPdf,
  formatPurseGpEquivalent,
  formatSkillLabel,
  getPrimaryClassId,
  getSpellById,
  hasSpellcasting,
  type CharacterBuild,
  type CharacterBuildStep,
  type ScoreGenerationMethod,
} from "~/lib/character";
import { backgrounds } from "~/lib/chronicle/chronicle";
import { classOptions, raceOptions } from "~/lib/chronicle";

import {
  ABILITY_ABBREVIATIONS,
  ABILITY_LABELS,
  formatAbilityModifier,
} from "../abilityLabels";
import { STEP_DESCRIPTIONS, STEP_LABELS } from "../stepLabels";
import { wizardTheme } from "../wizardTheme";

const METHOD_LABELS: Record<ScoreGenerationMethod, string> = {
  "point-buy": "Point Buy (27 очков)",
  "standard-array": "Standard Array",
  manual: "Вручную",
};

type ReviewStepProps = {
  build: CharacterBuild;
  onEditStep: (step: CharacterBuildStep) => void;
};

type SummaryCardProps = {
  title: string;
  step: CharacterBuildStep;
  onEditStep: (step: CharacterBuildStep) => void;
  className?: string;
  children: ReactNode;
};

function SummaryCard({
  title,
  step,
  onEditStep,
  className = "",
  children,
}: SummaryCardProps) {
  return (
    <section className={`${wizardTheme.summaryCard} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className={wizardTheme.sectionLabel}>{title}</h3>
        <button
          className={wizardTheme.editButton}
          type="button"
          onClick={() => onEditStep(step)}
        >
          Изменить
        </button>
      </div>
      {children}
    </section>
  );
}

export function ReviewStep({ build, onEditStep }: ReviewStepProps) {
  const selectedClass = useMemo(
    () =>
      classOptions().find((entry) => entry.id === getPrimaryClassId(build)) ??
      null,
    [build.classLevels],
  );

  const selectedRace = useMemo(
    () => raceOptions().find((entry) => entry.id === build.raceId) ?? null,
    [build.raceId],
  );

  const selectedBackground = useMemo(
    () => backgrounds.find((entry) => entry.id === build.backgroundId) ?? null,
    [build.backgroundId],
  );

  const scores = build.abilityScores;
  const allSkills = [...build.backgroundSkillChoices, ...build.classSkillChoices];
  const classLevelLabel = formatClassLevelForPdf(build);

  const spellCountsByLevel = useMemo(() => {
    const counts = new Map<number, number>();

    for (const selection of build.selectedSpells) {
      const spell = getSpellById(selection.spellId);
      if (!spell) {
        continue;
      }

      counts.set(spell.level, (counts.get(spell.level) ?? 0) + 1);
    }

    return [...counts.entries()].sort(([a], [b]) => a - b);
  }, [build.selectedSpells]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className={wizardTheme.stepHeading}>{STEP_LABELS.review}</h2>
        <p className={wizardTheme.stepDescription}>{STEP_DESCRIPTIONS.review}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SummaryCard step="class" title="Класс" onEditStep={onEditStep}>
          {build.classLevels.length > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-stone-100">
                {classLevelLabel}
              </p>
              {selectedClass ? (
                <p className="text-sm text-stone-400">
                  Основной класс: {selectedClass.name} · {selectedClass.role}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-stone-500">Не выбран</p>
          )}
        </SummaryCard>

        <SummaryCard step="race" title="Раса" onEditStep={onEditStep}>
          {selectedRace ? (
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-stone-100">
                {selectedRace.name}
              </p>
              {selectedRace.general ? (
                <p className="line-clamp-3 text-sm leading-6 text-stone-400">
                  {selectedRace.general}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-stone-500">Не выбрана</p>
          )}
        </SummaryCard>

        <SummaryCard
          className="md:col-span-2"
          step="background"
          title="Происхождение"
          onEditStep={onEditStep}
        >
          {selectedBackground ? (
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold text-stone-100">
                {selectedBackground.name}
              </p>
              <p className="text-sm text-stone-500">{selectedBackground.book}</p>
            </div>
          ) : (
            <p className="text-sm text-stone-500">Не выбрано</p>
          )}
        </SummaryCard>
      </div>

      <section className={`${wizardTheme.summaryCard} gap-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className={wizardTheme.sectionLabel}>Навыки</h3>
            {allSkills.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {build.backgroundSkillChoices.map((skill) => (
                  <li
                    className="rounded-full border border-amber-700/50 bg-amber-950/40 px-3 py-1 text-xs font-medium text-amber-100"
                    key={`bg-${skill}`}
                  >
                    {formatSkillLabel(skill)} · предыстория
                  </li>
                ))}
                {build.classSkillChoices.map((skill) => (
                  <li
                    className="rounded-full border border-stone-600 bg-stone-900/80 px-3 py-1 text-xs font-medium text-stone-200"
                    key={`class-${skill}`}
                  >
                    {formatSkillLabel(skill)} · класс
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-stone-500">Навыки не выбраны</p>
            )}
          </div>
        </div>
      </section>

      <section className={`${wizardTheme.summaryCard} gap-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className={wizardTheme.sectionLabel}>Характеристики</h3>
            {scores ? (
              <p className="mt-1 text-sm text-stone-400">
                Метод: {METHOD_LABELS[scores.method]}
              </p>
            ) : null}
          </div>
          <button
            className={wizardTheme.editButton}
            type="button"
            onClick={() => onEditStep("abilities")}
          >
            Изменить
          </button>
        </div>

        {scores ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-700 text-left text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                  <th className="px-2 py-2">Характеристика</th>
                  <th className="px-2 py-2 text-center">База</th>
                  <th className="px-2 py-2 text-center">Бонус</th>
                  <th className="px-2 py-2 text-center">Итого</th>
                  <th className="px-2 py-2 text-center">Модиф.</th>
                </tr>
              </thead>
              <tbody>
                {ABILITY_KEYS.map((key) => (
                  <tr className="border-b border-stone-800 last:border-b-0" key={key}>
                    <td className="px-2 py-2.5">
                      <span className="font-medium text-stone-100">
                        {ABILITY_LABELS[key]}
                      </span>
                      <span className="ml-2 text-xs text-stone-500">
                        {ABILITY_ABBREVIATIONS[key]}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-stone-300">
                      {scores.base[key]}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-amber-200">
                      {scores.racialBonus[key] > 0
                        ? `+${scores.racialBonus[key]}`
                        : scores.racialBonus[key]}
                    </td>
                    <td className="px-2 py-2.5 text-center text-base font-semibold tabular-nums text-stone-100">
                      {scores.total[key]}
                    </td>
                    <td className="px-2 py-2.5 text-center font-semibold tabular-nums text-amber-200">
                      {formatAbilityModifier(scores.modifier[key])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-stone-500">Характеристики не распределены</p>
        )}
      </section>

      <section className={`${wizardTheme.summaryCard} gap-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className={wizardTheme.sectionLabel}>Снаряжение</h3>
          <button
            className={wizardTheme.editButton}
            type="button"
            onClick={() => onEditStep("equipment")}
          >
            Изменить
          </button>
        </div>

        {build.equipmentChoice ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-stone-400">
              {build.inventory.length}{" "}
              {build.inventory.length === 1 ? "предмет" : "предметов"}
              {" · "}
              остаток{" "}
              <span className="font-semibold text-amber-200">
                {build.coins.gp > 0
                  ? `${build.coins.gp} зм`
                  : `${formatPurseGpEquivalent(build.coins)} зм`}
              </span>
            </p>

            {build.equipmentChoice === "gold" ? (
              <div className={wizardTheme.infoBanner}>
                <p className="text-sm text-stone-300">
                  Стартовое золото вместо снаряжения предыстории
                </p>
              </div>
            ) : null}

            {build.inventory.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {build.inventory.map((item, index) => (
                  <li
                    className="flex gap-3 text-sm leading-6 text-stone-200"
                    key={`${item.source}-${item.catalogId ?? item.nameRu}-${index}`}
                  >
                    <span
                      aria-hidden
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-400"
                    />
                    <span>
                      {item.quantity > 1
                        ? `${item.nameRu} (×${item.quantity})`
                        : item.nameRu}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-500">Инвентарь пуст</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-stone-500">Снаряжение не выбрано</p>
        )}
      </section>

      <section className={`${wizardTheme.summaryCard} gap-4`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className={wizardTheme.sectionLabel}>Оружие и магия</h3>
          <button
            className={wizardTheme.editButton}
            type="button"
            onClick={() => onEditStep("weapons-magic")}
          >
            Изменить
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
              Основные атаки
            </p>
            {build.weaponAttacks.length > 0 ? (
              <ul className="mt-2 flex flex-col gap-2">
                {build.weaponAttacks.slice(0, 3).map((attack, index) => (
                  <li
                    className="text-sm text-stone-200"
                    key={`${attack.weaponId ?? attack.name}-${index}`}
                  >
                    {attack.name} ·{" "}
                    {attack.attackBonus >= 0 ? `+${attack.attackBonus}` : attack.attackBonus}{" "}
                    · {attack.damage}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-stone-500">Атаки не выбраны</p>
            )}
          </div>

          {hasSpellcasting(build) ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                Заклинания
              </p>
              {spellCountsByLevel.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {spellCountsByLevel.map(([level, count]) => (
                    <li
                      className="rounded-full border border-violet-700/50 bg-violet-950/40 px-3 py-1 text-xs font-medium text-violet-100"
                      key={level}
                    >
                      {level === 0 ? "Заговоры" : `${level} ур.`}: {count}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-stone-500">Заклинания не выбраны</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-stone-500">Заклинательные классы не выбраны</p>
          )}
        </div>
      </section>
    </div>
  );
}
