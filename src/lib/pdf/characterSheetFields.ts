import type { AbilityKey, CharacterBuild } from "~/lib/character";
import {
  ABILITY_KEYS,
  buildSpellcastingInfo,
  computeCombatStats,
  formatClassFeaturesForPdf,
  formatClassLevelForPdf,
  formatInventoryForPdf,
  formatProficienciesAndLanguages,
  formatCoinsLineForPdf,
  getCombinedCasterLevel,
  getPrimarySpellcastingClassId,
  getSecondarySpellcastingClassId,
  getSpellById,
  getSpellSlots,
  getSpellSlotsForClass,
  hasSpellcasting,
  isSpellcastingClass,
  PDF_SKILL_FIELD_IDS,
  SAVING_THROW_PDF_FIELDS,
  type SkillName,
} from "~/lib/character";
import { classTable, socialColumnNames } from "~/lib/chronicle/chronicle";
import type { Chronicle, Contact } from "~/lib/chronicle/generator";

import type { PdfFieldValue } from "./exportCharacterSheet";
import {
  allocateSpellFieldsPerLevel,
  PAGE3_PREPARED_CHECKBOX_BY_SPELL_FIELD,
  PAGE3_SLOTS_BY_LEVEL,
  PAGE3_SPELL_FIELDS_BY_LEVEL,
  PAGE3_SPELLCASTING_HEADER,
} from "./page3Mapping";
import {
  PDF_PASSIVE_FIELD_ID,
  PDF_PROFICIENCIES_LANG_FIELD_ID,
  PDF_SAVING_THROW_CHECKBOX,
  PDF_SKILL_PROFICIENCY_CHECKBOX,
} from "./pdfFieldMapping";
import { PAGE2_FIELD_MAP } from "./page2Mapping";

export const PDF_LIMITS = {
  appearance: 1500,
  allies: 1000,
  backstory: 2000,
  additionalFeatures: 2000,
  /** Page-1 equipment box; overflow goes to page-2 TREASURE. */
  equipment: 600,
  proficiencies: 400,
  /** Page-1 «Умения и способности»; overflow → page-2 ADDITIONAL_FEATURES. */
  features: 1500,
  /** Page-1 attacks/spellcasting notes; spell + extra attack overflow. */
  attacksNotes: 1500,
} as const;

/** Page 1 class features / traits text area. */
export const PDF_FEATURES_TRAITS_FIELD_ID = "Features and Traits_3R4V";

/** Page 1 attacks and spellcasting overflow notes. */
export const PDF_ATTACKS_SPELLCASTING_FIELD_ID = "AttacksSpellcasting_XFCE";

const CLASS_NAME_BY_ID = new Map(classTable.map((entry) => [entry.id, entry.name]));

/** Weapon attack rows on page 1 (exact PDF field ids, including trailing spaces). */
const PAGE1_WEAPON_ATTACK_ROWS = [
  { name: "Wpn Name", bonus: "Wpn1 AtkBonus", damage: "Wpn1 Damage" },
  { name: "Wpn Name 2", bonus: "Wpn2 AtkBonus ", damage: "Wpn2 Damage " },
  { name: "Wpn Name 3", bonus: "Wpn3 AtkBonus  ", damage: "Wpn3 Damage " },
] as const;

const SPELLCASTING_ABILITY_PDF_LABEL: Partial<Record<AbilityKey, string>> = {
  int: "INT",
  wis: "WIS",
  cha: "CHA",
};

/** Page 1 named AcroForm field ids (see pdf-field-analysis.md). */
export const PAGE1_FIELD_IDS = {
  CHARACTER_NAME: "CharacterName",
  PLAYER_NAME: "PlayerName",
  CLASS_LEVEL: "ClassLevel",
  BACKGROUND: "Background",
  /** Trailing space is part of the PDF field id. */
  RACE: "Race ",
  ALIGNMENT: "Alignment",
  PERSONALITY_TRAITS: "PersonalityTraits _25LZ",
  EQUIPMENT: "Equipment_VXRI",
  CP: "CP",
  SP: "SP",
  EP: "EP",
  GP: "GP",
  PP: "PP",
} as const;

/** Page 1 ability score field ids (DEXmod has trailing space in the PDF). */
export const PAGE1_ABILITY_FIELD_IDS = {
  str: { score: "STR", mod: "STRmod" },
  dex: { score: "DEX", mod: "DEXmod " },
  con: { score: "CON", mod: "CONmod" },
  int: { score: "INT", mod: "INTmod" },
  wis: { score: "WIS", mod: "WISmod" },
  cha: { score: "CHA", mod: "CHamod" },
} as const satisfies Record<AbilityKey, { score: string; mod: string }>;

export type PdfPromptValues = {
  characterName: string;
  playerName: string;
  alignment: string;
  height: string;
  weight: string;
};

export type PdfExportInput = {
  chronicle: Chronicle;
  promptValues: PdfPromptValues;
  characterBuild: CharacterBuild;
};

/** Signed modifier for PDF AcroForm fields (+3, +0, −1). */
export function formatPdfAbilityModifier(modifier: number): string {
  if (modifier >= 0) {
    return `+${modifier}`;
  }

  return `\u2212${Math.abs(modifier)}`;
}

export function truncateField(text: string, maxLen: number): string {
  if (text.length <= maxLen) {
    return text;
  }

  if (maxLen <= 1) {
    return "…";
  }

  return `${text.slice(0, maxLen - 1)}…`;
}

/** Split long text at the last sentence end within maxLen; remainder goes to overflow. */
export function splitTextAtSentenceBoundary(
  text: string,
  maxLen: number,
): { main: string; overflow: string } {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) {
    return { main: trimmed, overflow: "" };
  }

  const window = trimmed.slice(0, maxLen);
  let splitAt = -1;

  for (let index = 0; index < window.length; index += 1) {
    const ch = window[index];
    if (ch !== "." && ch !== "!" && ch !== "?" && ch !== "…") {
      continue;
    }

    const next = window[index + 1];
    if (next === undefined || /\s/.test(next)) {
      splitAt = index + 1;
    }
  }

  if (splitAt > 0) {
    return {
      main: trimmed.slice(0, splitAt).trimEnd(),
      overflow: trimmed.slice(splitAt).trimStart(),
    };
  }

  return {
    main: trimmed.slice(0, maxLen).trimEnd(),
    overflow: trimmed.slice(maxLen).trimStart(),
  };
}

export function formatClassLabel(
  chronicle: Chronicle,
  buildOrLevel?: CharacterBuild | number,
): string {
  if (typeof buildOrLevel === "object" && buildOrLevel) {
    return formatClassLevelForPdf(buildOrLevel);
  }

  const level = typeof buildOrLevel === "number" ? buildOrLevel : 1;
  const characterClass = chronicle.characterClass.entry;
  let label: string;

  if (characterClass.category === "subclass" && characterClass.baseClass) {
    label = `${characterClass.name} (${characterClass.baseClass.toLowerCase()})`;
  } else {
    label = characterClass.name;
  }

  return `${label} ${level}`;
}

/** Page 2 appearance — внешность, раса, класс, особенности расы и роль/стиль класса. */
export function formatPage2Appearance(
  chronicle: Chronicle,
  characterBuild?: CharacterBuild,
): string {
  const classLabel =
    characterBuild && characterBuild.classLevels.length > 0
      ? formatClassLabel(chronicle, characterBuild)
      : formatClassLabel(chronicle);

  return [
    [
      `Пол: ${chronicle.gender.entry.name}`,
      `Возраст: ${chronicle.age.entry.name}`,
      `Статус: ${chronicle.status.entry.name}`,
      `Волосы: ${chronicle.hairColor.entry.name}`,
      `Глаза: ${chronicle.eyeColor.entry.name}`,
      `Кожа: ${chronicle.skinColor.entry.name}`,
      `Раса: ${chronicle.race.entry.name}`,
      `Класс: ${classLabel}`,
    ].join(". "),
    `Особенности расы: ${chronicle.race.entry.traits}`,
    `Роль и стиль: ${chronicle.characterClass.entry.role}`,
  ].join("\n");
}

function formatContactLine(label: string, index: number, contact: Contact): string {
  const fate =
    contact.stat.entry.fateMoments > 0
      ? " Дает дополнительный судьбоносный момент."
      : "";

  return `• ${label} ${index + 1}: ${contact.relation.entry.text} Личность: ${contact.stat.entry.text}.${fate}`;
}

/** Allies block — only ally/rival entries; meta counts omitted. */
export function formatAlliesBlock(chronicle: Chronicle): string {
  if (chronicle.allies.length === 0 && chronicle.rivals.length === 0) {
    return "";
  }

  const sections: string[] = [];

  if (chronicle.allies.length > 0) {
    sections.push("Союзники:");
    chronicle.allies.forEach((contact, index) => {
      sections.push(formatContactLine("Союзник", index, contact));
    });
  }

  if (chronicle.rivals.length > 0) {
    sections.push("Соперники:");
    chronicle.rivals.forEach((contact, index) => {
      sections.push(formatContactLine("Соперник", index, contact));
    });
  }

  return sections.join("\n");
}

/** Backstory — homeland through favorite food; fate/secrets/prophecies go to additional features. */
export function formatBackstoryBlock(chronicle: Chronicle): string {
  const sections = [
    `Родина: ${chronicle.homeland.entry.region}, ${chronicle.government}. Родное поселение: ${chronicle.settlement.entry.name} (${chronicle.settlement.entry.type}).`,
    `Справка о родине: ${chronicle.homeland.entry.description}`,
    `Предыстория: ${chronicle.background.entry.name} (${chronicle.background.entry.book}). В регионе «${socialColumnNames[chronicle.homeland.entry.socialColumn]}» эта предыстория дает: ${chronicle.socialRelationText}.`,
    `Справка о предыстории: ${chronicle.background.entry.description}`,
    `Семья: родителей ${chronicle.familySize.entry.parents}; братьев и сестер ${chronicle.siblingCount}.`,
    `Особое семейное отношение: ${chronicle.familyRelation.entry.text}`,
    `Любимая еда: ${chronicle.food.entry.name} — ${chronicle.food.entry.text}`,
  ];

  return sections.join("\n");
}

/** Additional features — chronicle content first, then class-features overflow. */
export function formatAdditionalFeaturesBlock(
  chronicle: Chronicle,
  classFeaturesOverflow = "",
  maxLen: number = PDF_LIMITS.additionalFeatures,
): string {
  const chroniclePart = formatAdditionalFeatures(chronicle).trim();
  const parts: string[] = [];

  if (chroniclePart) {
    if (chroniclePart.length <= maxLen) {
      parts.push(chroniclePart);
    } else {
      return truncateField(chroniclePart, maxLen);
    }
  }

  const overflowTrimmed = classFeaturesOverflow.trim();
  if (overflowTrimmed) {
    const prefix = parts.join("\n\n");
    const separator = prefix ? 2 : 0;
    const budget = maxLen - prefix.length - separator;

    if (budget > 0) {
      const { main } = splitTextAtSentenceBoundary(overflowTrimmed, budget);
      if (main) {
        parts.push(main);
      }
    }
  }

  return parts.join("\n\n");
}

/** Chronicle-only block: fateful moments, secrets, and prophecies. */
export function formatAdditionalFeatures(chronicle: Chronicle): string {
  const sections: string[] = [];

  if (chronicle.fate.length > 0) {
    sections.push("Судьбоносные моменты:");
    chronicle.fate.forEach((item) => {
      sections.push(`• ${item.entry.text}`);
    });
  }

  if (chronicle.secrets.length > 0) {
    sections.push("Таинственные секреты:");
    chronicle.secrets.forEach((item) => {
      sections.push(`• ${item.entry.text}`);
    });
  }

  if (chronicle.prophecyList.length > 0) {
    sections.push("Пророчества:");
    chronicle.prophecyList.forEach((item) => {
      sections.push(`• ${item.entry.text}`);
    });
  }

  return sections.join("\n");
}

function pushField(
  fields: PdfFieldValue[],
  fieldId: string,
  value: string,
): void {
  const trimmed = value.trim();
  if (trimmed === "") {
    return;
  }

  fields.push({ fieldId, value: trimmed });
}

function pushAbilityScores(
  fields: PdfFieldValue[],
  characterBuild: CharacterBuild,
): void {
  const scores = characterBuild.abilityScores;
  if (!scores) {
    return;
  }

  for (const key of ABILITY_KEYS) {
    const mapping = PAGE1_ABILITY_FIELD_IDS[key];
    pushField(fields, mapping.score, String(scores.total[key]));
    pushField(
      fields,
      mapping.mod,
      formatPdfAbilityModifier(scores.modifier[key]),
    );
  }
}

function getClassName(classId: string): string {
  return CLASS_NAME_BY_ID.get(classId) ?? classId;
}

function getClassLevel(build: CharacterBuild, classId: string): number {
  return build.classLevels.find((entry) => entry.classId === classId)?.level ?? 0;
}

type ResolvedSpellLine = {
  nameRu: string;
  prepared: boolean;
};

function resolveSpellsForClassAtLevel(
  build: CharacterBuild,
  classId: string,
  spellLevel: number,
): ResolvedSpellLine[] {
  const lines: ResolvedSpellLine[] = [];

  for (const selection of build.selectedSpells) {
    if (selection.classId !== classId) {
      continue;
    }

    const spell = getSpellById(selection.spellId);
    if (!spell || spell.level !== spellLevel) {
      continue;
    }

    lines.push({ nameRu: spell.nameRu, prepared: selection.prepared });
  }

  return lines.sort((a, b) => a.nameRu.localeCompare(b.nameRu, "ru"));
}

function resolveCombinedSpellSlots(build: CharacterBuild): Record<number, number> {
  const casterIds = build.classLevels
    .filter((entry) => isSpellcastingClass(entry.classId))
    .map((entry) => entry.classId);
  const nonWarlockCasters = casterIds.filter((classId) => classId !== "warlock");

  if (nonWarlockCasters.length === 0) {
    const warlockLevel = getClassLevel(build, "warlock");
    return warlockLevel > 0 ? getSpellSlotsForClass("warlock", warlockLevel) : {};
  }

  if (nonWarlockCasters.length === 1 && !casterIds.includes("warlock")) {
    const classId = nonWarlockCasters[0]!;
    return getSpellSlotsForClass(classId, getClassLevel(build, classId));
  }

  return getSpellSlots(getCombinedCasterLevel(build.classLevels));
}

function appendOverflowNote(notes: string[], note: string): void {
  const trimmed = note.trim();
  if (trimmed !== "") {
    notes.push(trimmed);
  }
}

function formatEquipmentBlockForPdf(characterBuild: CharacterBuild): string {
  const parts: string[] = [];
  const inventoryText = formatInventoryForPdf(characterBuild.inventory).trim();
  const coinsLine = formatCoinsLineForPdf(characterBuild.coins).trim();

  if (inventoryText) {
    parts.push(inventoryText);
  }
  if (coinsLine) {
    parts.push(coinsLine);
  }

  return parts.join("\n");
}

function pushEquipmentFields(
  fields: PdfFieldValue[],
  characterBuild: CharacterBuild,
): void {
  const equipmentText = formatEquipmentBlockForPdf(characterBuild);

  if (equipmentText.trim() === "") {
    return;
  }

  if (equipmentText.length <= PDF_LIMITS.equipment) {
    pushField(fields, PAGE1_FIELD_IDS.EQUIPMENT, equipmentText);
    return;
  }

  pushField(
    fields,
    PAGE1_FIELD_IDS.EQUIPMENT,
    truncateField(equipmentText, PDF_LIMITS.equipment),
  );

  const overflow = equipmentText.slice(PDF_LIMITS.equipment - 1).trim();
  if (overflow.length > 0) {
    pushField(fields, PAGE2_FIELD_MAP.TREASURE.fieldId, overflow);
  }
}

function pushCheckbox(
  fields: PdfFieldValue[],
  fieldId: string,
  checked: boolean,
): void {
  if (!checked) {
    return;
  }

  fields.push({ kind: "checkbox", fieldId, checked: true });
}

function pushCombatStats(
  fields: PdfFieldValue[],
  characterBuild: CharacterBuild,
): void {
  const stats = computeCombatStats(characterBuild);
  if (!stats) {
    return;
  }

  pushField(
    fields,
    "ProfBonus",
    formatPdfAbilityModifier(stats.proficiencyBonus),
  );
  pushField(fields, "AC", String(stats.armorClass));
  pushField(
    fields,
    "Initiative",
    formatPdfAbilityModifier(stats.initiative),
  );
  pushField(fields, "Speed", String(stats.speed));
  pushField(fields, "HPMax", String(stats.hitPointMaximum));
  pushField(fields, "HPCurrent_LXTJ", String(stats.hitPointMaximum));
  pushField(fields, "HD", stats.hitDiceLabel);
  pushField(fields, "HDTotal", String(stats.hitDiceTotal));

  const proficientSkillSet = new Set(stats.proficientSkills);

  for (const [skillName, fieldId] of Object.entries(PDF_SKILL_FIELD_IDS)) {
    pushField(
      fields,
      fieldId,
      formatPdfAbilityModifier(
        stats.skillBonuses[skillName as keyof typeof PDF_SKILL_FIELD_IDS],
      ),
    );
    pushCheckbox(
      fields,
      PDF_SKILL_PROFICIENCY_CHECKBOX[skillName as SkillName],
      proficientSkillSet.has(skillName as SkillName),
    );
  }

  const proficientSavingThrows = new Set(stats.proficientSavingThrows);

  for (const key of ABILITY_KEYS) {
    pushField(
      fields,
      SAVING_THROW_PDF_FIELDS[key],
      formatPdfAbilityModifier(stats.savingThrowBonuses[key]),
    );
    pushCheckbox(
      fields,
      PDF_SAVING_THROW_CHECKBOX[key],
      proficientSavingThrows.has(key),
    );
  }

  const passivePerception = 10 + stats.skillBonuses.Perception;
  pushField(fields, PDF_PASSIVE_FIELD_ID, String(passivePerception));

  const proficienciesText = formatProficienciesAndLanguages(characterBuild);
  if (proficienciesText.trim() !== "") {
    pushField(
      fields,
      PDF_PROFICIENCIES_LANG_FIELD_ID,
      truncateField(proficienciesText, PDF_LIMITS.proficiencies),
    );
  }
}

function pushAttackFields(
  fields: PdfFieldValue[],
  characterBuild: CharacterBuild,
  overflowNotes: string[],
): void {
  const attacks = characterBuild.weaponAttacks;

  for (let index = 0; index < Math.min(3, attacks.length); index += 1) {
    const attack = attacks[index]!;
    const row = PAGE1_WEAPON_ATTACK_ROWS[index]!;

    pushField(fields, row.name, attack.name);
    pushField(
      fields,
      row.bonus,
      formatPdfAbilityModifier(attack.attackBonus),
    );
    pushField(fields, row.damage, attack.damage);
  }

  if (attacks.length > 3) {
    const extraAttacks = attacks
      .slice(3)
      .map(
        (attack) =>
          `${attack.name} ${formatPdfAbilityModifier(attack.attackBonus)} ${attack.damage}`,
      )
      .join("; ");
    appendOverflowNote(overflowNotes, `Доп. атаки: ${extraAttacks}`);
  }
}

function fillSpellLinesForClass(
  fields: PdfFieldValue[],
  fieldIds: string[],
  spells: ResolvedSpellLine[],
  spellLevel: number,
  overflowNotes: string[],
  overflowLabel: string,
): void {
  const visibleCount = Math.min(spells.length, fieldIds.length);

  for (let index = 0; index < visibleCount; index += 1) {
    const spell = spells[index]!;
    const fieldId = fieldIds[index]!;

    pushField(fields, fieldId, spell.nameRu);

    if (spellLevel > 0 && spell.prepared) {
      const checkboxId = PAGE3_PREPARED_CHECKBOX_BY_SPELL_FIELD[fieldId];
      if (checkboxId) {
        pushCheckbox(fields, checkboxId, true);
      }
    }
  }

  if (spells.length > fieldIds.length) {
    const overflowNames = spells
      .slice(fieldIds.length)
      .map((spell) => spell.nameRu)
      .join(", ");
    appendOverflowNote(
      overflowNotes,
      `${overflowLabel} (ур. ${spellLevel}, не поместилось): ${overflowNames}`,
    );
  }
}

function formatSecondaryCasterNote(
  build: CharacterBuild,
  classId: string,
  proficiencyBonus: number,
): string | null {
  const info = buildSpellcastingInfo(build, classId, proficiencyBonus);
  if (!info) {
    return null;
  }

  const abilityLabel = SPELLCASTING_ABILITY_PDF_LABEL[info.ability] ?? info.ability.toUpperCase();
  return `${getClassName(classId)}: DC ${info.spellSaveDc}, атака ${formatPdfAbilityModifier(info.spellAttackBonus)}, ${abilityLabel}`;
}

function pushSpellcastingFields(
  fields: PdfFieldValue[],
  characterBuild: CharacterBuild,
  overflowNotes: string[],
): void {
  if (!hasSpellcasting(characterBuild)) {
    return;
  }

  const stats = computeCombatStats(characterBuild);
  if (!stats) {
    return;
  }

  const primaryClassId = getPrimarySpellcastingClassId(characterBuild);
  if (!primaryClassId) {
    return;
  }

  const primaryInfo = buildSpellcastingInfo(
    characterBuild,
    primaryClassId,
    stats.proficiencyBonus,
  );
  if (!primaryInfo) {
    return;
  }

  const abilityLabel =
    SPELLCASTING_ABILITY_PDF_LABEL[primaryInfo.ability] ??
    primaryInfo.ability.toUpperCase();

  pushField(
    fields,
    PAGE3_SPELLCASTING_HEADER.className,
    getClassName(primaryClassId),
  );
  pushField(fields, PAGE3_SPELLCASTING_HEADER.ability, abilityLabel);
  pushField(
    fields,
    PAGE3_SPELLCASTING_HEADER.saveDc,
    String(primaryInfo.spellSaveDc),
  );
  pushField(
    fields,
    PAGE3_SPELLCASTING_HEADER.atkBonus,
    formatPdfAbilityModifier(primaryInfo.spellAttackBonus),
  );

  const slots = resolveCombinedSpellSlots(characterBuild);
  for (const [levelKey, count] of Object.entries(slots)) {
    const level = Number(levelKey);
    const slotFields = PAGE3_SLOTS_BY_LEVEL[level];
    if (!slotFields || count <= 0) {
      continue;
    }

    pushField(fields, slotFields.total, String(count));
    pushField(fields, slotFields.remaining, String(count));
  }

  const secondaryClassId = getSecondarySpellcastingClassId(characterBuild);
  const extraCasterIds = characterBuild.classLevels
    .map((entry) => entry.classId)
    .filter((classId) => isSpellcastingClass(classId))
    .slice(2);

  for (let spellLevel = 0; spellLevel <= 9; spellLevel += 1) {
    const fieldIds = PAGE3_SPELL_FIELDS_BY_LEVEL[spellLevel] ?? [];
    if (fieldIds.length === 0) {
      continue;
    }

    const primarySpells = resolveSpellsForClassAtLevel(
      characterBuild,
      primaryClassId,
      spellLevel,
    );
    const secondarySpells = secondaryClassId
      ? resolveSpellsForClassAtLevel(
          characterBuild,
          secondaryClassId,
          spellLevel,
        )
      : [];

    const primaryCount = Math.min(primarySpells.length, fieldIds.length);
    const secondaryCount = Math.min(
      secondarySpells.length,
      fieldIds.length - primaryCount,
    );
    const allocation = allocateSpellFieldsPerLevel(
      primaryCount,
      secondaryCount,
      fieldIds,
    );

    fillSpellLinesForClass(
      fields,
      allocation.primary,
      primarySpells,
      spellLevel,
      overflowNotes,
      getClassName(primaryClassId),
    );

    if (secondaryClassId && secondaryCount > 0) {
      fillSpellLinesForClass(
        fields,
        allocation.secondary,
        secondarySpells,
        spellLevel,
        overflowNotes,
        getClassName(secondaryClassId),
      );
    } else if (secondaryClassId && secondarySpells.length > 0) {
      const overflowNames = secondarySpells.map((spell) => spell.nameRu).join(", ");
      appendOverflowNote(
        overflowNotes,
        `${getClassName(secondaryClassId!)} (ур. ${spellLevel}, не поместилось): ${overflowNames}`,
      );
    }
  }

  if (secondaryClassId) {
    const secondaryNote = formatSecondaryCasterNote(
      characterBuild,
      secondaryClassId,
      stats.proficiencyBonus,
    );
    if (secondaryNote) {
      appendOverflowNote(overflowNotes, secondaryNote);
    }
  }

  for (const classId of extraCasterIds) {
    appendOverflowNote(
      overflowNotes,
      formatSecondaryCasterNote(characterBuild, classId, stats.proficiencyBonus) ??
        getClassName(classId),
    );
  }
}

function pushAttacksSpellcastingNotesField(
  fields: PdfFieldValue[],
  characterBuild: CharacterBuild,
  overflowNotes: string[],
): void {
  const parts: string[] = [];

  if (characterBuild.attacksSpellcastingNotes.trim() !== "") {
    parts.push(characterBuild.attacksSpellcastingNotes.trim());
  }

  parts.push(...overflowNotes);

  const combined = parts.join("\n\n");
  if (combined.trim() === "") {
    return;
  }

  pushField(
    fields,
    PDF_ATTACKS_SPELLCASTING_FIELD_ID,
    truncateField(combined, PDF_LIMITS.attacksNotes),
  );
}

export function buildPdfFieldValues(input: PdfExportInput): PdfFieldValue[] {
  const { chronicle, promptValues, characterBuild } = input;
  const fields: PdfFieldValue[] = [];

  const classFeaturesSplit =
    characterBuild.wizardCompleted && characterBuild.classLevels.length > 0
      ? splitTextAtSentenceBoundary(
          formatClassFeaturesForPdf(characterBuild),
          PDF_LIMITS.features,
        )
      : { main: "", overflow: "" };

  pushField(fields, PAGE1_FIELD_IDS.CHARACTER_NAME, promptValues.characterName);
  pushField(
    fields,
    PAGE2_FIELD_MAP.CHARACTER_NAME.fieldId,
    promptValues.characterName,
  );

  pushField(fields, PAGE1_FIELD_IDS.PLAYER_NAME, promptValues.playerName);
  pushField(fields, PAGE1_FIELD_IDS.ALIGNMENT, promptValues.alignment);
  if (characterBuild.wizardCompleted && characterBuild.classLevels.length > 0) {
    pushField(
      fields,
      PAGE1_FIELD_IDS.CLASS_LEVEL,
      formatClassLevelForPdf(characterBuild),
    );
  } else {
    pushField(fields, PAGE1_FIELD_IDS.CLASS_LEVEL, formatClassLabel(chronicle));
  }
  pushField(fields, PAGE1_FIELD_IDS.BACKGROUND, chronicle.background.entry.name);
  pushField(fields, PAGE1_FIELD_IDS.RACE, chronicle.race.entry.name);

  pushField(fields, PAGE2_FIELD_MAP.AGE.fieldId, chronicle.age.entry.name);
  pushField(fields, PAGE2_FIELD_MAP.HEIGHT.fieldId, promptValues.height);
  pushField(fields, PAGE2_FIELD_MAP.WEIGHT.fieldId, promptValues.weight);
  pushField(fields, PAGE2_FIELD_MAP.EYES.fieldId, chronicle.eyeColor.entry.name);
  pushField(fields, PAGE2_FIELD_MAP.SKIN.fieldId, chronicle.skinColor.entry.name);
  pushField(fields, PAGE2_FIELD_MAP.HAIR.fieldId, chronicle.hairColor.entry.name);

  pushField(
    fields,
    PAGE2_FIELD_MAP.APPEARANCE.fieldId,
    truncateField(
      formatPage2Appearance(chronicle, characterBuild),
      PDF_LIMITS.appearance,
    ),
  );

  pushField(
    fields,
    PAGE2_FIELD_MAP.ALLIES_AND_ORGANIZATIONS.fieldId,
    truncateField(formatAlliesBlock(chronicle), PDF_LIMITS.allies),
  );

  pushField(
    fields,
    PAGE2_FIELD_MAP.BACKSTORY.fieldId,
    truncateField(formatBackstoryBlock(chronicle), PDF_LIMITS.backstory),
  );

  pushField(
    fields,
    PAGE2_FIELD_MAP.ADDITIONAL_FEATURES.fieldId,
    formatAdditionalFeaturesBlock(chronicle, classFeaturesSplit.overflow),
  );

  if (characterBuild.wizardCompleted) {
    const overflowNotes: string[] = [];

    pushAbilityScores(fields, characterBuild);
    pushCombatStats(fields, characterBuild);
    if (classFeaturesSplit.main) {
      pushField(fields, PDF_FEATURES_TRAITS_FIELD_ID, classFeaturesSplit.main);
    }
    pushEquipmentFields(fields, characterBuild);
    pushAttackFields(fields, characterBuild, overflowNotes);
    pushSpellcastingFields(fields, characterBuild, overflowNotes);
    pushAttacksSpellcastingNotesField(fields, characterBuild, overflowNotes);
  }

  return fields;
}
