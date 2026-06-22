import type { CharacterBuild } from "./types";
import { getPrimaryClassId } from "./classLevels";

const BACKGROUND_BASE: Record<string, string> = {
  "luxonborn-acolyte": "acolyte",
  "myriad-operative": "criminal",
  grinner: "entertainer",
  "cobalt-soul-sage": "sage",
  "revelry-pirate": "sailor",
  "augen-trust-spy": "criminal",
  "volstrucker-agent": "criminal",
};

const CLASS_PROFICIENCIES: Record<string, string[]> = {
  barbarian: [
    "Доспехи: лёгкие, средние, щиты",
    "Оружие: простое, воинское",
  ],
  bard: [
    "Доспехи: лёгкие",
    "Оружие: простое, ручные арбалеты, длинные мечи, рапиры, короткие мечи",
    "Инструменты: три музыкальных инструмента на выбор",
  ],
  cleric: [
    "Доспехи: лёгкие, средние, щиты",
    "Оружие: простое",
  ],
  druid: [
    "Доспехи: лёгкие, средние, щиты (не металлические)",
    "Оружие: булавы, кинжалы, дротики, древковое, посохи, скимитары, серпы, пращи, копья",
    "Инструменты: набор травника",
  ],
  fighter: [
    "Доспехи: все, щиты",
    "Оружие: простое, воинское",
  ],
  monk: ["Оружие: простое, короткие мечи"],
  paladin: [
    "Доспехи: все, щиты",
    "Оружие: простое, воинское",
  ],
  ranger: [
    "Доспехи: лёгкие, средние, щиты",
    "Оружие: простое, воинское",
  ],
  rogue: [
    "Доспехи: лёгкие",
    "Оружие: простое, ручные арбалеты, длинные мечи, рапиры, короткие мечи",
    "Инструменты: воровские инструменты",
  ],
  sorcerer: [
    "Оружие: кинжалы, дротики, пращи, посохи, лёгкие арбалеты",
  ],
  warlock: ["Доспехи: лёгкие", "Оружие: простое"],
  wizard: [
    "Оружие: кинжалы, дротики, пращи, посохи, лёгкие арбалеты",
  ],
};

const BACKGROUND_PROFICIENCIES: Record<string, string[]> = {
  acolyte: ["Языки: два на выбор"],
  charlatan: ["Инструменты: набор для маскировки, инструменты жулика"],
  criminal: ["Инструменты: один игровой набор, воровские инструменты"],
  entertainer: [
    "Инструменты: набор для маскировки, один музыкальный инструмент",
  ],
  "folk-hero": [
    "Инструменты: один набор ремесленных инструментов",
    "Транспорт: наземный",
  ],
  "guild-artisan": [
    "Инструменты: один набор ремесленных инструментов",
    "Языки: один на выбор",
  ],
  hermit: ["Инструменты: набор травника", "Языки: один на выбор"],
  noble: ["Инструменты: один игровой набор", "Языки: один на выбор"],
  outlander: ["Инструменты: один музыкальный инструмент"],
  sage: ["Языки: два на выбор"],
  sailor: ["Инструменты: инструменты навигатора", "Транспорт: водный"],
  soldier: ["Инструменты: один игровой набор", "Транспорт: наземный"],
  urchin: ["Инструменты: набор для маскировки, воровские инструменты"],
};

const RACE_LANGUAGES: Record<string, string[]> = {
  dwarf: ["Общий", "Дворфийский"],
  elf: ["Общий", "Эльфийский"],
  "high-elf": ["Общий", "Эльфийский"],
  "wood-elf": ["Общий", "Эльфийский"],
  "drow-elf": ["Общий", "Эльфийский"],
  "sea-elf": ["Общий", "Эльфийский"],
  "pallid-elf": ["Общий", "Эльфийский"],
  halfling: ["Общий", "Halfling"],
  "lotusden-halfling": ["Общий", "Halfling"],
  gnome: ["Общий", "Gnomish"],
  "forest-gnome": ["Общий", "Gnomish"],
  "rock-gnome": ["Общий", "Gnomish"],
  human: ["Общий", "язык на выбор"],
  "half-elf": ["Общий", "Эльфийский", "язык на выбор"],
  "half-orc": ["Общий", "Orcish"],
  orc: ["Общий", "Orcish"],
  tiefling: ["Общий", "Infernal"],
  dragonborn: ["Общий", "Draconic"],
  draconblood: ["Общий", "Draconic"],
  ravenite: ["Общий", "Draconic"],
  tabaxi: ["Общий", "язык на выбор"],
  aarakocra: ["Общий", "Auran"],
  aasimar: ["Общий", "Celestial"],
  "protector-aasimar": ["Общий", "Celestial"],
  "scourge-aasimar": ["Общий", "Celestial"],
  "fallen-aasimar": ["Общий", "Celestial"],
  firbolg: ["Общий", "Elvish", "Giant"],
  genasi: ["Общий", "Primordial"],
  "air-genasi": ["Общий", "Primordial"],
  "earth-genasi": ["Общий", "Primordial"],
  "fire-genasi": ["Общий", "Primordial"],
  "water-genasi": ["Общий", "Primordial"],
  goblin: ["Общий", "Goblin"],
  hobgoblin: ["Общий", "Goblin"],
  bugbear: ["Общий", "Goblin"],
  goliath: ["Общий", "Giant"],
  kenku: ["Общий", "Auran"],
  tortle: ["Общий", "Aquan"],
  "hollow-one": ["Общий", "язык на выбор"],
};

function resolveBackgroundId(backgroundId: string): string {
  return BACKGROUND_BASE[backgroundId] ?? backgroundId;
}

function uniqueLines(lines: string[]): string[] {
  return [...new Set(lines.filter((line) => line.trim() !== ""))];
}

export function formatProficienciesAndLanguages(build: CharacterBuild): string {
  const sections: string[] = [];

  const classId = getPrimaryClassId(build);
  if (classId) {
    const classLines = CLASS_PROFICIENCIES[classId] ?? [];
    if (classLines.length > 0) {
      sections.push(`Класс: ${classLines.join("; ")}`);
    }
  }

  if (build.backgroundId) {
    const baseId = resolveBackgroundId(build.backgroundId);
    const backgroundLines = BACKGROUND_PROFICIENCIES[baseId] ?? [];
    if (backgroundLines.length > 0) {
      sections.push(`Предыстория: ${backgroundLines.join("; ")}`);
    }
  }

  const languages: string[] = [];
  if (build.raceId) {
    languages.push(...(RACE_LANGUAGES[build.raceId] ?? ["Общий"]));
  }

  const uniqueLangs = uniqueLines(languages);
  if (uniqueLangs.length > 0) {
    sections.push(`Языки: ${uniqueLangs.join(", ")}`);
  }

  return sections.join("\n");
}
