import type { AbilityKey } from "~/lib/character";

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "Сила",
  dex: "Ловкость",
  con: "Телосложение",
  int: "Интеллект",
  wis: "Мудрость",
  cha: "Харизма",
};

export const ABILITY_ABBREVIATIONS: Record<AbilityKey, string> = {
  str: "STR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

export function formatAbilityModifier(modifier: number): string {
  if (modifier >= 0) {
    return `+${modifier}`;
  }

  return `\u2212${Math.abs(modifier)}`;
}
