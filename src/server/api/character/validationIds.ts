import { backgrounds, classTable, raceTable } from "~/lib/chronicle/chronicle";
import { raceOptions } from "~/lib/chronicle/generator";
import { PHB_GEAR_CATALOG } from "~/lib/character/phbGearCatalog";
import { PHB_WEAPONS_CATALOG } from "~/lib/character/phbWeaponsCatalog";
import { ALL_SKILLS } from "~/lib/character/skillProficiencies";
import { isPhbCoreClass } from "~/lib/character/phbCoreClasses";
import { getSpellById } from "~/lib/character/dndData";

export const MAX_VALID_IDS_IN_ERROR = 12;

export function formatValidIds(
  ids: readonly string[],
  limit = MAX_VALID_IDS_IN_ERROR,
): string {
  const shown = ids.slice(0, limit);
  const suffix =
    ids.length > limit ? `, … (+${ids.length - limit} more)` : "";
  return `${shown.join(", ")}${suffix}`;
}

export function unknownIdMessage(
  field: string,
  value: string,
  validIds: readonly string[],
): string {
  return `Unknown ${field} "${value}". Valid: ${formatValidIds(validIds)}`;
}

export const VALID_CLASS_IDS = classTable.map((entry) => entry.id);
export const VALID_PHB_CORE_CLASS_IDS = VALID_CLASS_IDS.filter(isPhbCoreClass);
export const VALID_RACE_IDS = raceOptions().map((entry) => entry.id);
export const VALID_BACKGROUND_IDS = backgrounds.map((entry) => entry.id);
export const VALID_SKILL_NAMES = ALL_SKILLS;
export const VALID_WEAPON_IDS = PHB_WEAPONS_CATALOG.map((entry) => entry.id);
export const VALID_GEAR_IDS = PHB_GEAR_CATALOG.map((entry) => entry.id);
export const VALID_PURCHASED_GEAR_IDS = [
  ...new Set([...VALID_GEAR_IDS, ...VALID_WEAPON_IDS]),
];

export function isKnownSpellId(spellId: string): boolean {
  return getSpellById(spellId) !== undefined;
}

export function isKnownClassId(classId: string): boolean {
  return VALID_CLASS_IDS.includes(classId);
}

export function isKnownRaceId(raceId: string): boolean {
  return raceTable.some((entry) => entry.id === raceId);
}
