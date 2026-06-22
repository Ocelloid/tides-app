import type {
  AbilityKey,
  AbilityScoreState,
  AbilityScores,
  FlexibleRacialChoice,
  ScoreGenerationMethod,
  StepValidation,
} from "./types";
import {
  applyFixedBonus,
  emptyAbilityScores,
  getRacialAsiDefinition,
  type RacialAsiDefinition,
} from "./racialBonuses";
import {
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  validatePointBuy,
} from "./pointBuy";

export const ABILITY_KEYS: readonly AbilityKey[] = [
  "str",
  "dex",
  "con",
  "int",
  "wis",
  "cha",
];

export const STANDARD_ARRAY: readonly number[] = [15, 14, 13, 12, 10, 8];

/** Primary ability recommendations for PHB core classes (1–2 keys). */
const CLASS_ABILITY_RECOMMENDATIONS: Record<string, AbilityKey[]> = {
  barbarian: ["str"],
  bard: ["cha"],
  cleric: ["wis"],
  druid: ["wis"],
  fighter: ["str", "dex"],
  monk: ["dex", "wis"],
  paladin: ["str", "cha"],
  ranger: ["dex", "wis"],
  rogue: ["dex"],
  sorcerer: ["cha"],
  warlock: ["cha"],
  wizard: ["int"],
};

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function requiresFlexChoice(raceId: string | null): boolean {
  if (!raceId) {
    return false;
  }

  const definition = getRacialAsiDefinition(raceId);
  return definition?.kind === "flex";
}

export function validateFlexChoices(
  raceId: string | null,
  choices: AbilityKey[] | null,
): StepValidation {
  if (!requiresFlexChoice(raceId)) {
    return { valid: true };
  }

  const definition = getRacialAsiDefinition(raceId!);
  if (!definition || definition.kind !== "flex") {
    return { valid: true };
  }

  if (choices?.length !== definition.flexCount) {
    return {
      valid: false,
      message: `Выберите ${definition.flexCount} разные характеристики для бонуса +${definition.flexAmount}.`,
    };
  }

  const unique = new Set(choices);
  if (unique.size !== choices.length) {
    return {
      valid: false,
      message: "Бонусы +1 должны быть на разных характеристиках.",
    };
  }

  return { valid: true };
}

export function assignStandardArray(
  assignment: Record<AbilityKey, number>,
): AbilityScores {
  const scores = { ...assignment };
  const validation = validateStandardArrayAssignment(scores);
  if (!validation.valid) {
    throw new Error(validation.message ?? "Invalid standard array assignment.");
  }
  return scores;
}

export function validateStandardArrayAssignment(
  scores: AbilityScores,
): StepValidation {
  const values = ABILITY_KEYS.map((key) => scores[key]).sort((a, b) => b - a);
  const expected = [...STANDARD_ARRAY].sort((a, b) => b - a);

  if (values.length !== expected.length) {
    return { valid: false, message: "Нужно распределить все шесть характеристик." };
  }

  for (let index = 0; index < values.length; index += 1) {
    if (values[index] !== expected[index]) {
      return {
        valid: false,
        message: "Standard array должен использовать значения 15, 14, 13, 12, 10, 8 ровно один раз.",
      };
    }
  }

  return { valid: true };
}

export function validateManualBaseScores(scores: AbilityScores): StepValidation {
  for (const key of ABILITY_KEYS) {
    const value = scores[key];
    if (!Number.isInteger(value) || value < POINT_BUY_MIN || value > POINT_BUY_MAX) {
      return {
        valid: false,
        message: `Базовая характеристика ${key.toUpperCase()} должна быть от ${POINT_BUY_MIN} до ${POINT_BUY_MAX}.`,
      };
    }
  }

  return { valid: true };
}

export function validateBaseScoresForMethod(
  method: ScoreGenerationMethod,
  base: AbilityScores,
): StepValidation {
  switch (method) {
    case "point-buy":
      return validatePointBuy(base);
    case "standard-array":
      return validateStandardArrayAssignment(base);
    case "manual":
      return validateManualBaseScores(base);
    default:
      return { valid: false, message: "Неизвестный метод генерации характеристик." };
  }
}

function computeRacialBonus(
  definition: RacialAsiDefinition | null,
  flexPlusOne: AbilityKey[] | undefined,
): { racialBonus: AbilityScores; flexChoices: FlexibleRacialChoice | null } {
  const racialBonus = emptyAbilityScores();
  let flexChoices: FlexibleRacialChoice | null = null;

  if (!definition) {
    return { racialBonus, flexChoices };
  }

  if (definition.kind === "fixed") {
    return {
      racialBonus: applyFixedBonus(racialBonus, definition.bonus),
      flexChoices: null,
    };
  }

  const fixedBonus = applyFixedBonus(racialBonus, definition.fixed);
  flexChoices = {
    fixed: definition.fixed,
    flexPlusOne: flexPlusOne ?? [],
  };

  if (flexPlusOne) {
    for (const key of flexPlusOne) {
      fixedBonus[key] += definition.flexAmount;
    }
  }

  return { racialBonus: fixedBonus, flexChoices };
}

export function computeAbilityScoreState(
  method: ScoreGenerationMethod,
  base: AbilityScores,
  raceId: string,
  flexPlusOne?: AbilityKey[],
): AbilityScoreState {
  const definition = getRacialAsiDefinition(raceId);
  const { racialBonus, flexChoices } = computeRacialBonus(
    definition,
    flexPlusOne,
  );

  const total = emptyAbilityScores();
  const modifier = {} as Record<AbilityKey, number>;

  for (const key of ABILITY_KEYS) {
    total[key] = base[key] + racialBonus[key];
    modifier[key] = abilityModifier(total[key]);
  }

  return {
    method,
    base,
    racialBonus,
    flexChoices,
    total,
    modifier,
  };
}

export function validateAbilityScoreState(
  state: AbilityScoreState | null,
): StepValidation {
  if (!state) {
    return { valid: false, message: "Характеристики не распределены." };
  }

  const baseValidation = validateBaseScoresForMethod(state.method, state.base);
  if (!baseValidation.valid) {
    return baseValidation;
  }

  for (const key of ABILITY_KEYS) {
    const total = state.total[key];
    if (!Number.isFinite(total) || total < 3) {
      return { valid: false, message: "Некорректные итоговые характеристики." };
    }

    const expectedModifier = abilityModifier(total);
    if (state.modifier[key] !== expectedModifier) {
      return {
        valid: false,
        message: "Модификаторы характеристик не согласованы.",
      };
    }

    const expectedRacial = state.racialBonus[key];
    if (state.base[key] + expectedRacial !== total) {
      return {
        valid: false,
        message: "Итоговые характеристики не согласованы с базой и бонусами расы.",
      };
    }
  }

  return { valid: true };
}

export function getClassRecommendations(classId: string): AbilityKey[] {
  return CLASS_ABILITY_RECOMMENDATIONS[classId] ?? [];
}

export function getAbilityScoreWarnings(
  state: AbilityScoreState,
): string[] {
  const warnings: string[] = [];

  for (const key of ABILITY_KEYS) {
    if (state.total[key] > 20) {
      warnings.push(
        `${key.toUpperCase()} ${state.total[key]} превышает типичный максимум 20 на 1 уровне.`,
      );
    }
  }

  return warnings;
}
