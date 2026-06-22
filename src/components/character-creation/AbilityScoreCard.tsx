"use client";

import type { ReactNode } from "react";

import {
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  STANDARD_ARRAY,
  type AbilityKey,
  type AbilityScoreState,
  type ScoreGenerationMethod,
} from "~/lib/character";

import {
  ABILITY_ABBREVIATIONS,
  ABILITY_LABELS,
  formatAbilityModifier,
} from "./abilityLabels";
type AbilityScoreCardProps = {
  abilityKey: AbilityKey;
  state: AbilityScoreState;
  method: ScoreGenerationMethod;
  recommended?: boolean;
  canDecrease?: boolean;
  canIncrease?: boolean;
  standardArrayOptions?: number[];
  onBaseChange: (key: AbilityKey, value: number) => void;
};

const iconButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-stone-600 bg-stone-900 text-lg font-bold text-stone-100 transition hover:border-amber-500 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40";

const fieldClass =
  "rounded-lg border border-stone-600 bg-stone-900 px-2 py-1.5 text-sm font-bold text-stone-100 outline-none focus:border-amber-400";

export function AbilityScoreCard({
  abilityKey,
  state,
  method,
  recommended = false,
  canDecrease = true,
  canIncrease = true,
  standardArrayOptions,
  onBaseChange,
}: AbilityScoreCardProps) {
  const total = state.total[abilityKey];
  const modifier = state.modifier[abilityKey];
  const base = state.base[abilityKey];
  const bonus = state.racialBonus[abilityKey];

  const cardClassName = recommended
    ? "border-amber-500/70 bg-amber-950/30 ring-1 ring-amber-500/40"
    : "border-stone-700/80 bg-black/40";

  let baseEditor: ReactNode;

  if (method === "point-buy") {
    baseEditor = (
      <div className="flex items-center gap-1">
        <button
          aria-label={`Уменьшить ${ABILITY_LABELS[abilityKey]}`}
          className={iconButtonClass}
          disabled={!canDecrease}
          type="button"
          onClick={() => onBaseChange(abilityKey, base - 1)}
        >
          −
        </button>
        <span className="min-w-[2rem] text-center text-lg font-bold text-stone-100">
          {base}
        </span>
        <button
          aria-label={`Увеличить ${ABILITY_LABELS[abilityKey]}`}
          className={iconButtonClass}
          disabled={!canIncrease}
          type="button"
          onClick={() => onBaseChange(abilityKey, base + 1)}
        >
          +
        </button>
      </div>
    );
  } else if (method === "standard-array") {
    const options = standardArrayOptions ?? [...STANDARD_ARRAY];
    baseEditor = (
      <select
        aria-label={`Базовое значение ${ABILITY_LABELS[abilityKey]}`}
        className={fieldClass}
        value={base}
        onChange={(event) => onBaseChange(abilityKey, Number(event.target.value))}
      >
        {options.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    );
  } else {
    baseEditor = (
      <input
        aria-label={`Базовое значение ${ABILITY_LABELS[abilityKey]}`}
        className={`${fieldClass} w-16 text-center`}
        max={POINT_BUY_MAX}
        min={POINT_BUY_MIN}
        type="number"
        value={base}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (Number.isFinite(parsed)) {
            onBaseChange(abilityKey, parsed);
          }
        }}
      />
    );
  }

  return (
    <div className={`flex flex-col gap-3 rounded-xl border px-4 py-4 ${cardClassName}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            {ABILITY_ABBREVIATIONS[abilityKey]}
          </p>
          <p className="text-base font-bold text-stone-100">
            {ABILITY_LABELS[abilityKey]}
          </p>
        </div>
        {recommended ? (
          <span className="rounded-full bg-amber-900/70 px-2 py-0.5 text-xs font-semibold text-amber-200">
            Важно
          </span>
        ) : null}
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs font-medium text-stone-500">Итого</dt>
          <dd className="text-2xl font-black text-stone-50">{total}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Модиф.</dt>
          <dd className="text-2xl font-black text-amber-200">
            {formatAbilityModifier(modifier)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">База</dt>
          <dd className="mt-1">{baseEditor}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-stone-500">Бонус</dt>
          <dd className="text-lg font-bold text-stone-300">
            {bonus > 0 ? `+${bonus}` : bonus < 0 ? formatAbilityModifier(bonus) : "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
