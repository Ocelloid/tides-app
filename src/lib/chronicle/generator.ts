import {
  ageTable,
  allyRelations,
  backgrounds,
  classTable,
  cityFamilySize,
  contactStats,
  eyeColorTable,
  familyRelations,
  fateMoments,
  foodTables,
  genderTable,
  hairColorTable,
  homelandTable,
  prophecies,
  raceRegionNames,
  raceRegionOrder,
  raceTable,
  rivalRelations,
  secrets,
  settlements,
  skinColorTable,
  socialColumnNames,
  socialRelations,
  statusTable,
  villageFamilySize,
  type AppearanceEntry,
  type Background,
  type ClassEntry,
  type FamilySize,
  type FoodEntry,
  type Homeland,
  type RaceEntry,
  type RangeEntry,
  type Settlement,
  type TextEntry
} from "./chronicle";

export type RollResult<T> = {
  roll: number;
  entry: T;
};

export type ContactKind = "ally" | "rival";

export type Contact = {
  kind: ContactKind;
  relation: RollResult<TextEntry>;
  stat: RollResult<TextEntry & { fateMoments: number }>;
};

export type CountKey = "allies" | "rivals" | "fate" | "secrets" | "prophecies";

export type Chronicle = {
  race: RollResult<RaceEntry>;
  characterClass: RollResult<ClassEntry>;
  gender: RollResult<AppearanceEntry>;
  age: RollResult<AppearanceEntry>;
  status: RollResult<AppearanceEntry>;
  hairColor: RollResult<AppearanceEntry>;
  eyeColor: RollResult<AppearanceEntry>;
  skinColor: RollResult<AppearanceEntry>;
  homeland: RollResult<Homeland>;
  government: string;
  settlement: RollResult<Settlement>;
  background: RollResult<Background>;
  socialRelationText: string;
  socialAllyCount: number;
  socialRivalCount: number;
  allyCount: number;
  rivalCount: number;
  fateCount: number;
  secretCount: number;
  prophecyCount: number;
  familySize: RollResult<FamilySize>;
  siblingCount: number;
  familyRelation: RollResult<TextEntry>;
  allies: Contact[];
  rivals: Contact[];
  fate: RollResult<TextEntry>[];
  food: RollResult<FoodEntry>;
  secrets: RollResult<TextEntry>[];
  prophecyList: RollResult<TextEntry>[];
};

export type SectionKey =
  | "race"
  | "characterClass"
  | "gender"
  | "age"
  | "status"
  | "hairColor"
  | "eyeColor"
  | "skinColor"
  | "homeland"
  | "settlement"
  | "background"
  | "family"
  | "familyRelation"
  | "ally"
  | "rival"
  | "contacts"
  | "fate"
  | "food"
  | "secret"
  | "prophecies";

const MAX_BLOCK_COUNT = 5;

function raceWeight(entry: RaceEntry): number {
  return entry.category === "subrace" || entry.category === "variant" ? 1 : 4;
}

function formatRangeLabel(min: number, max: number): string {
  return min === max ? String(min) : `${min}-${max}`;
}

function buildWeightedRaceTable(): RaceEntry[] {
  let nextMin = 1;
  const weighted: RaceEntry[] = [];

  for (const entry of raceTable) {
    const weight = raceWeight(entry);
    const min = nextMin;
    const max = nextMin + weight - 1;
    weighted.push({
      ...entry,
      min,
      max,
      label: formatRangeLabel(min, max)
    });
    nextMin = max + 1;
  }

  return weighted;
}

const weightedRaceTable = buildWeightedRaceTable();

function diceSides(table: Array<{ max: number }>): number {
  return Math.max(0, ...table.map((entry) => entry.max));
}

const RACE_DICE_SIDES = diceSides(weightedRaceTable);
const CLASS_DICE_SIDES = diceSides(classTable);
const GENDER_DICE_SIDES = diceSides(genderTable);
const AGE_DICE_SIDES = diceSides(ageTable);
const STATUS_DICE_SIDES = diceSides(statusTable);
const HAIR_COLOR_DICE_SIDES = diceSides(hairColorTable);
const EYE_COLOR_DICE_SIDES = diceSides(eyeColorTable);
const SKIN_COLOR_DICE_SIDES = diceSides(skinColorTable);

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollForTable<T extends RangeEntry>(table: T[], sides: number): RollResult<T> {
  const roll = randomInt(1, sides);
  const entry = findByRoll(table, roll);
  return { roll, entry };
}

function findByRoll<T extends RangeEntry>(table: T[], roll: number): T {
  const normalized = roll === 0 ? 100 : roll;
  const entry = table.find((item) => normalized >= item.min && normalized <= item.max);
  if (!entry) {
    throw new Error("No table entry for roll " + roll);
  }
  return entry;
}

function findById<T extends RangeEntry>(table: T[], id: string): T {
  const entry = table.find((item) => item.id === id);
  if (!entry) {
    throw new Error("No table entry with id " + id);
  }
  return entry;
}

function rollById<T extends RangeEntry>(table: T[], id: string): RollResult<T> {
  const entry = findById(table, id);
  return { roll: entry.min, entry };
}

function randomChoice<T>(items: T[]): T {
  const item = items[randomInt(0, items.length - 1)];
  if (item === undefined) {
    throw new Error("Empty choice list");
  }
  return item;
}

function clampCount(count: number): number {
  if (!Number.isFinite(count)) {
    return 0;
  }
  return Math.max(0, Math.min(MAX_BLOCK_COUNT, Math.trunc(count)));
}

function generateRolls<T extends RangeEntry>(table: T[], sides: number, count: number): RollResult<T>[] {
  const rolls: RollResult<T>[] = [];
  for (let index = 0; index < clampCount(count); index += 1) {
    rolls.push(rollForTable(table, sides));
  }
  return rolls;
}

function resizeRolls<T extends RangeEntry>(current: RollResult<T>[], table: T[], sides: number, count: number): RollResult<T>[] {
  const targetCount = clampCount(count);
  const next = current.slice(0, targetCount);
  for (let index = next.length; index < targetCount; index += 1) {
    next.push(rollForTable(table, sides));
  }
  return next;
}

function rollFormula(formula: string): number {
  if (formula === "0") {
    return 0;
  }

  const match = /^(\d+)к(\d+)(?:\+(\d+))?$/.exec(formula);
  if (!match) {
    return 0;
  }

  const count = Number(match[1]);
  const sides = Number(match[2]);
  const bonus = Number(match[3] ?? 0);
  let total = bonus;

  for (let index = 0; index < count; index += 1) {
    total += randomInt(1, sides);
  }

  return total;
}

function relationCounts(text: string): { allies: number; rivals: number } {
  if (text === "—") {
    return { allies: 0, rivals: 0 };
  }

  return {
    allies: text.includes("союзник") ? 1 : 0,
    rivals: text.includes("соперник") ? 1 : 0
  };
}

function familyRelationCounts(text: string): { allies: number; rivals: number } {
  if (text.includes("союзника")) {
    return { allies: 1, rivals: 0 };
  }
  if (text.includes("соперника")) {
    return { allies: 0, rivals: 1 };
  }
  return { allies: 0, rivals: 0 };
}

function resolveSocialRelation(homeland: Homeland, government: string, background: Background) {
  const base = socialRelations[background.id]?.[homeland.socialColumn] ?? "—";
  const baseCounts = relationCounts(base);

  if (government === "Утодурн") {
    return {
      text: base === "—" ? "—" : base + " (для Утодурна союзники и соперники меняются местами)",
      allies: baseCounts.rivals,
      rivals: baseCounts.allies
    };
  }

  return {
    text: base,
    allies: baseCounts.allies,
    rivals: baseCounts.rivals
  };
}

function isVillageLike(settlement: Settlement): boolean {
  return settlement.type.includes("Деревня") || settlement.type.includes("диаспора");
}

function generateContacts(kind: ContactKind, count: number): Contact[] {
  const relationTable = kind === "ally" ? allyRelations : rivalRelations;
  const contacts: Contact[] = [];

  for (let index = 0; index < clampCount(count); index += 1) {
    contacts.push({
      kind,
      relation: rollForTable(relationTable, 100),
      stat: rollForTable(contactStats, 100)
    });
  }

  return contacts;
}

function resizeContacts(current: Contact[], kind: ContactKind, count: number): Contact[] {
  const targetCount = clampCount(count);
  const next = current.slice(0, targetCount);
  for (let index = next.length; index < targetCount; index += 1) {
    next.push(generateContacts(kind, 1)[0]!);
  }
  return next;
}

function rebuildVariableBlocks(base: Chronicle): Chronicle {
  const social = resolveSocialRelation(base.homeland.entry, base.government, base.background.entry);

  return {
    ...base,
    socialRelationText: social.text,
    socialAllyCount: social.allies,
    socialRivalCount: social.rivals,
    allyCount: clampCount(base.allyCount),
    rivalCount: clampCount(base.rivalCount),
    fateCount: clampCount(base.fateCount),
    secretCount: clampCount(base.secretCount),
    prophecyCount: clampCount(base.prophecyCount),
    allies: resizeContacts(base.allies, "ally", base.allyCount),
    rivals: resizeContacts(base.rivals, "rival", base.rivalCount),
    fate: resizeRolls(base.fate, fateMoments, 20, base.fateCount),
    secrets: resizeRolls(base.secrets, secrets, 20, base.secretCount),
    prophecyList: resizeRolls(base.prophecyList, prophecies, 20, base.prophecyCount)
  };
}

export function generateChronicle(): Chronicle {
  const race = rollForTable(weightedRaceTable, RACE_DICE_SIDES);
  const characterClass = rollForTable(classTable, CLASS_DICE_SIDES);
  const gender = rollForTable(genderTable, GENDER_DICE_SIDES);
  const age = rollForTable(ageTable, AGE_DICE_SIDES);
  const status = rollForTable(statusTable, STATUS_DICE_SIDES);
  const hairColor = rollForTable(hairColorTable, HAIR_COLOR_DICE_SIDES);
  const eyeColor = rollForTable(eyeColorTable, EYE_COLOR_DICE_SIDES);
  const skinColor = rollForTable(skinColorTable, SKIN_COLOR_DICE_SIDES);
  const homeland = rollForTable(homelandTable, 100);
  const government = randomChoice(homeland.entry.governmentOptions);
  const settlement = rollForTable(settlements[homeland.entry.settlementTable], 100);
  const background = rollForTable(backgrounds, 20);
  const familyTable = isVillageLike(settlement.entry) ? villageFamilySize : cityFamilySize;
  const familySize = rollForTable(familyTable, 100);
  const familyRelation = rollForTable(familyRelations, 100);
  const social = resolveSocialRelation(homeland.entry, government, background.entry);
  const familyCounts = familyRelationCounts(familyRelation.entry.text);
  const allyCount = clampCount(social.allies + familyCounts.allies);
  const rivalCount = clampCount(social.rivals + familyCounts.rivals);

  const chronicle: Chronicle = {
    race,
    characterClass,
    gender,
    age,
    status,
    hairColor,
    eyeColor,
    skinColor,
    homeland,
    government,
    settlement,
    background,
    socialRelationText: social.text,
    socialAllyCount: social.allies,
    socialRivalCount: social.rivals,
    allyCount,
    rivalCount,
    fateCount: 1,
    secretCount: 1,
    prophecyCount: 3,
    familySize,
    siblingCount: rollFormula(familySize.entry.siblingsFormula),
    familyRelation,
    allies: generateContacts("ally", allyCount),
    rivals: generateContacts("rival", rivalCount),
    fate: generateRolls(fateMoments, 20, 1),
    food: rollForTable(foodTables[homeland.entry.foodTable], 8),
    secrets: generateRolls(secrets, 20, 1),
    prophecyList: generateRolls(prophecies, 20, 3)
  };

  return rebuildVariableBlocks(chronicle);
}

export function rerollSection(chronicle: Chronicle, section: SectionKey, index = 0): Chronicle {
  if (section === "race") {
    return { ...chronicle, race: rollForTable(weightedRaceTable, RACE_DICE_SIDES) };
  }

  if (section === "characterClass") {
    return { ...chronicle, characterClass: rollForTable(classTable, CLASS_DICE_SIDES) };
  }

  if (section === "gender") {
    return { ...chronicle, gender: rollForTable(genderTable, GENDER_DICE_SIDES) };
  }

  if (section === "age") {
    return { ...chronicle, age: rollForTable(ageTable, AGE_DICE_SIDES) };
  }

  if (section === "status") {
    return { ...chronicle, status: rollForTable(statusTable, STATUS_DICE_SIDES) };
  }

  if (section === "hairColor") {
    return { ...chronicle, hairColor: rollForTable(hairColorTable, HAIR_COLOR_DICE_SIDES) };
  }

  if (section === "eyeColor") {
    return { ...chronicle, eyeColor: rollForTable(eyeColorTable, EYE_COLOR_DICE_SIDES) };
  }

  if (section === "skinColor") {
    return { ...chronicle, skinColor: rollForTable(skinColorTable, SKIN_COLOR_DICE_SIDES) };
  }

  if (section === "homeland") {
    const homeland = rollForTable(homelandTable, 100);
    const government = randomChoice(homeland.entry.governmentOptions);
    const settlement = rollForTable(settlements[homeland.entry.settlementTable], 100);
    const familyTable = isVillageLike(settlement.entry) ? villageFamilySize : cityFamilySize;
    const familySize = rollForTable(familyTable, 100);
    return rebuildVariableBlocks({
      ...chronicle,
      homeland,
      government,
      settlement,
      familySize,
      siblingCount: rollFormula(familySize.entry.siblingsFormula),
      food: rollForTable(foodTables[homeland.entry.foodTable], 8)
    });
  }

  if (section === "background") {
    return rebuildVariableBlocks({ ...chronicle, background: rollForTable(backgrounds, 20) });
  }

  if (section === "settlement") {
    const settlement = rollForTable(settlements[chronicle.homeland.entry.settlementTable], 100);
    const familyTable = isVillageLike(settlement.entry) ? villageFamilySize : cityFamilySize;
    const familySize = rollForTable(familyTable, 100);
    return {
      ...chronicle,
      settlement,
      familySize,
      siblingCount: rollFormula(familySize.entry.siblingsFormula)
    };
  }

  if (section === "family") {
    const familyTable = isVillageLike(chronicle.settlement.entry) ? villageFamilySize : cityFamilySize;
    const familySize = rollForTable(familyTable, 100);
    return { ...chronicle, familySize, siblingCount: rollFormula(familySize.entry.siblingsFormula) };
  }

  if (section === "familyRelation") {
    return rebuildVariableBlocks({ ...chronicle, familyRelation: rollForTable(familyRelations, 100) });
  }

  if (section === "contacts") {
    return {
      ...chronicle,
      allies: generateContacts("ally", chronicle.allyCount),
      rivals: generateContacts("rival", chronicle.rivalCount)
    };
  }

  if (section === "ally") {
    const allies = chronicle.allies.map((contact, itemIndex) =>
      itemIndex === index ? generateContacts("ally", 1)[0]! : contact
    );
    return { ...chronicle, allies };
  }

  if (section === "rival") {
    const rivals = chronicle.rivals.map((contact, itemIndex) =>
      itemIndex === index ? generateContacts("rival", 1)[0]! : contact
    );
    return { ...chronicle, rivals };
  }

  if (section === "fate") {
    const fate = chronicle.fate.map((item, itemIndex) => (itemIndex === index ? rollForTable(fateMoments, 20) : item));
    return { ...chronicle, fate };
  }

  if (section === "food") {
    return { ...chronicle, food: rollForTable(foodTables[chronicle.homeland.entry.foodTable], 8) };
  }

  if (section === "secret") {
    const nextSecrets = chronicle.secrets.map((item, itemIndex) => (itemIndex === index ? rollForTable(secrets, 20) : item));
    return { ...chronicle, secrets: nextSecrets };
  }

  const prophecyList = chronicle.prophecyList.map((item, itemIndex) => (itemIndex === index ? rollForTable(prophecies, 20) : item));
  return { ...chronicle, prophecyList };
}

export function setSectionChoice(chronicle: Chronicle, section: SectionKey, id: string, index = 0): Chronicle {
  if (section === "race") {
    return { ...chronicle, race: rollById(weightedRaceTable, id) };
  }

  if (section === "characterClass") {
    return { ...chronicle, characterClass: rollById(classTable, id) };
  }

  if (section === "gender") {
    return { ...chronicle, gender: rollById(genderTable, id) };
  }

  if (section === "age") {
    return { ...chronicle, age: rollById(ageTable, id) };
  }

  if (section === "status") {
    return { ...chronicle, status: rollById(statusTable, id) };
  }

  if (section === "hairColor") {
    return { ...chronicle, hairColor: rollById(hairColorTable, id) };
  }

  if (section === "eyeColor") {
    return { ...chronicle, eyeColor: rollById(eyeColorTable, id) };
  }

  if (section === "skinColor") {
    return { ...chronicle, skinColor: rollById(skinColorTable, id) };
  }

  if (section === "homeland") {
    const homeland = rollById(homelandTable, id);
    const government = homeland.entry.governmentOptions[0] ?? randomChoice(homeland.entry.governmentOptions);
    const settlement = rollForTable(settlements[homeland.entry.settlementTable], 100);
    const familyTable = isVillageLike(settlement.entry) ? villageFamilySize : cityFamilySize;
    const familySize = rollForTable(familyTable, 100);
    return rebuildVariableBlocks({
      ...chronicle,
      homeland,
      government,
      settlement,
      familySize,
      siblingCount: rollFormula(familySize.entry.siblingsFormula),
      food: rollForTable(foodTables[homeland.entry.foodTable], 8)
    });
  }

  if (section === "background") {
    return rebuildVariableBlocks({ ...chronicle, background: rollById(backgrounds, id) });
  }

  if (section === "settlement") {
    const settlement = rollById(settlements[chronicle.homeland.entry.settlementTable], id);
    const familyTable = isVillageLike(settlement.entry) ? villageFamilySize : cityFamilySize;
    const familySize = rollForTable(familyTable, 100);
    return {
      ...chronicle,
      settlement,
      familySize,
      siblingCount: rollFormula(familySize.entry.siblingsFormula)
    };
  }

  if (section === "family") {
    const familyTable = isVillageLike(chronicle.settlement.entry) ? villageFamilySize : cityFamilySize;
    const familySize = rollById(familyTable, id);
    return { ...chronicle, familySize, siblingCount: rollFormula(familySize.entry.siblingsFormula) };
  }

  if (section === "familyRelation") {
    return rebuildVariableBlocks({ ...chronicle, familyRelation: rollById(familyRelations, id) });
  }

  if (section === "fate") {
    const fate = chronicle.fate.map((item, itemIndex) => (itemIndex === index ? rollById(fateMoments, id) : item));
    return { ...chronicle, fate };
  }

  if (section === "food") {
    return { ...chronicle, food: rollById(foodTables[chronicle.homeland.entry.foodTable], id) };
  }

  if (section === "secret") {
    const nextSecrets = chronicle.secrets.map((item, itemIndex) => (itemIndex === index ? rollById(secrets, id) : item));
    return { ...chronicle, secrets: nextSecrets };
  }

  if (section === "prophecies") {
    const prophecyList = chronicle.prophecyList.map((item, itemIndex) => (itemIndex === index ? rollById(prophecies, id) : item));
    return { ...chronicle, prophecyList };
  }

  return chronicle;
}

export function setCount(chronicle: Chronicle, key: CountKey, count: number): Chronicle {
  const nextCount = clampCount(count);

  if (key === "allies") {
    return rebuildVariableBlocks({ ...chronicle, allyCount: nextCount });
  }

  if (key === "rivals") {
    return rebuildVariableBlocks({ ...chronicle, rivalCount: nextCount });
  }

  if (key === "fate") {
    return rebuildVariableBlocks({ ...chronicle, fateCount: nextCount });
  }

  if (key === "secrets") {
    return rebuildVariableBlocks({ ...chronicle, secretCount: nextCount });
  }

  return rebuildVariableBlocks({ ...chronicle, prophecyCount: nextCount });
}

export function setContactChoice(chronicle: Chronicle, kind: ContactKind, index: number, field: "relation" | "stat", id: string): Chronicle {
  const relationTable = kind === "ally" ? allyRelations : rivalRelations;
  const contacts = (kind === "ally" ? chronicle.allies : chronicle.rivals).map((contact, itemIndex) => {
    if (itemIndex !== index) {
      return contact;
    }

    if (field === "relation") {
      return { ...contact, relation: rollById(relationTable, id) };
    }

    return { ...contact, stat: rollById(contactStats, id) };
  });

  return kind === "ally" ? { ...chronicle, allies: contacts } : { ...chronicle, rivals: contacts };
}

function formatTextList<T extends RangeEntry & { text: string }>(items: RollResult<T>[]): string {
  if (items.length === 0) {
    return "- Нет.";
  }

  return items.map((item) => `- ${item.entry.text}`).join("\n");
}

function formatContacts(title: string, contacts: Contact[]): string {
  if (contacts.length === 0) {
    return `**${title}:**\n- Нет.`;
  }

  const items = contacts.map((contact, index) => {
    const label = contact.kind === "ally" ? "Союзник" : "Соперник";
    const fate = contact.stat.entry.fateMoments > 0 ? " Дает дополнительный судьбоносный момент." : "";
    return `- ${label} ${index + 1}: ${contact.relation.entry.text} Личность: ${contact.stat.entry.text}.${fate}`;
  });

  return [`**${title}:**`, ...items].join("\n");
}

function formatRaceBlock(race: RaceEntry): string[] {
  const regionLines = raceRegionOrder
    .map((region) => {
      const description = race.regions[region];
      return description ? `- ${raceRegionNames[region]}: ${description}` : "";
    })
    .filter(Boolean);

  return [
    `**Раса:** ${race.name}.`,
    "",
    `**Справка о расе:** ${race.general}`,
    "",
    `**Особенности расы:** ${race.traits}`,
    ...(regionLines.length > 0 ? ["", "**Региональные описания:**", ...regionLines] : [])
  ];
}

function formatClassBlock(characterClass: ClassEntry): string[] {
  const className =
    characterClass.category === "subclass" && characterClass.baseClass
      ? `${characterClass.name} (${characterClass.baseClass.toLowerCase()})`
      : characterClass.name;

  return [
    `**Класс:** ${className}.`,
    "",
    `**Справка о классе:** ${characterClass.description}`,
    "",
    `**Роль и стиль:** ${characterClass.role}`
  ];
}

export function formatChronicle(chronicle: Chronicle): string {
  const prophecyText = formatTextList(chronicle.prophecyList);
  const fateText = formatTextList(chronicle.fate);
  const secretText = formatTextList(chronicle.secrets);

  return [
    "# Внешность персонажа",
    "",
    `**Пол:** ${chronicle.gender.entry.name}`,
    `**Возраст:** ${chronicle.age.entry.name}`,
    `**Статус:** ${chronicle.status.entry.name}`,
    "",
    `**Волосы:** ${chronicle.hairColor.entry.name}`,
    `**Глаза:** ${chronicle.eyeColor.entry.name}`,
    `**Кожа:** ${chronicle.skinColor.entry.name}`,
    "",
    ...formatRaceBlock(chronicle.race.entry),
    "",
    ...formatClassBlock(chronicle.characterClass.entry),
    "",
    "# Героическая хроника персонажа",
    "",
    `**Родина:** ${chronicle.homeland.entry.region}, ${chronicle.government}. Родное поселение: ${chronicle.settlement.entry.name} (${chronicle.settlement.entry.type}).`,
    "",
    `**Справка о родине:** ${chronicle.homeland.entry.description}`,
    "",
    `**Предыстория:** ${chronicle.background.entry.name} (${chronicle.background.entry.book}). В регионе «${socialColumnNames[chronicle.homeland.entry.socialColumn]}» эта предыстория дает: ${chronicle.socialRelationText}.`,
    "",
    `**Справка о предыстории:** ${chronicle.background.entry.description}`,
    "",
    `**Семья:** родителей ${chronicle.familySize.entry.parents}; братьев и сестер ${chronicle.siblingCount}.`,
    "",
    `**Особое семейное отношение:** ${chronicle.familyRelation.entry.text}`,
    "",
    `**Любимая еда:** ${chronicle.food.entry.name} — ${chronicle.food.entry.text}`,
    "",
    `**Союзники и соперники:**`,
    `- Справка по социальному статусу: ${chronicle.socialAllyCount} союзник(ов), ${chronicle.socialRivalCount} соперник(ов).`,
    `- Выбранное количество: ${chronicle.allyCount} союзник(ов), ${chronicle.rivalCount} соперник(ов).`,
    "",
    formatContacts("Союзники", chronicle.allies),
    "",
    formatContacts("Соперники", chronicle.rivals),
    "",
    `**Судьбоносные моменты:**`,
    fateText,
    "",
    `**Таинственные секреты:**`,
    secretText,
    "",
    `**Пророчества:**`,
    prophecyText
  ].join("\n");
}

export function familySizeOptions(chronicle: Chronicle): FamilySize[] {
  return isVillageLike(chronicle.settlement.entry) ? villageFamilySize : cityFamilySize;
}

export function currentSettlementOptions(chronicle: Chronicle): Settlement[] {
  return settlements[chronicle.homeland.entry.settlementTable];
}

export function currentFoodOptions(chronicle: Chronicle): FoodEntry[] {
  return foodTables[chronicle.homeland.entry.foodTable];
}

export function raceOptions(): RaceEntry[] {
  return weightedRaceTable;
}

export function raceDiceSides(): number {
  return RACE_DICE_SIDES;
}

export function classOptions(): ClassEntry[] {
  return classTable;
}

export function classDiceSides(): number {
  return CLASS_DICE_SIDES;
}

export function genderOptions(): AppearanceEntry[] {
  return genderTable;
}

export function genderDiceSides(): number {
  return GENDER_DICE_SIDES;
}

export function ageOptions(): AppearanceEntry[] {
  return ageTable;
}

export function ageDiceSides(): number {
  return AGE_DICE_SIDES;
}

export function statusOptions(): AppearanceEntry[] {
  return statusTable;
}

export function statusDiceSides(): number {
  return STATUS_DICE_SIDES;
}

export function hairColorOptions(): AppearanceEntry[] {
  return hairColorTable;
}

export function hairColorDiceSides(): number {
  return HAIR_COLOR_DICE_SIDES;
}

export function eyeColorOptions(): AppearanceEntry[] {
  return eyeColorTable;
}

export function eyeColorDiceSides(): number {
  return EYE_COLOR_DICE_SIDES;
}

export function skinColorOptions(): AppearanceEntry[] {
  return skinColorTable;
}

export function skinColorDiceSides(): number {
  return SKIN_COLOR_DICE_SIDES;
}

export function contactRelationOptions(kind: ContactKind): TextEntry[] {
  return kind === "ally" ? allyRelations : rivalRelations;
}

export function contactStatOptions(): Array<TextEntry & { fateMoments: number }> {
  return contactStats;
}
