import { getTotalLevel } from "./classLevels";
import type { PhbWeapon } from "./phbWeaponsCatalog";
import type { CharacterBuild, WeaponAttack } from "./types";

export type WeaponProficiency = {
  simple: boolean;
  martial: boolean;
  /** Дополнительные id из PHB_WEAPONS_CATALOG (union по классам). */
  specificIds?: readonly string[];
};

/** PHB weapon proficiencies по classId — не текстовые строки из proficienciesAndLanguages. */
export const CLASS_WEAPON_PROFICIENCIES: Record<string, WeaponProficiency> = {
  barbarian: { simple: true, martial: true },
  bard: {
    simple: true,
    martial: false,
    specificIds: ["hand-crossbow", "longsword", "rapier", "shortsword"],
  },
  cleric: { simple: true, martial: false },
  druid: {
    simple: false,
    martial: false,
    specificIds: [
      "club",
      "dagger",
      "dart",
      "javelin",
      "mace",
      "quarterstaff",
      "scimitar",
      "sickle",
      "sling",
      "spear",
    ],
  },
  fighter: { simple: true, martial: true },
  monk: {
    simple: true,
    martial: false,
    specificIds: ["shortsword"],
  },
  paladin: { simple: true, martial: true },
  ranger: { simple: true, martial: true },
  rogue: {
    simple: true,
    martial: false,
    specificIds: ["hand-crossbow", "longsword", "rapier", "shortsword"],
  },
  sorcerer: {
    simple: false,
    martial: false,
    specificIds: ["dagger", "dart", "quarterstaff", "sling", "light-crossbow"],
  },
  warlock: { simple: true, martial: false },
  wizard: {
    simple: false,
    martial: false,
    specificIds: ["dagger", "dart", "quarterstaff", "sling", "light-crossbow"],
  },
};

function classHasWeaponProficiency(classId: string, weapon: PhbWeapon): boolean {
  const prof = CLASS_WEAPON_PROFICIENCIES[classId];
  if (!prof) {
    return false;
  }

  if (weapon.category === "simple" && prof.simple) {
    return true;
  }

  if (weapon.category === "martial" && prof.martial) {
    return true;
  }

  return prof.specificIds?.includes(weapon.id) ?? false;
}

/** Union proficiencies по всем classLevels в build. */
export function hasWeaponProficiency(build: CharacterBuild, weapon: PhbWeapon): boolean {
  for (const entry of build.classLevels) {
    if (classHasWeaponProficiency(entry.classId, weapon)) {
      return true;
    }
  }

  return false;
}

function weaponAbilityModifier(
  weapon: PhbWeapon,
  strMod: number,
  dexMod: number,
): number {
  if (weapon.finesse) {
    return Math.max(strMod, dexMod);
  }

  if (weapon.ranged) {
    return dexMod;
  }

  return strMod;
}

function formatDamageWithModifier(damage: string, abilityMod: number): string {
  if (abilityMod === 0) {
    return damage;
  }

  const sign = abilityMod > 0 ? "+" : "";
  return `${damage}${sign}${abilityMod}`;
}

export function computeWeaponAttack(
  build: CharacterBuild,
  weapon: PhbWeapon,
  proficiencyBonus: number,
  modifiers: Record<"str" | "dex" | "con" | "int" | "wis" | "cha", number>,
): WeaponAttack {
  const strMod = modifiers.str;
  const dexMod = modifiers.dex;
  const abilityMod = weaponAbilityModifier(weapon, strMod, dexMod);
  const proficient = hasWeaponProficiency(build, weapon);
  const attackBonus = abilityMod + (proficient ? proficiencyBonus : 0);

  return {
    weaponId: weapon.id,
    name: weapon.nameRu,
    attackBonus,
    damage: formatDamageWithModifier(weapon.damage, abilityMod),
  };
}

/** Monk unarmed strike — optional default attack (1d4 + DEX at level 1+). */
export function computeMonkUnarmedAttack(
  build: CharacterBuild,
  proficiencyBonus: number,
  dexMod: number,
): WeaponAttack | null {
  const monkEntry = build.classLevels.find((entry) => entry.classId === "monk");
  if (!monkEntry) {
    return null;
  }

  const profBonus = monkEntry.level > 0 ? proficiencyBonus : 0;

  return {
    name: "Безоружный удар",
    attackBonus: dexMod + profBonus,
    damage: formatDamageWithModifier("1d4", dexMod),
  };
}
