import {
  abilityModifier,
  assertAllRacesHaveAsi,
  computeAbilityScoreState,
  getClassRecommendations,
  getPointBuyCost,
  getRemainingPoints,
  validateFlexChoices,
} from "../src/lib/character";

// All raceTable ids must have ASI entries
assertAllRacesHaveAsi();

// Point buy: 27 points exhausted at 15,15,15,8,8,8
const pointBuyBase = {
  str: 15,
  dex: 15,
  con: 15,
  int: 8,
  wis: 8,
  cha: 8,
};

const pointBuyCost = getPointBuyCost(pointBuyBase);
if (pointBuyCost !== 27) {
  throw new Error(`Expected point buy cost 27, got ${pointBuyCost}`);
}

const remaining = getRemainingPoints(pointBuyBase);
if (remaining !== 0) {
  throw new Error(`Expected 0 remaining points, got ${remaining}`);
}

// Dwarf +2 CON applied to total
const dwarfState = computeAbilityScoreState(
  "point-buy",
  pointBuyBase,
  "dwarf",
);
if (dwarfState.racialBonus.con !== 2) {
  throw new Error(`Expected dwarf +2 CON bonus, got ${dwarfState.racialBonus.con}`);
}
if (dwarfState.total.con !== 17) {
  throw new Error(`Expected dwarf total CON 17, got ${dwarfState.total.con}`);
}
if (dwarfState.modifier.con !== abilityModifier(17)) {
  throw new Error("Dwarf CON modifier mismatch");
}

// Half-elf flex: +2 CHA + two +1 → CHA 15 with base 13, selected +1 on STR and DEX
const halfElfBase = {
  str: 13,
  dex: 13,
  con: 8,
  int: 8,
  wis: 8,
  cha: 13,
};
const halfElfFlex: ["str", "dex"] = ["str", "dex"];
const flexValidation = validateFlexChoices("half-elf", halfElfFlex);
if (!flexValidation.valid) {
  throw new Error(`Half-elf flex validation failed: ${flexValidation.message}`);
}

const halfElfState = computeAbilityScoreState(
  "manual",
  halfElfBase,
  "half-elf",
  halfElfFlex,
);
if (halfElfState.total.cha !== 15) {
  throw new Error(`Expected half-elf total CHA 15, got ${halfElfState.total.cha}`);
}
if (halfElfState.total.str !== 14) {
  throw new Error(`Expected half-elf total STR 14, got ${halfElfState.total.str}`);
}
if (halfElfState.total.dex !== 14) {
  throw new Error(`Expected half-elf total DEX 14, got ${halfElfState.total.dex}`);
}

// Class recommendations for all 12 PHB core classes
const coreClasses = [
  "barbarian",
  "bard",
  "cleric",
  "druid",
  "fighter",
  "monk",
  "paladin",
  "ranger",
  "rogue",
  "sorcerer",
  "warlock",
  "wizard",
] as const;

for (const classId of coreClasses) {
  const recommendations = getClassRecommendations(classId);
  if (recommendations.length === 0) {
    throw new Error(`Missing class recommendations for ${classId}`);
  }
}

console.log("ability-scores-smoke: OK");
console.log(
  `Dwarf CON total: ${dwarfState.total.con}, Half-elf CHA total: ${halfElfState.total.cha}`,
);
