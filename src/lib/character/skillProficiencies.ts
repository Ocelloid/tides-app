import type { AbilityKey } from "./types";

/** PDF AcroForm skill field ids (page 1). */
export const PDF_SKILL_FIELD_IDS = {
  Acrobatics: "Acrobatics",
  "Animal Handling": "Animal",
  Arcana: "Arcana",
  Athletics: "Athletics",
  Deception: "Deception",
  History: "History",
  Insight: "Insight",
  Intimidation: "Intimidation",
  Investigation: "Investigation",
  Medicine: "Medicine",
  Nature: "Nature",
  Perception: "Perception",
  Performance: "Performance",
  Persuasion: "Persuasion",
  Religion: "Religion",
  "Sleight of Hand": "SleightofHand",
  Stealth: "Stealth",
  Survival: "Survival",
} as const;

export type SkillName = keyof typeof PDF_SKILL_FIELD_IDS;

export const ALL_SKILLS = Object.keys(PDF_SKILL_FIELD_IDS) as SkillName[];

export const SKILL_ABILITY: Record<SkillName, AbilityKey> = {
  Acrobatics: "dex",
  "Animal Handling": "wis",
  Arcana: "int",
  Athletics: "str",
  Deception: "cha",
  History: "int",
  Insight: "wis",
  Intimidation: "cha",
  Investigation: "int",
  Medicine: "wis",
  Nature: "int",
  Perception: "wis",
  Performance: "cha",
  Persuasion: "cha",
  Religion: "int",
  "Sleight of Hand": "dex",
  Stealth: "dex",
  Survival: "wis",
};

export const SKILL_LABELS_RU: Record<SkillName, string> = {
  Acrobatics: "Акробатика",
  "Animal Handling": "Уход за животными",
  Arcana: "Магия",
  Athletics: "Атлетика",
  Deception: "Обман",
  History: "История",
  Insight: "Проницательность",
  Intimidation: "Запугивание",
  Investigation: "Анализ",
  Medicine: "Медицина",
  Nature: "Природа",
  Perception: "Внимание",
  Performance: "Выступление",
  Persuasion: "Убеждение",
  Religion: "Религия",
  "Sleight of Hand": "Ловкость рук",
  Stealth: "Скрытность",
  Survival: "Выживание",
};

const BACKGROUND_SKILL_BASE: Record<string, string> = {
  "luxonborn-acolyte": "acolyte",
  "myriad-operative": "criminal",
  grinner: "entertainer",
  "cobalt-soul-sage": "sage",
  "revelry-pirate": "sailor",
  "augen-trust-spy": "criminal",
  "volstrucker-agent": "criminal",
};

/** PHB background skill grants (2 skills each). */
const BACKGROUND_SKILL_GRANTS: Record<string, SkillName[]> = {
  acolyte: ["Insight", "Religion"],
  charlatan: ["Deception", "Sleight of Hand"],
  criminal: ["Deception", "Stealth"],
  entertainer: ["Acrobatics", "Performance"],
  "folk-hero": ["Animal Handling", "Survival"],
  "guild-artisan": ["Insight", "Persuasion"],
  hermit: ["Medicine", "Religion"],
  noble: ["History", "Persuasion"],
  outlander: ["Athletics", "Survival"],
  sage: ["Arcana", "History"],
  sailor: ["Athletics", "Perception"],
  soldier: ["Athletics", "Intimidation"],
  urchin: ["Sleight of Hand", "Stealth"],
};

/**
 * Optional larger pools for backgrounds where player picks 2 of N.
 * If absent, the fixed grant is used as both options and default selection.
 */
const BACKGROUND_SKILL_POOLS: Record<string, SkillName[]> = {
  acolyte: ["Insight", "Religion", "History", "Persuasion"],
  sage: ["Arcana", "History", "Investigation", "Religion"],
  noble: ["History", "Persuasion", "Insight", "Deception"],
  soldier: ["Athletics", "Intimidation", "Survival", "Perception"],
  sailor: ["Athletics", "Perception", "Survival", "Acrobatics"],
  outlander: ["Athletics", "Survival", "Nature", "Stealth"],
  "folk-hero": ["Animal Handling", "Survival", "Athletics", "Nature"],
  entertainer: ["Acrobatics", "Performance", "Persuasion", "Deception"],
  criminal: ["Deception", "Stealth", "Sleight of Hand", "Intimidation"],
  charlatan: ["Deception", "Sleight of Hand", "Persuasion", "Performance"],
  "guild-artisan": ["Insight", "Persuasion", "Investigation", "History"],
  hermit: ["Medicine", "Religion", "Nature", "Survival"],
  urchin: ["Sleight of Hand", "Stealth", "Perception", "Athletics"],
};

export const CLASS_SKILL_COUNT: Record<string, number> = {
  barbarian: 2,
  bard: 3,
  cleric: 2,
  druid: 2,
  fighter: 2,
  monk: 2,
  paladin: 2,
  ranger: 3,
  rogue: 4,
  sorcerer: 2,
  warlock: 2,
  wizard: 2,
};

export const CLASS_SKILL_OPTIONS: Record<string, SkillName[]> = {
  barbarian: [
    "Animal Handling",
    "Athletics",
    "Intimidation",
    "Nature",
    "Perception",
    "Survival",
  ],
  bard: ALL_SKILLS,
  cleric: ["History", "Insight", "Medicine", "Persuasion", "Religion"],
  druid: [
    "Arcana",
    "Animal Handling",
    "Insight",
    "Medicine",
    "Nature",
    "Perception",
    "Religion",
    "Survival",
  ],
  fighter: [
    "Acrobatics",
    "Animal Handling",
    "Athletics",
    "History",
    "Insight",
    "Intimidation",
    "Perception",
    "Survival",
  ],
  monk: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"],
  paladin: [
    "Athletics",
    "Insight",
    "Intimidation",
    "Medicine",
    "Persuasion",
    "Religion",
  ],
  ranger: [
    "Animal Handling",
    "Athletics",
    "Insight",
    "Investigation",
    "Nature",
    "Perception",
    "Stealth",
    "Survival",
  ],
  rogue: [
    "Acrobatics",
    "Athletics",
    "Deception",
    "Insight",
    "Intimidation",
    "Investigation",
    "Perception",
    "Performance",
    "Persuasion",
    "Sleight of Hand",
    "Stealth",
  ],
  sorcerer: [
    "Arcana",
    "Deception",
    "Insight",
    "Intimidation",
    "Persuasion",
    "Religion",
  ],
  warlock: [
    "Arcana",
    "Deception",
    "History",
    "Intimidation",
    "Investigation",
    "Nature",
    "Religion",
  ],
  wizard: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
};

export const CLASS_SAVING_THROWS: Record<string, AbilityKey[]> = {
  barbarian: ["str", "con"],
  bard: ["dex", "cha"],
  cleric: ["wis", "cha"],
  druid: ["int", "wis"],
  fighter: ["str", "con"],
  monk: ["str", "dex"],
  paladin: ["wis", "cha"],
  ranger: ["str", "dex"],
  rogue: ["dex", "int"],
  sorcerer: ["con", "cha"],
  warlock: ["wis", "cha"],
  wizard: ["int", "wis"],
};

export const CLASS_HIT_DIE: Record<string, number> = {
  barbarian: 12,
  bard: 8,
  cleric: 8,
  druid: 8,
  fighter: 10,
  monk: 8,
  paladin: 10,
  ranger: 10,
  rogue: 8,
  sorcerer: 6,
  warlock: 8,
  wizard: 6,
};

export const SAVING_THROW_PDF_FIELDS: Record<AbilityKey, string> = {
  str: "ST Strength",
  dex: "ST Dexterity",
  con: "ST Constitution",
  int: "ST Intelligence",
  wis: "ST Wisdom",
  cha: "ST Charisma",
};

const BACKGROUND_SKILL_PICK_COUNT = 2;

function resolveBackgroundId(backgroundId: string): string {
  return BACKGROUND_SKILL_BASE[backgroundId] ?? backgroundId;
}

export function getBackgroundSkillGrant(backgroundId: string): SkillName[] {
  const baseId = resolveBackgroundId(backgroundId);
  return BACKGROUND_SKILL_GRANTS[baseId] ?? [];
}

export function getBackgroundSkillOptions(backgroundId: string): SkillName[] {
  const baseId = resolveBackgroundId(backgroundId);
  const pool = BACKGROUND_SKILL_POOLS[baseId];
  if (pool) {
    return pool;
  }

  return getBackgroundSkillGrant(backgroundId);
}

export function getBackgroundSkillPickCount(): number {
  return BACKGROUND_SKILL_PICK_COUNT;
}

export function getDefaultBackgroundSkillChoices(
  backgroundId: string,
): SkillName[] {
  const grant = getBackgroundSkillGrant(backgroundId);
  if (grant.length >= BACKGROUND_SKILL_PICK_COUNT) {
    return grant.slice(0, BACKGROUND_SKILL_PICK_COUNT);
  }

  const options = getBackgroundSkillOptions(backgroundId);
  return options.slice(0, BACKGROUND_SKILL_PICK_COUNT);
}

export function getClassSkillPickCount(classId: string): number {
  return CLASS_SKILL_COUNT[classId] ?? 2;
}

export function getClassSkillOptions(
  classId: string,
  backgroundSkills: SkillName[] = [],
): SkillName[] {
  const options = CLASS_SKILL_OPTIONS[classId] ?? [];
  const blocked = new Set(backgroundSkills);

  return options.filter((skill) => !blocked.has(skill));
}

export function formatSkillLabel(skill: SkillName): string {
  const ability = SKILL_ABILITY[skill].toUpperCase();
  return `${SKILL_LABELS_RU[skill]} (${ability})`;
}

export function validateBackgroundSkillChoices(
  backgroundId: string | null,
  choices: SkillName[],
): { valid: boolean; message?: string } {
  if (!backgroundId) {
    return { valid: false, message: "Сначала выберите предысторию." };
  }

  const options = new Set(getBackgroundSkillOptions(backgroundId));
  const pickCount = getBackgroundSkillPickCount();

  if (choices.length !== pickCount) {
    return {
      valid: false,
      message: `Выберите ${pickCount} навыка предыстории.`,
    };
  }

  if (new Set(choices).size !== choices.length) {
    return { valid: false, message: "Навыки предыстории не должны повторяться." };
  }

  for (const skill of choices) {
    if (!options.has(skill)) {
      return { valid: false, message: "Выбран недопустимый навык предыстории." };
    }
  }

  return { valid: true };
}

export function validateClassSkillChoices(
  classId: string | null,
  backgroundSkills: SkillName[],
  choices: SkillName[],
): { valid: boolean; message?: string } {
  if (!classId) {
    return { valid: false, message: "Сначала выберите класс." };
  }

  const options = new Set(getClassSkillOptions(classId, backgroundSkills));
  const pickCount = getClassSkillPickCount(classId);

  if (choices.length !== pickCount) {
    return {
      valid: false,
      message: `Выберите ${pickCount} навыка класса.`,
    };
  }

  if (new Set(choices).size !== choices.length) {
    return { valid: false, message: "Навыки класса не должны повторяться." };
  }

  for (const skill of choices) {
    if (!options.has(skill)) {
      return {
        valid: false,
        message: "Выбран недопустимый навык класса или дубликат предыстории.",
      };
    }
  }

  return { valid: true };
}
