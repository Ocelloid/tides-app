import { classTable } from "~/lib/chronicle/chronicle";

import type { AbilityKey, CharacterBuild, InventoryItem } from "./types";
import { getPrimaryClassId, getTotalLevel } from "./classLevels";
import {
  ALL_SKILLS,
  CLASS_HIT_DIE,
  CLASS_SAVING_THROWS,
  SKILL_ABILITY,
  type SkillName,
} from "./skillProficiencies";

export {
  PDF_SKILL_FIELD_IDS,
  SAVING_THROW_PDF_FIELDS,
  SKILL_ABILITY,
  SKILL_LABELS_RU,
  formatSkillLabel,
} from "./skillProficiencies";

export type { SkillName } from "./skillProficiencies";

const RACE_SPEED_FT: Record<string, number> = {
  dwarf: 25,
  halfling: 25,
  "lotusden-halfling": 25,
  gnome: 25,
  "forest-gnome": 25,
  "rock-gnome": 25,
  aarakocra: 25,
  "wood-elf": 35,
  "sea-elf": 30,
  "pallid-elf": 30,
  "high-elf": 30,
  "drow-elf": 30,
  elf: 30,
};

const CLASS_NAME_BY_ID = new Map(classTable.map((entry) => [entry.id, entry.name]));

export type CombatStats = {
  level: number;
  proficiencyBonus: number;
  hitPointMaximum: number;
  hitDiceLabel: string;
  hitDiceTotal: number;
  armorClass: number;
  initiative: number;
  speed: number;
  proficientSkills: SkillName[];
  proficientSavingThrows: AbilityKey[];
  skillBonuses: Record<SkillName, number>;
  savingThrowBonuses: Record<AbilityKey, number>;
};

function getClassName(classId: string): string {
  return CLASS_NAME_BY_ID.get(classId) ?? classId;
}

/** PDF ClassLevel string: «Воин 5 / Волшебник 3» — порядок как в classLevels. */
export function formatClassLevelForPdf(build: CharacterBuild): string {
  if (build.classLevels.length === 0) {
    return "";
  }

  return build.classLevels
    .map((entry) => `${getClassName(entry.classId)} ${entry.level}`)
    .join(" / ");
}

function averageHitDieGain(hitDie: number, conMod: number): number {
  return Math.floor(hitDie / 2) + 1 + conMod;
}

/** PHB multiclass HP: max on global level 1, average on all other levels. */
function computeHitPoints(build: CharacterBuild, conMod: number): number {
  if (build.classLevels.length === 0) {
    return 0;
  }

  let total = 0;

  for (const [classIndex, entry] of build.classLevels.entries()) {
    const hitDie = CLASS_HIT_DIE[entry.classId] ?? 8;

    for (let classLevel = 1; classLevel <= entry.level; classLevel++) {
      if (classIndex === 0 && classLevel === 1) {
        total += hitDie + conMod;
      } else {
        total += averageHitDieGain(hitDie, conMod);
      }
    }
  }

  return total;
}

function formatHitDiceLabel(build: CharacterBuild): string {
  const parts: string[] = [];

  for (const entry of build.classLevels) {
    const hitDie = CLASS_HIT_DIE[entry.classId] ?? 8;
    parts.push(entry.level === 1 ? `1d${hitDie}` : `${entry.level}d${hitDie}`);
  }

  return parts.join(" + ");
}

function collectMulticlassSavingThrows(build: CharacterBuild): AbilityKey[] {
  const saves = new Set<AbilityKey>();

  for (const entry of build.classLevels) {
    for (const save of CLASS_SAVING_THROWS[entry.classId] ?? []) {
      saves.add(save);
    }
  }

  return [...saves];
}

export function estimateArmorClass(
  dexMod: number,
  inventory: InventoryItem[],
): number {
  const joined = inventory.map((item) => item.nameRu).join(" ").toLowerCase();

  if (joined.includes("кольчуг") || joined.includes("chain mail")) {
    return 16;
  }

  if (joined.includes("чешуйч") || joined.includes("scale mail")) {
    return 14 + Math.min(dexMod, 2);
  }

  if (joined.includes("кожан") || joined.includes("leather")) {
    return 11 + dexMod;
  }

  if (joined.includes("клёпан") || joined.includes("studded")) {
    return 12 + dexMod;
  }

  let ac = 10 + dexMod;

  if (joined.includes("щит") || joined.includes("shield")) {
    ac += 2;
  }

  return ac;
}

function getRaceSpeed(raceId: string | null): number {
  if (!raceId) {
    return 30;
  }

  return RACE_SPEED_FT[raceId] ?? 30;
}

export function computeCombatStats(build: CharacterBuild): CombatStats | null {
  const classId = getPrimaryClassId(build);
  if (!classId || !build.abilityScores) {
    return null;
  }

  const level = getTotalLevel(build);
  const proficiencyBonus = Math.ceil(level / 4) + 1;
  const modifiers = build.abilityScores.modifier;
  const dexMod = modifiers.dex;
  const conMod = modifiers.con;

  const hitPointMaximum = computeHitPoints(build, conMod);
  const hitDiceLabel = formatHitDiceLabel(build);
  const proficientSavingThrows = collectMulticlassSavingThrows(build);
  const proficientSavingThrowSet = new Set(proficientSavingThrows);

  const proficientSkills = [
    ...build.backgroundSkillChoices,
    ...build.classSkillChoices,
  ];
  const proficientSkillSet = new Set(proficientSkills);

  const skillBonuses = {} as Record<SkillName, number>;
  for (const skill of ALL_SKILLS) {
    const abilityKey = SKILL_ABILITY[skill];
    const abilityMod = modifiers[abilityKey];
    skillBonuses[skill] =
      abilityMod + (proficientSkillSet.has(skill) ? proficiencyBonus : 0);
  }

  const savingThrowBonuses = {} as Record<AbilityKey, number>;
  for (const key of Object.keys(modifiers) as AbilityKey[]) {
    savingThrowBonuses[key] =
      modifiers[key] +
      (proficientSavingThrowSet.has(key) ? proficiencyBonus : 0);
  }

  return {
    level,
    proficiencyBonus,
    hitPointMaximum,
    hitDiceLabel,
    hitDiceTotal: level,
    armorClass: estimateArmorClass(dexMod, build.inventory),
    initiative: dexMod,
    speed: getRaceSpeed(build.raceId),
    proficientSkills,
    proficientSavingThrows,
    skillBonuses,
    savingThrowBonuses,
  };
}
