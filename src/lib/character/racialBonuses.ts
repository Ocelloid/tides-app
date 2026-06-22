import { raceTable } from "~/lib/chronicle/chronicle";

import type { AbilityKey, AbilityScores } from "./types";

export type RacialAsiDefinition =
  | { kind: "fixed"; bonus: Partial<AbilityScores> }
  | {
      kind: "flex";
      fixed: Partial<AbilityScores>;
      flexCount: number;
      flexAmount: number;
    };

/**
 * Racial ASI by race id (PHB 2014 + EGtW / VGtM where noted).
 * Wildemount-only variants inherit published subrace bonuses; hollow-one has no ASI.
 */
export const racialAsiByRaceId: Record<string, RacialAsiDefinition> = {
  // Base races (included even when subraces exist)
  dwarf: { kind: "fixed", bonus: { con: 2 } },
  elf: { kind: "fixed", bonus: { dex: 2 } },
  "pallid-elf": { kind: "fixed", bonus: { dex: 2, wis: 1 } },
  "sea-elf": { kind: "fixed", bonus: { dex: 2, con: 1 } },
  halfling: { kind: "fixed", bonus: { dex: 2 } },
  "lotusden-halfling": { kind: "fixed", bonus: { dex: 2, wis: 1 } },
  human: {
    kind: "fixed",
    bonus: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
  },
  aarakocra: { kind: "fixed", bonus: { dex: 2, wis: 1 } },
  aasimar: { kind: "fixed", bonus: { cha: 2 } },
  "protector-aasimar": { kind: "fixed", bonus: { cha: 2, wis: 1 } },
  "scourge-aasimar": { kind: "fixed", bonus: { cha: 2, con: 1 } },
  "fallen-aasimar": { kind: "fixed", bonus: { cha: 2, str: 1 } },
  dragonborn: { kind: "fixed", bonus: { str: 2, cha: 1 } },
  draconblood: { kind: "fixed", bonus: { int: 2, cha: 1 } },
  ravenite: { kind: "fixed", bonus: { str: 2, con: 1 } },
  firbolg: { kind: "fixed", bonus: { str: 2, wis: 1 } },
  genasi: { kind: "fixed", bonus: { con: 2 } },
  "air-genasi": { kind: "fixed", bonus: { con: 2, dex: 1 } },
  "earth-genasi": { kind: "fixed", bonus: { con: 2, str: 1 } },
  "fire-genasi": { kind: "fixed", bonus: { con: 2, int: 1 } },
  "water-genasi": { kind: "fixed", bonus: { con: 2, wis: 1 } },
  gnome: { kind: "fixed", bonus: { int: 2 } },
  goblin: { kind: "fixed", bonus: { dex: 2, con: 1 } },
  hobgoblin: { kind: "fixed", bonus: { con: 2, int: 1 } },
  bugbear: { kind: "fixed", bonus: { str: 2, dex: 1 } },
  goliath: { kind: "fixed", bonus: { str: 2, con: 1 } },
  "half-elf": {
    kind: "flex",
    fixed: { cha: 2 },
    flexCount: 2,
    flexAmount: 1,
  },
  kenku: { kind: "fixed", bonus: { dex: 2, wis: 1 } },
  orc: { kind: "fixed", bonus: { str: 2, con: 1 } },
  "half-orc": { kind: "fixed", bonus: { str: 2, con: 1 } },
  tabaxi: { kind: "fixed", bonus: { dex: 2, cha: 1 } },
  tiefling: { kind: "fixed", bonus: { cha: 2, int: 1 } },
  tortle: { kind: "fixed", bonus: { str: 2, wis: 1 } },
  // EGtW supernatural gift — no ability score increase
  "hollow-one": { kind: "fixed", bonus: {} },
};

export function getRacialAsiDefinition(
  raceId: string,
): RacialAsiDefinition | null {
  return racialAsiByRaceId[raceId] ?? null;
}

export function emptyAbilityScores(): AbilityScores {
  return { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
}

export function applyFixedBonus(
  target: AbilityScores,
  bonus: Partial<AbilityScores>,
): AbilityScores {
  const result = { ...target };
  for (const [key, value] of Object.entries(bonus) as [AbilityKey, number][]) {
    result[key] += value;
  }
  return result;
}

/** Human-readable racial ASI for race detail panel. */
export function formatRacialAsiText(raceId: string): string | null {
  const definition = getRacialAsiDefinition(raceId);
  if (!definition) {
    return null;
  }

  const abilityLabels: Record<AbilityKey, string> = {
    str: "Сила",
    dex: "Ловкость",
    con: "Телосложение",
    int: "Интеллект",
    wis: "Мудрость",
    cha: "Харизма",
  };

  if (definition.kind === "flex") {
    const fixedParts = Object.entries(definition.fixed)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => `+${value} ${abilityLabels[key as AbilityKey]}`);

    const fixedText =
      fixedParts.length > 0 ? fixedParts.join(", ") : "";
    const flexText = `+${definition.flexAmount} к ${definition.flexCount} другим характеристикам на выбор`;

    return fixedText ? `${fixedText}; ${flexText}` : flexText;
  }

  const parts = Object.entries(definition.bonus)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `+${value} ${abilityLabels[key as AbilityKey]}`);

  if (parts.length === 0) {
    return "Без повышения характеристик";
  }

  return parts.join(", ");
}

/** Ensures every raceTable id has an ASI entry (compile-time / smoke guard). */
export function assertAllRacesHaveAsi(): void {
  for (const race of raceTable) {
    if (!(race.id in racialAsiByRaceId)) {
      throw new Error(`Missing racial ASI for race id: ${race.id}`);
    }
  }
}
