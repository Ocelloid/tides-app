import type { AbilityKey, AbilityScores, StepValidation } from "./types";

const ABILITY_KEYS: readonly AbilityKey[] = [
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
];

/** PHB 2014 point-buy budget. */
export const POINT_BUY_BUDGET = 27;

/** Cost to raise a single ability score to this value (before racial bonuses). */
export const POINT_BUY_COST: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

export function getPointBuyCost(scores: AbilityScores): number {
  return ABILITY_KEYS.reduce(
    (total, key) => total + (POINT_BUY_COST[scores[key]] ?? 0),
    0,
  );
}

export function getRemainingPoints(scores: AbilityScores): number {
  return POINT_BUY_BUDGET - getPointBuyCost(scores);
}

export function isValidPointBuyScore(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= POINT_BUY_MIN &&
    value <= POINT_BUY_MAX &&
    value in POINT_BUY_COST
  );
}

export function validatePointBuy(scores: AbilityScores): StepValidation {
  for (const key of ABILITY_KEYS) {
    if (!isValidPointBuyScore(scores[key])) {
      return {
        valid: false,
        message: `Базовая характеристика ${key.toUpperCase()} должна быть от 8 до 15.`,
      };
    }
  }

  const remaining = getRemainingPoints(scores);
  if (remaining < 0) {
    return {
      valid: false,
      message: "Превышен лимит point buy (27 очков).",
    };
  }

  if (remaining > 0) {
    return {
      valid: false,
      message: `Осталось ${remaining} нераспределённых очков point buy.`,
    };
  }

  return { valid: true };
}
