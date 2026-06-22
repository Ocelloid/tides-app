import {
  ABILITY_KEYS,
  CHARACTER_BUILD_STEPS,
  computeAbilityScoreState,
  computeCombatStats,
  computeMonkUnarmedAttack,
  computeWeaponAttack,
  getInventoryWeapons,
  getPrimaryClassId,
  getStartingGoldAlternativeTotalGp,
  hasSpellcasting,
  isStepComplete,
  requiresFlexChoice,
  setClassLevels,
  setWeaponAttacks,
  STANDARD_ARRAY,
  updateBackground,
  updateEquipmentChoice,
  validateClassLevels,
  type AbilityKey,
  type AbilityScores,
  type CharacterBuild,
  type CharacterBuildStep,
  type ScoreGenerationMethod,
  type WeaponAttack,
} from "~/lib/character";
import { getBackgroundEquipment } from "~/lib/character/backgroundEquipment";
import { emptyAbilityScores } from "~/lib/character/racialBonuses";
import {
  getClassSkillOptions,
  getClassSkillPickCount,
  getDefaultBackgroundSkillChoices,
} from "~/lib/character/skillProficiencies";

import { raceDiceSides, raceOptions } from "~/lib/chronicle/generator";

import { VALID_BACKGROUND_IDS, VALID_PHB_CORE_CLASS_IDS } from "./validationIds";
import { createPrng, type Prng } from "./prng";
import type { CharacterBuildInput } from "./types";
import { getPartialAbilityInput } from "./mergeBuildInput";

export type RandomFillContext = {
  seed?: number;
  warnings?: string[];
};

const MAX_STEP_RETRIES = 5;
const POINT_BUY_TEMPLATE: readonly number[] = [15, 15, 15, 8, 8, 8];

function pushWarning(ctx: RandomFillContext | undefined, message: string): void {
  if (ctx?.warnings) {
    ctx.warnings.push(message);
  }
}

function rollWeightedRaceId(prng: Prng): string {
  const table = raceOptions();
  const sides = raceDiceSides();
  const roll = prng.int(1, sides);
  const entry = table.find(
    (item) => roll >= item.min && roll <= item.max,
  );
  if (!entry) {
    return table[0]!.id;
  }
  return entry.id;
}

function pickDistinctAbilityKeys(prng: Prng, count: number): AbilityKey[] {
  const shuffled = prng.shuffle(ABILITY_KEYS);
  return shuffled.slice(0, count);
}

function buildPointBuyBase(prng: Prng): AbilityScores {
  const keys = prng.shuffle(ABILITY_KEYS);
  const values = [...POINT_BUY_TEMPLATE];
  const base = emptyAbilityScores();
  keys.forEach((key, index) => {
    base[key] = values[index] ?? 8;
  });
  return base;
}

function buildStandardArrayBase(prng: Prng): AbilityScores {
  const keys = prng.shuffle(ABILITY_KEYS);
  const values = prng.shuffle(STANDARD_ARRAY);
  const base = emptyAbilityScores();
  keys.forEach((key, index) => {
    base[key] = values[index] ?? 8;
  });
  return base;
}

function resolveAbilityMethod(
  prng: Prng,
  partial?: CharacterBuildInput["abilityScores"],
): ScoreGenerationMethod {
  if (partial?.method) {
    return partial.method;
  }
  return prng.pick(["standard-array", "point-buy"] as const);
}

function buildAbilityBase(
  method: ScoreGenerationMethod,
  prng: Prng,
  partial?: CharacterBuildInput["abilityScores"],
): AbilityScores {
  const base = emptyAbilityScores();

  if (partial?.base) {
    for (const key of ABILITY_KEYS) {
      const value = partial.base[key];
      if (typeof value === "number") {
        base[key] = value;
      }
    }
  }

  const missing = ABILITY_KEYS.filter(
    (key) => !Number.isInteger(base[key]),
  );

  if (missing.length === 0) {
    return base;
  }

  if (method === "standard-array") {
    const template = buildStandardArrayBase(prng);
    for (const key of missing) {
      base[key] = template[key];
    }
    return base;
  }

  if (method === "point-buy") {
    const template = buildPointBuyBase(prng);
    for (const key of missing) {
      base[key] = template[key];
    }
    return base;
  }

  for (const key of missing) {
    base[key] = prng.int(8, 15);
  }

  return base;
}

export function randomFillClassStep(
  build: CharacterBuild,
  prng: Prng,
): CharacterBuild {
  if (build.classLevels.length > 0) {
    const validation = validateClassLevels(build.classLevels);
    if (!validation.valid) {
      const classId = prng.pick(VALID_PHB_CORE_CLASS_IDS);
      return setClassLevels(build, [{ classId, level: 1 }]);
    }
    return build;
  }

  const classId = prng.pick(VALID_PHB_CORE_CLASS_IDS);
  return setClassLevels(build, [{ classId, level: 1 }]);
}

export function randomFillRaceStep(
  build: CharacterBuild,
  prng: Prng,
): CharacterBuild {
  if (build.raceId) {
    return build;
  }

  return {
    ...build,
    raceId: rollWeightedRaceId(prng),
    abilityScores: null,
    flexRacialChoices: null,
  };
}

export function randomFillBackgroundStep(
  build: CharacterBuild,
  prng: Prng,
): CharacterBuild {
  if (build.backgroundId) {
    if (build.backgroundSkillChoices.length === 0) {
      return {
        ...build,
        backgroundSkillChoices: getDefaultBackgroundSkillChoices(
          build.backgroundId,
        ),
      };
    }
    return build;
  }

  const backgroundId = prng.pick(VALID_BACKGROUND_IDS);
  return updateBackground(build, backgroundId);
}

export function randomFillAbilitiesStep(
  build: CharacterBuild,
  prng: Prng,
  partialAbility?: CharacterBuildInput["abilityScores"],
): CharacterBuild {
  if (!build.raceId) {
    return build;
  }

  let flexRacialChoices = build.flexRacialChoices;
  if (requiresFlexChoice(build.raceId) && !flexRacialChoices?.length) {
    flexRacialChoices = pickDistinctAbilityKeys(prng, 2);
  }

  if (!build.abilityScores) {
    const method = resolveAbilityMethod(prng, partialAbility);
    const base = buildAbilityBase(method, prng, partialAbility);
    const abilityScores = computeAbilityScoreState(
      method,
      base,
      build.raceId,
      flexRacialChoices ?? undefined,
    );

    let next: CharacterBuild = {
      ...build,
      flexRacialChoices,
      abilityScores,
    };

    if (!isStepComplete(next, "abilities")) {
      const fallbackBase =
        method === "point-buy"
          ? buildPointBuyBase(prng)
          : buildStandardArrayBase(prng);
      next = {
        ...next,
        abilityScores: computeAbilityScoreState(
          method,
          fallbackBase,
          build.raceId,
          flexRacialChoices ?? undefined,
        ),
      };
    }

    build = next;
  }

  const classId = getPrimaryClassId(build);
  if (!classId) {
    return build;
  }

  const pickCount = getClassSkillPickCount(classId);
  if (build.classSkillChoices.length === pickCount) {
    return build;
  }

  const options = getClassSkillOptions(
    classId,
    build.backgroundSkillChoices,
  );
  const selected = prng.shuffle(options).slice(0, pickCount);

  return {
    ...build,
    classSkillChoices: selected,
  };
}

export function randomFillEquipmentStep(
  build: CharacterBuild,
  prng: Prng,
): CharacterBuild {
  if (!build.backgroundId) {
    return build;
  }

  if (build.equipmentChoice) {
    if (
      build.equipmentChoice === "equipment" &&
      build.inventory.length === 0
    ) {
      return updateEquipmentChoice(build, "equipment");
    }
    if (build.equipmentChoice === "gold" && build.coins.gp <= 0) {
      return updateEquipmentChoice(build, "gold");
    }
    return build;
  }

  const pack = getBackgroundEquipment(build.backgroundId);
  const goldTotal = getStartingGoldAlternativeTotalGp(build);
  const canPickGold =
    goldTotal > 0 &&
  (pack.goldAlternativeGp !== undefined && pack.goldAlternativeGp > 0);

  const choice = canPickGold && prng.int(0, 1) === 1 ? "gold" : "equipment";
  return updateEquipmentChoice(build, choice);
}

export function randomFillWeaponsMagicStep(
  build: CharacterBuild,
  prng: Prng,
  ctx?: RandomFillContext,
): CharacterBuild {
  if (!build.equipmentChoice) {
    return build;
  }

  let next = build;

  if (next.weaponAttacks.length === 0) {
    const stats = computeCombatStats(next);
    const modifiers = next.abilityScores?.modifier;

    if (stats && modifiers) {
      const inventoryWeapons = getInventoryWeapons(next.inventory);
      const attacks: WeaponAttack[] = [];

      for (const weapon of inventoryWeapons) {
        if (attacks.length >= 3) {
          break;
        }
        attacks.push(
          computeWeaponAttack(
            next,
            weapon,
            stats.proficiencyBonus,
            modifiers,
          ),
        );
      }

      const monkUnarmed = computeMonkUnarmedAttack(
        next,
        stats.proficiencyBonus,
        modifiers.dex,
      );
      if (monkUnarmed && attacks.length < 3) {
        attacks.push(monkUnarmed);
      }

      if (attacks.length > 0) {
        next = setWeaponAttacks(next, attacks);
      }
    }
  }

  if (hasSpellcasting(next) && next.selectedSpells.length === 0) {
    pushWarning(
      ctx,
      "Caster class without selected spells; spell section will be empty on the PDF.",
    );
  }

  return next;
}

function fillStep(
  build: CharacterBuild,
  step: CharacterBuildStep,
  prng: Prng,
  partialAbility?: CharacterBuildInput["abilityScores"],
  ctx?: RandomFillContext,
): CharacterBuild {
  switch (step) {
    case "class":
      return randomFillClassStep(build, prng);
    case "race":
      return randomFillRaceStep(build, prng);
    case "background":
      return randomFillBackgroundStep(build, prng);
    case "abilities":
      return randomFillAbilitiesStep(build, prng, partialAbility);
    case "equipment":
      return randomFillEquipmentStep(build, prng);
    case "weapons-magic":
      return randomFillWeaponsMagicStep(build, prng, ctx);
    case "review":
      return randomFillReviewStep(build, prng, partialAbility, ctx);
    default:
      return build;
  }
}

export function randomFillReviewStep(
  build: CharacterBuild,
  prng: Prng,
  partialAbility?: CharacterBuildInput["abilityScores"],
  ctx?: RandomFillContext,
): CharacterBuild {
  for (const step of CHARACTER_BUILD_STEPS) {
    if (step === "review") {
      continue;
    }

    if (!isStepComplete(build, step)) {
      for (let attempt = 0; attempt < MAX_STEP_RETRIES; attempt += 1) {
        build = fillStep(build, step, prng, partialAbility, ctx);
        if (isStepComplete(build, step)) {
          break;
        }
      }

      if (!isStepComplete(build, step)) {
        throw new Error(
          `Random fill failed to complete wizard step "${step}" after ${MAX_STEP_RETRIES} attempts.`,
        );
      }
    }
  }

  return { ...build, wizardCompleted: true };
}

export function fillMissingBuildSteps(
  build: CharacterBuild,
  inputBuild?: CharacterBuildInput,
  ctx?: RandomFillContext,
): CharacterBuild {
  const prng = createPrng(ctx?.seed);
  const partialAbility = getPartialAbilityInput(inputBuild);
  let next = build;

  for (const step of CHARACTER_BUILD_STEPS) {
    if (!isStepComplete(next, step)) {
      next = fillStep(next, step, prng, partialAbility, ctx);
    }
  }

  if (!next.wizardCompleted) {
    next = randomFillReviewStep(next, prng, partialAbility, ctx);
  }

  return next;
}
