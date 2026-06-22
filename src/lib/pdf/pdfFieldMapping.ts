import type { AbilityKey } from "~/lib/character/types";
import type { SkillName } from "~/lib/character/skillProficiencies";

/** Verified by widget position on DnD5e_character_sheet_RUS.pdf page 1. */
export const PDF_SAVING_THROW_CHECKBOX: Record<AbilityKey, string> = {
  str: "Check Box 11",
  dex: "Check Box 18",
  con: "Check Box 19",
  int: "Check Box 20",
  wis: "Check Box 21",
  cha: "Check Box 22",
};

/** Skill proficiency circles (page 1), matched to modifier fields by Y coordinate. */
export const PDF_SKILL_PROFICIENCY_CHECKBOX: Record<SkillName, string> = {
  Acrobatics: "Check Box 23",
  Investigation: "Check Box 24",
  Athletics: "Check Box 25",
  Perception: "Check Box 26",
  Survival: "Check Box 27",
  Performance: "Check Box 28",
  Intimidation: "Check Box 29",
  History: "Check Box 30",
  "Sleight of Hand": "Check Box 31",
  Arcana: "Check Box 32",
  Medicine: "Check Box 33",
  Deception: "Check Box 34",
  Nature: "Check Box 35",
  Insight: "Check Box 36",
  Religion: "Check Box 37",
  Stealth: "Check Box 38",
  Persuasion: "Check Box 39",
  "Animal Handling": "Check Box 40",
};

export const PDF_PASSIVE_FIELD_ID = "Passive";
export const PDF_PROFICIENCIES_LANG_FIELD_ID = "ProficienciesLang_OVQQ";
