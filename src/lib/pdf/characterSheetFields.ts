import { socialColumnNames } from "~/lib/chronicle/chronicle";
import type { Chronicle, Contact } from "~/lib/chronicle/generator";

import type { PdfFieldValue } from "./exportCharacterSheet";
import { PAGE2_FIELD_MAP } from "./page2Mapping";

export const PDF_LIMITS = {
  appearance: 1500,
  allies: 1000,
  backstory: 2000,
  additionalFeatures: 2000,
} as const;

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
} as const;

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
};

export function truncateField(text: string, maxLen: number): string {
  if (text.length <= maxLen) {
    return text;
  }

  if (maxLen <= 1) {
    return "…";
  }

  return `${text.slice(0, maxLen - 1)}…`;
}

export function formatClassLabel(chronicle: Chronicle): string {
  const characterClass = chronicle.characterClass.entry;

  if (characterClass.category === "subclass" && characterClass.baseClass) {
    return `${characterClass.name} (${characterClass.baseClass.toLowerCase()})`;
  }

  return characterClass.name;
}

/** Page 2 appearance — внешность, раса, класс, особенности расы и роль/стиль класса. */
export function formatPage2Appearance(chronicle: Chronicle): string {
  return [
    [
      `Пол: ${chronicle.gender.entry.name}`,
      `Возраст: ${chronicle.age.entry.name}`,
      `Статус: ${chronicle.status.entry.name}`,
      `Волосы: ${chronicle.hairColor.entry.name}`,
      `Глаза: ${chronicle.eyeColor.entry.name}`,
      `Кожа: ${chronicle.skinColor.entry.name}`,
      `Раса: ${chronicle.race.entry.name}`,
      `Класс: ${formatClassLabel(chronicle)}`,
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

/** Additional features — fateful moments, secrets, and prophecies only. */
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

export function buildPdfFieldValues(input: PdfExportInput): PdfFieldValue[] {
  const { chronicle, promptValues } = input;
  const fields: PdfFieldValue[] = [];

  pushField(fields, PAGE1_FIELD_IDS.CHARACTER_NAME, promptValues.characterName);
  pushField(
    fields,
    PAGE2_FIELD_MAP.CHARACTER_NAME.fieldId,
    promptValues.characterName,
  );

  pushField(fields, PAGE1_FIELD_IDS.PLAYER_NAME, promptValues.playerName);
  pushField(fields, PAGE1_FIELD_IDS.ALIGNMENT, promptValues.alignment);
  pushField(fields, PAGE1_FIELD_IDS.CLASS_LEVEL, formatClassLabel(chronicle));
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
    truncateField(formatPage2Appearance(chronicle), PDF_LIMITS.appearance),
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
    truncateField(formatAdditionalFeatures(chronicle), PDF_LIMITS.additionalFeatures),
  );

  return fields;
}
