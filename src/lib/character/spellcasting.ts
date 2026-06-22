import { getSpellById } from "./dndData";
import type { AbilityKey, CharacterBuild, ClassLevelEntry, SpellSelection } from "./types";

export type SpellcastingInfo = {
  ability: AbilityKey;
  spellSaveDc: number;
  spellAttackBonus: number;
  slots: Record<number, number>;
  cantripsKnown: number;
  spellsKnownLimit?: number;
  spellsPreparedLimit?: number;
};

export type SpellValidationResult = {
  valid: boolean;
  message?: string;
};

/** PHB multiclass caster level contribution per classId. Warlock uses Pact Magic separately. */
export const MULTICLASS_CASTER_LEVEL: Record<string, number> = {
  bard: 1,
  cleric: 1,
  druid: 1,
  sorcerer: 1,
  wizard: 1,
  paladin: 0.5,
  ranger: 0.5,
};

/** Классы с заклинаниями в v1 (из classSpells.json). */
export const SPELLCASTING_CLASS_IDS = [
  "bard",
  "cleric",
  "druid",
  "paladin",
  "ranger",
  "sorcerer",
  "warlock",
  "wizard",
] as const;

export type SpellcastingClassId = (typeof SPELLCASTING_CLASS_IDS)[number];

/** PHB combined multiclass spell slot table (effective caster level → slots by spell level). */
export const MULTICLASS_SPELL_SLOT_TABLE: Record<number, number[]> = {
  1: [2],
  2: [3],
  3: [4, 2],
  4: [4, 3],
  5: [4, 3, 2],
  6: [4, 3, 3],
  7: [4, 4, 3],
  8: [4, 4, 3, 1],
  9: [4, 4, 3, 2],
  10: [4, 4, 3, 3, 1],
  11: [4, 4, 3, 3, 2],
  12: [4, 4, 3, 3, 3, 1],
  13: [4, 4, 3, 3, 3, 2],
  14: [4, 4, 3, 3, 3, 3, 1],
  15: [4, 4, 3, 3, 3, 3, 2],
  16: [4, 4, 3, 3, 3, 3, 3, 1],
  17: [4, 4, 3, 3, 3, 3, 3, 2],
  18: [4, 4, 3, 3, 3, 3, 3, 3, 1],
  19: [4, 4, 3, 3, 3, 3, 3, 3, 2],
  20: [4, 4, 3, 3, 3, 3, 3, 3, 4],
};

/** Warlock Pact Magic: slot count and slot level by warlock class level. */
const WARLOCK_PACT_SLOTS: Record<number, { count: number; slotLevel: number }> = {
  1: { count: 1, slotLevel: 1 },
  2: { count: 2, slotLevel: 1 },
  3: { count: 2, slotLevel: 2 },
  4: { count: 2, slotLevel: 2 },
  5: { count: 2, slotLevel: 3 },
  6: { count: 2, slotLevel: 3 },
  7: { count: 2, slotLevel: 4 },
  8: { count: 2, slotLevel: 4 },
  9: { count: 2, slotLevel: 5 },
  10: { count: 2, slotLevel: 5 },
  11: { count: 3, slotLevel: 5 },
  12: { count: 3, slotLevel: 5 },
  13: { count: 3, slotLevel: 5 },
  14: { count: 3, slotLevel: 5 },
  15: { count: 3, slotLevel: 5 },
  16: { count: 3, slotLevel: 5 },
  17: { count: 4, slotLevel: 5 },
  18: { count: 4, slotLevel: 5 },
  19: { count: 4, slotLevel: 5 },
  20: { count: 4, slotLevel: 5 },
};

const BARD_SPELLS_KNOWN: Record<number, number> = {
  1: 4,
  2: 5,
  3: 6,
  4: 7,
  5: 8,
  6: 9,
  7: 10,
  8: 11,
  9: 12,
  10: 14,
  11: 15,
  12: 15,
  13: 16,
  14: 18,
  15: 19,
  16: 19,
  17: 20,
  18: 22,
  19: 22,
  20: 22,
};

const SORCERER_SPELLS_KNOWN: Record<number, number> = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
  7: 8,
  8: 9,
  9: 10,
  10: 11,
  11: 12,
  12: 12,
  13: 13,
  14: 13,
  15: 14,
  16: 14,
  17: 15,
  18: 15,
  19: 15,
  20: 15,
};

const WARLOCK_SPELLS_KNOWN: Record<number, number> = {
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
  7: 8,
  8: 9,
  9: 10,
  10: 10,
  11: 11,
  12: 11,
  13: 12,
  14: 12,
  15: 13,
  16: 13,
  17: 14,
  18: 14,
  19: 15,
  20: 15,
};

const RANGER_SPELLS_KNOWN: Record<number, number> = {
  1: 0,
  2: 2,
  3: 3,
  4: 3,
  5: 4,
  6: 4,
  7: 5,
  8: 5,
  9: 6,
  10: 6,
  11: 7,
  12: 7,
  13: 8,
  14: 8,
  15: 9,
  16: 9,
  17: 10,
  18: 10,
  19: 11,
  20: 11,
};

const CANTrips_BY_CLASS: Record<string, (level: number) => number> = {
  bard: (level) => 2 + (level >= 4 ? 1 : 0) + (level >= 10 ? 1 : 0),
  cleric: (level) => 3 + (level >= 4 ? 1 : 0) + (level >= 10 ? 1 : 0),
  druid: (level) => 2 + (level >= 4 ? 1 : 0) + (level >= 10 ? 1 : 0),
  sorcerer: (level) => 4 + (level >= 4 ? 1 : 0) + (level >= 10 ? 1 : 0),
  warlock: (level) => 2 + (level >= 4 ? 1 : 0) + (level >= 10 ? 1 : 0),
  wizard: (level) => 3 + (level >= 4 ? 1 : 0) + (level >= 10 ? 1 : 0),
  paladin: () => 0,
  ranger: () => 0,
};

export function isSpellcastingClass(classId: string): classId is SpellcastingClassId {
  return (SPELLCASTING_CLASS_IDS as readonly string[]).includes(classId);
}

export function hasSpellcasting(build: CharacterBuild): boolean {
  return build.classLevels.some((entry) => isSpellcastingClass(entry.classId));
}

export function getSpellcastingAbility(classId: string): AbilityKey | null {
  switch (classId) {
    case "bard":
    case "paladin":
    case "sorcerer":
    case "warlock":
      return "cha";
    case "cleric":
    case "druid":
    case "ranger":
      return "wis";
    case "wizard":
      return "int";
    default:
      return null;
  }
}

export function computeSpellSaveDc(
  abilityMod: number,
  proficiencyBonus: number,
): number {
  return 8 + abilityMod + proficiencyBonus;
}

export function computeSpellAttackBonus(
  abilityMod: number,
  proficiencyBonus: number,
): number {
  return abilityMod + proficiencyBonus;
}

export function getCombinedCasterLevel(classLevels: ClassLevelEntry[]): number {
  let total = 0;

  for (const entry of classLevels) {
    const coeff = MULTICLASS_CASTER_LEVEL[entry.classId];
    if (coeff !== undefined && coeff > 0) {
      total += Math.floor(entry.level * coeff);
    }
  }

  return total;
}

function slotsArrayToRecord(slots: number[]): Record<number, number> {
  const result: Record<number, number> = {};
  for (const [index, count] of slots.entries()) {
    if (count > 0) {
      result[index + 1] = count;
    }
  }
  return result;
}

/** PHB combined multiclass slots (excludes Warlock Pact Magic). */
export function getSpellSlots(combinedCasterLevel: number): Record<number, number> {
  if (combinedCasterLevel <= 0) {
    return {};
  }

  const clamped = Math.min(20, Math.max(1, combinedCasterLevel));
  const slots = MULTICLASS_SPELL_SLOT_TABLE[clamped] ?? [];
  return slotsArrayToRecord(slots);
}

/** Single-class full/half caster slots when build has one non-warlock caster. */
export function getSpellSlotsForClass(
  classId: string,
  classLevel: number,
): Record<number, number> {
  if (classId === "warlock") {
    const pact = WARLOCK_PACT_SLOTS[Math.min(20, Math.max(1, classLevel))];
    if (!pact) {
      return {};
    }
    return { [pact.slotLevel]: pact.count };
  }

  const coeff = MULTICLASS_CASTER_LEVEL[classId];
  if (coeff === undefined || coeff <= 0 || classLevel <= 0) {
    return {};
  }

  const effectiveLevel = Math.floor(classLevel * coeff);
  return getSpellSlots(effectiveLevel);
}

export function getCantripsKnown(classId: string, classLevel: number): number {
  const fn = CANTrips_BY_CLASS[classId];
  if (!fn || classLevel <= 0) {
    return 0;
  }

  return fn(classLevel);
}

export function getSpellsKnownLimit(
  classId: string,
  classLevel: number,
): number | undefined {
  if (classLevel <= 0) {
    return undefined;
  }

  const level = Math.min(20, classLevel);

  switch (classId) {
    case "bard":
      return BARD_SPELLS_KNOWN[level] ?? 0;
    case "sorcerer":
      return SORCERER_SPELLS_KNOWN[level] ?? 0;
    case "warlock":
      return WARLOCK_SPELLS_KNOWN[level] ?? 0;
    case "ranger":
      return RANGER_SPELLS_KNOWN[level] ?? 0;
    case "wizard":
    case "cleric":
    case "druid":
    case "paladin":
      return undefined;
    default:
      return undefined;
  }
}

export function getSpellsPreparedLimit(
  classId: string,
  classLevel: number,
  abilityMod: number,
): number | undefined {
  if (classLevel <= 0) {
    return undefined;
  }

  switch (classId) {
    case "wizard":
    case "cleric":
    case "druid":
      return Math.max(1, abilityMod + classLevel);
    case "paladin":
      return Math.max(1, abilityMod + Math.floor(classLevel / 2));
    case "bard":
    case "sorcerer":
    case "warlock":
    case "ranger":
      return undefined;
    default:
      return undefined;
  }
}

function getClassLevel(build: CharacterBuild, classId: string): number {
  return build.classLevels.find((entry) => entry.classId === classId)?.level ?? 0;
}

function listCasterClassIds(classLevels: ClassLevelEntry[]): string[] {
  return classLevels
    .filter((entry) => isSpellcastingClass(entry.classId))
    .map((entry) => entry.classId);
}

/** Первый caster class в порядке classLevels. */
export function getPrimarySpellcastingClassId(build: CharacterBuild): string | null {
  const casters = listCasterClassIds(build.classLevels);
  return casters[0] ?? null;
}

/** Второй caster class; 3+ casters — только overflow (v1 cap). */
export function getSecondarySpellcastingClassId(build: CharacterBuild): string | null {
  const casters = listCasterClassIds(build.classLevels);
  return casters[1] ?? null;
}

export function getMaxSpellLevelForClass(classId: string, classLevel: number): number {
  if (classId === "warlock") {
    const pact = WARLOCK_PACT_SLOTS[Math.min(20, Math.max(1, classLevel))];
    return pact?.slotLevel ?? 0;
  }

  const coeff = MULTICLASS_CASTER_LEVEL[classId];
  if (coeff === undefined || coeff <= 0) {
    return 0;
  }

  const effectiveLevel = Math.floor(classLevel * coeff);
  const slots = MULTICLASS_SPELL_SLOT_TABLE[Math.min(20, Math.max(1, effectiveLevel))] ?? [];
  return slots.length;
}

export function buildSpellcastingInfo(
  build: CharacterBuild,
  classId: string,
  proficiencyBonus: number,
): SpellcastingInfo | null {
  const ability = getSpellcastingAbility(classId);
  if (!ability || !build.abilityScores) {
    return null;
  }

  const classLevel = getClassLevel(build, classId);
  if (classLevel <= 0) {
    return null;
  }

  const abilityMod = build.abilityScores.modifier[ability];
  const casterIds = listCasterClassIds(build.classLevels);
  const nonWarlockCasters = casterIds.filter((id) => id !== "warlock");

  let slots: Record<number, number>;

  if (classId === "warlock") {
    slots = getSpellSlotsForClass("warlock", classLevel);
  } else if (nonWarlockCasters.length === 1 && nonWarlockCasters[0] === classId) {
    slots = getSpellSlotsForClass(classId, classLevel);
  } else {
    slots = getSpellSlots(getCombinedCasterLevel(build.classLevels));
  }

  return {
    ability,
    spellSaveDc: computeSpellSaveDc(abilityMod, proficiencyBonus),
    spellAttackBonus: computeSpellAttackBonus(abilityMod, proficiencyBonus),
    slots,
    cantripsKnown: getCantripsKnown(classId, classLevel),
    spellsKnownLimit: getSpellsKnownLimit(classId, classLevel),
    spellsPreparedLimit: getSpellsPreparedLimit(classId, classLevel, abilityMod),
  };
}

export function validateSpellSelection(build: CharacterBuild): SpellValidationResult {
  if (!build.abilityScores) {
    return { valid: false, message: "Сначала задайте характеристики." };
  }

  const selectionsByClass = new Map<string, SpellSelection[]>();

  for (const selection of build.selectedSpells) {
    if (!isSpellcastingClass(selection.classId)) {
      return { valid: false, message: `Класс «${selection.classId}» не использует заклинания.` };
    }

    const classLevel = getClassLevel(build, selection.classId);
    if (classLevel <= 0) {
      return {
        valid: false,
        message: `Заклинание привязано к классу, которого нет в build.`,
      };
    }

    const spell = getSpellById(selection.spellId);
    if (!spell) {
      return { valid: false, message: `Неизвестное заклинание: ${selection.spellId}.` };
    }

    if (!spell.classes.includes(selection.classId)) {
      return {
        valid: false,
        message: `«${spell.nameRu}» недоступно классу ${selection.classId}.`,
      };
    }

    const maxSpellLevel = getMaxSpellLevelForClass(selection.classId, classLevel);
    if (spell.level > 0 && spell.level > maxSpellLevel) {
      return {
        valid: false,
        message: `«${spell.nameRu}» (${spell.level} ур.) недоступно на текущем уровне класса.`,
      };
    }

    const list = selectionsByClass.get(selection.classId) ?? [];
    list.push(selection);
    selectionsByClass.set(selection.classId, list);
  }

  for (const [classId, selections] of selectionsByClass) {
    const classLevel = getClassLevel(build, classId);
    const ability = getSpellcastingAbility(classId)!;
    const abilityMod = build.abilityScores.modifier[ability];

    const cantrips = selections.filter((s) => (getSpellById(s.spellId)?.level ?? -1) === 0);
    const cantripLimit = getCantripsKnown(classId, classLevel);
    if (cantrips.length > cantripLimit) {
      return {
        valid: false,
        message: `Слишком много заговоров для класса (макс. ${cantripLimit}).`,
      };
    }

    const leveled = selections.filter((s) => (getSpellById(s.spellId)?.level ?? 0) > 0);
    const knownLimit = getSpellsKnownLimit(classId, classLevel);
    if (knownLimit !== undefined && leveled.length > knownLimit) {
      return {
        valid: false,
        message: `Слишком много известных заклинаний (макс. ${knownLimit}).`,
      };
    }

    const preparedLimit = getSpellsPreparedLimit(classId, classLevel, abilityMod);
    if (preparedLimit !== undefined) {
      const preparedCount = leveled.filter((s) => s.prepared).length;
      if (preparedCount > preparedLimit) {
        return {
          valid: false,
          message: `Слишком много подготовленных заклинаний (макс. ${preparedLimit}).`,
        };
      }
    }

    const uniqueIds = new Set(selections.map((s) => s.spellId));
    if (uniqueIds.size !== selections.length) {
      return { valid: false, message: "Одно заклинание выбрано более одного раза." };
    }
  }

  return { valid: true };
}

// Re-export weapon attack helper for unified combat/spell step imports.
export { computeWeaponAttack } from "./weaponProficiencies";
