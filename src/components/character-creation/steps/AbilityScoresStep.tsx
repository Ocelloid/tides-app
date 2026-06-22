"use client";

import { useCallback, useEffect, useMemo } from "react";

import { classOptions } from "~/lib/chronicle";
import {
  ABILITY_KEYS,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  STANDARD_ARRAY,
  computeAbilityScoreState,
  getAbilityScoreWarnings,
  getClassRecommendations,
  getClassSkillOptions,
  getClassSkillPickCount,
  getPrimaryClassId,
  getRemainingPoints,
  getRacialAsiDefinition,
  isValidPointBuyScore,
  requiresFlexChoice,
  updateClassSkillChoices,
  type AbilityKey,
  type AbilityScores,
  type CharacterBuild,
  type ScoreGenerationMethod,
} from "~/lib/character";

import { AbilityScoreCard } from "../AbilityScoreCard";
import { ABILITY_LABELS } from "../abilityLabels";
import { SkillSelectGrid } from "../SkillSelectGrid";
import { STEP_DESCRIPTIONS, STEP_LABELS } from "../stepLabels";
import { wizardTheme } from "../wizardTheme";

type AbilityScoresStepProps = {
  build: CharacterBuild;
  onChange: (build: CharacterBuild) => void;
};

const fieldClass =
  "rounded-xl border border-stone-600 bg-stone-900 px-3 py-2 text-sm text-stone-100 outline-none focus:border-amber-400";
const METHOD_LABELS: Record<ScoreGenerationMethod, string> = {
  "point-buy": "Point Buy (27 очков)",
  "standard-array": "Standard Array",
  manual: "Вручную",
};

function allEights(): AbilityScores {
  return { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
}

function defaultStandardArrayBase(): AbilityScores {
  const [str, dex, con, int, wis, cha] = STANDARD_ARRAY;
  return {
    str: str ?? 15,
    dex: dex ?? 14,
    con: con ?? 13,
    int: int ?? 12,
    wis: wis ?? 10,
    cha: cha ?? 8,
  };
}

function getDefaultBaseForMethod(method: ScoreGenerationMethod): AbilityScores {
  switch (method) {
    case "standard-array":
      return defaultStandardArrayBase();
    case "point-buy":
    case "manual":
    default:
      return allEights();
  }
}

function buildAbilityState(
  build: CharacterBuild,
  method: ScoreGenerationMethod,
  base: AbilityScores,
  flexRacialChoices: AbilityKey[] | null,
) {
  if (!build.raceId) {
    return null;
  }

  return computeAbilityScoreState(
    method,
    base,
    build.raceId,
    flexRacialChoices ?? undefined,
  );
}

function applyAbilityUpdate(
  build: CharacterBuild,
  patch: {
    method?: ScoreGenerationMethod;
    base?: AbilityScores;
    flexRacialChoices?: AbilityKey[] | null;
  },
): CharacterBuild {
  if (!build.raceId) {
    return build;
  }

  const method =
    patch.method ?? build.abilityScores?.method ?? "point-buy";
  const base = patch.base ?? build.abilityScores?.base ?? getDefaultBaseForMethod(method);
  const flexRacialChoices =
    patch.flexRacialChoices !== undefined
      ? patch.flexRacialChoices
      : build.flexRacialChoices;

  return {
    ...build,
    flexRacialChoices,
    abilityScores: buildAbilityState(build, method, base, flexRacialChoices),
  };
}

function getStandardArrayOptions(): number[] {
  return [...STANDARD_ARRAY];
}

function applyStandardArrayChange(
  base: AbilityScores,
  key: AbilityKey,
  value: number,
): AbilityScores {
  if (base[key] === value) {
    return base;
  }

  const next = { ...base };
  const previous = base[key];
  const otherKey = ABILITY_KEYS.find(
    (abilityKey) => abilityKey !== key && base[abilityKey] === value,
  );

  if (otherKey) {
    next[otherKey] = previous;
  }

  next[key] = value;
  return next;
}

export function AbilityScoresStep({ build, onChange }: AbilityScoresStepProps) {
  const raceId = build.raceId;
  const classId = getPrimaryClassId(build);

  const method = build.abilityScores?.method ?? "point-buy";
  const base = build.abilityScores?.base ?? getDefaultBaseForMethod(method);
  const abilityState =
    build.abilityScores ??
    (raceId ? buildAbilityState(build, method, base, build.flexRacialChoices) : null);

  const needsFlex = requiresFlexChoice(raceId);
  const flexDefinition =
    raceId && needsFlex ? getRacialAsiDefinition(raceId) : null;

  const classEntry = useMemo(
    () => classOptions().find((entry) => entry.id === classId) ?? null,
    [classId],
  );

  const recommendations = classId ? getClassRecommendations(classId) : [];
  const recommendationSet = new Set(recommendations);

  const remainingPoints = method === "point-buy" ? getRemainingPoints(base) : null;

  const warnings = abilityState ? getAbilityScoreWarnings(abilityState) : [];

  const handleMethodChange = useCallback(
    (nextMethod: ScoreGenerationMethod) => {
      if (nextMethod === method) {
        return;
      }

      onChange(
        applyAbilityUpdate(build, {
          method: nextMethod,
          base: getDefaultBaseForMethod(nextMethod),
        }),
      );
    },
    [build, method, onChange],
  );

  const handleBaseChange = useCallback(
    (key: AbilityKey, value: number) => {
      if (method === "standard-array") {
        onChange(
          applyAbilityUpdate(build, {
            base: applyStandardArrayChange(base, key, value),
          }),
        );
        return;
      }

      if (method === "point-buy") {
        if (!isValidPointBuyScore(value)) {
          return;
        }

        const trial = { ...base, [key]: value };
        if (getRemainingPoints(trial) < 0) {
          return;
        }
      }

      if (method === "manual") {
        if (!Number.isInteger(value) || value < POINT_BUY_MIN || value > POINT_BUY_MAX) {
          return;
        }
      }

      onChange(applyAbilityUpdate(build, { base: { ...base, [key]: value } }));
    },
    [base, build, method, onChange],
  );

  const handleFlexChange = useCallback(
    (index: 0 | 1, key: AbilityKey) => {
      const next: AbilityKey[] = [...(build.flexRacialChoices ?? [])];
      next[index] = key;

      onChange(
        applyAbilityUpdate(build, {
          flexRacialChoices: next.slice(0, 2),
        }),
      );
    },
    [build, onChange],
  );

  const handleResetStandardArray = useCallback(() => {
    onChange(
      applyAbilityUpdate(build, {
        method: "standard-array",
        base: defaultStandardArrayBase(),
      }),
    );
  }, [build, onChange]);

  useEffect(() => {
    if (!raceId || !classId || build.abilityScores) {
      return;
    }

    onChange(
      applyAbilityUpdate(build, {
        method: "point-buy",
        base: allEights(),
      }),
    );
  }, [raceId, classId, build, build.abilityScores, onChange]);

  const classSkillOptions = useMemo(
    () =>
      classId ? getClassSkillOptions(classId, build.backgroundSkillChoices) : [],
    [classId, build.backgroundSkillChoices],
  );

  const classSkillPickCount = classId ? getClassSkillPickCount(classId) : 0;

  const handleClassSkillChange = useCallback(
    (skills: CharacterBuild["classSkillChoices"]) => {
      onChange(updateClassSkillChoices(build, skills));
    },
    [build, onChange],
  );

  if (!raceId || !classId) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className={wizardTheme.stepHeading}>{STEP_LABELS.abilities}</h2>
          <p className={wizardTheme.stepDescription}>{STEP_DESCRIPTIONS.abilities}</p>
        </div>
        <div className={wizardTheme.infoBanner}>
          <p className="font-semibold">Сначала выберите класс и расу</p>
          <p className="mt-2 leading-6 text-stone-300">
            Вернитесь на предыдущие шаги и укажите класс и расу, чтобы распределить
            характеристики.
          </p>
        </div>
      </div>
    );
  }

  if (!abilityState) {
    return null;
  }

  const flexSelectKeys = (build.flexRacialChoices ?? ["", ""]) as [string, string];
  const flexKeysForSelect = ABILITY_KEYS.filter((key) => key !== "cha");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className={wizardTheme.stepHeading}>{STEP_LABELS.abilities}</h2>
        <p className={wizardTheme.stepDescription}>{STEP_DESCRIPTIONS.abilities}</p>
      </div>

      {classEntry && recommendations.length > 0 ? (
        <div className={wizardTheme.infoBanner}>
          <p>
            Для <span className="font-semibold">{classEntry.name}</span> обычно важны:{" "}
            {recommendations.map((key) => ABILITY_LABELS[key]).join(", ")}.
          </p>
        </div>
      ) : null}

      {needsFlex && flexDefinition?.kind === "flex" ? (
        <div className={wizardTheme.detailPanel}>
          <p className={wizardTheme.detailTitle}>Расовые бонусы</p>
          <p className="mt-1 text-sm text-stone-400">
            +2 {ABILITY_LABELS.cha} (фиксированный бонус расы)
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[0, 1].map((index) => (
              <label className="flex flex-col gap-1 text-sm text-stone-400" key={index}>
                +1 к характеристике ({index + 1})
                <select
                  className={fieldClass}
                  value={flexSelectKeys[index] ?? ""}
                  onChange={(event) => {
                    const selected = event.target.value as AbilityKey;
                    if (selected) {
                      handleFlexChange(index as 0 | 1, selected);
                    }
                  }}
                >
                  <option value="">Выберите…</option>
                  {flexKeysForSelect.map((key) => (
                    <option
                      disabled={
                        build.flexRacialChoices?.some(
                          (chosen, chosenIndex) =>
                            chosenIndex !== index && chosen === key,
                        ) ?? false
                      }
                      key={key}
                      value={key}
                    >
                      {ABILITY_LABELS[key]}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex max-w-md flex-col gap-1 text-sm text-stone-400">
          Метод
          <select
            aria-label="Метод генерации характеристик"
            className={fieldClass}
            value={method}
            onChange={(event) =>
              handleMethodChange(event.target.value as ScoreGenerationMethod)
            }
          >
            {(Object.keys(METHOD_LABELS) as ScoreGenerationMethod[]).map((key) => (
              <option key={key} value={key}>
                {METHOD_LABELS[key]}
              </option>
            ))}
          </select>
        </label>

        {method === "point-buy" && remainingPoints !== null ? (
          <p
            className={`text-sm font-semibold ${
              remainingPoints === 0 ? "text-emerald-400" : "text-amber-200"
            }`}
          >
            Осталось очков: {remainingPoints}
          </p>
        ) : null}

        {method === "standard-array" ? (
          <button
            className={wizardTheme.navButtonSecondary}
            type="button"
            onClick={handleResetStandardArray}
          >
            Сбросить распределение
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ABILITY_KEYS.map((key) => {
          const canDecrease =
            method === "point-buy"
              ? base[key] > POINT_BUY_MIN &&
                isValidPointBuyScore(base[key] - 1) &&
                getRemainingPoints({ ...base, [key]: base[key] - 1 }) >= 0
              : true;

          const canIncrease =
            method === "point-buy"
              ? base[key] < POINT_BUY_MAX &&
                isValidPointBuyScore(base[key] + 1) &&
                getRemainingPoints({ ...base, [key]: base[key] + 1 }) >= 0
              : true;

          return (
            <AbilityScoreCard
              key={key}
              abilityKey={key}
              canDecrease={canDecrease}
              canIncrease={canIncrease}
              method={method}
              recommended={recommendationSet.has(key)}
              standardArrayOptions={
                method === "standard-array" ? getStandardArrayOptions() : undefined
              }
              state={abilityState}
              onBaseChange={handleBaseChange}
            />
          );
        })}
      </div>

      {warnings.length > 0 ? (
        <ul className={`${wizardTheme.warningBanner} flex flex-col gap-1`}>
          {warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}

      <section className="flex flex-col gap-3 border-t border-stone-700/80 pt-6">
        <div>
          <h3 className={wizardTheme.sectionLabel}>Навыки класса</h3>
          <p className="mt-1 text-sm text-stone-400">
            Выберите {classSkillPickCount}{" "}
            {classSkillPickCount === 1 ? "навык" : classSkillPickCount < 5 ? "навыка" : "навыков"}.
            Навыки предыстории уже учтены и недоступны для повторного выбора.
          </p>
        </div>
        <SkillSelectGrid
          options={classSkillOptions}
          pickCount={classSkillPickCount}
          selected={build.classSkillChoices}
          onChange={handleClassSkillChange}
        />
      </section>
    </div>
  );
}
