import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PDFDocument } from "pdf-lib";

import { generateChronicle } from "../src/lib/chronicle";
import {
  PAGE1_FIELD_IDS,
  buildPdfFieldValues,
} from "../src/lib/pdf/characterSheetFields";
import { fillCharacterSheetPdf } from "../src/lib/pdf/exportCharacterSheet";
import { PAGE2_FIELD_MAP } from "../src/lib/pdf/page2Mapping";

const publicDir = resolve(import.meta.dirname, "../public");
const templateBytes = readFileSync(
  resolve(publicDir, "DnD5e_character_sheet_RUS.pdf"),
).buffer;
const fontBytes = readFileSync(
  resolve(publicDir, "fonts/NotoSans-Regular.ttf"),
).buffer;

const chronicle = generateChronicle();
const promptValues = {
  characterName: "Тестовый Герой",
  playerName: "Игрок Тест",
  alignment: "нейтральный добрый",
  height: "175 см",
  weight: "70 кг",
};

const fields = buildPdfFieldValues({ chronicle, promptValues });

const mandatoryPage2Keys = [
  "CHARACTER_NAME",
  "AGE",
  "EYES",
  "SKIN",
  "HAIR",
  "APPEARANCE",
  "BACKSTORY",
] as const;

const hasAdditionalContent =
  chronicle.fate.length > 0 ||
  chronicle.secrets.length > 0 ||
  chronicle.prophecyList.length > 0;

for (const key of mandatoryPage2Keys) {
  const fieldId = PAGE2_FIELD_MAP[key].fieldId;
  const found = fields.find((field) => field.fieldId === fieldId);
  if (!found?.value) {
    throw new Error(`Missing mandatory page-2 field: ${key} (${fieldId})`);
  }
}

if (hasAdditionalContent) {
  const additionalFieldId = PAGE2_FIELD_MAP.ADDITIONAL_FEATURES.fieldId;
  const found = fields.find((field) => field.fieldId === additionalFieldId);
  if (!found?.value) {
    throw new Error(
      `Missing mandatory page-2 field: ADDITIONAL_FEATURES (${additionalFieldId})`,
    );
  }
}

const page1CharacterName = fields.find(
  (field) => field.fieldId === PAGE1_FIELD_IDS.CHARACTER_NAME,
);
if (!page1CharacterName?.value) {
  throw new Error("Missing page-1 CharacterName");
}

const personalityTraits = fields.find(
  (field) => field.fieldId === PAGE1_FIELD_IDS.PERSONALITY_TRAITS,
);
if (personalityTraits) {
  throw new Error("PersonalityTraits _25LZ must remain empty");
}

const backstoryField = fields.find(
  (field) => field.fieldId === PAGE2_FIELD_MAP.BACKSTORY.fieldId,
);
const additionalField = fields.find(
  (field) => field.fieldId === PAGE2_FIELD_MAP.ADDITIONAL_FEATURES.fieldId,
);
const appearanceField = fields.find(
  (field) => field.fieldId === PAGE2_FIELD_MAP.APPEARANCE.fieldId,
);

if (!appearanceField?.value.includes("Особенности расы:")) {
  throw new Error("Page-2 appearance missing race traits");
}

if (backstoryField && additionalField) {
  const fateInBackstory = backstoryField.value.includes("Судьбоносные моменты:");
  const fateInAdditional =
    chronicle.fate.length === 0 ||
    additionalField.value.includes("Судьбоносные моменты:");

  if (fateInBackstory || !fateInAdditional) {
    throw new Error(
      "Content distribution mismatch: fate/secrets/prophecies must stay in additional features only",
    );
  }
}

const pdfBytes = await fillCharacterSheetPdf({
  templateBytes,
  fontBytes,
  fields,
});

if (pdfBytes.byteLength < 1000) {
  throw new Error("Generated PDF is unexpectedly small");
}

const header = String.fromCharCode(...pdfBytes.slice(0, 5));
if (header !== "%PDF-") {
  throw new Error(`Invalid PDF header: ${header}`);
}

const reloaded = await PDFDocument.load(pdfBytes);
const form = reloaded.getForm();

const savedPage1Name = form.getTextField(PAGE1_FIELD_IDS.CHARACTER_NAME).getText();
const savedPage2Name = form
  .getTextField(PAGE2_FIELD_MAP.CHARACTER_NAME.fieldId)
  .getText();
const savedAppearance = form
  .getTextField(PAGE2_FIELD_MAP.APPEARANCE.fieldId)
  .getText();
const savedBackstory = form
  .getTextField(PAGE2_FIELD_MAP.BACKSTORY.fieldId)
  .getText();

if (savedPage1Name !== promptValues.characterName) {
  throw new Error(
    `Page-1 CharacterName mismatch: expected "${promptValues.characterName}", got "${savedPage1Name}"`,
  );
}

if (savedPage2Name !== promptValues.characterName) {
  throw new Error(
    `Page-2 character name mismatch: expected "${promptValues.characterName}", got "${savedPage2Name}"`,
  );
}

const savedAlignment = form
  .getTextField(PAGE1_FIELD_IDS.ALIGNMENT)
  .getText();
if (savedAlignment !== promptValues.alignment) {
  throw new Error(
    `Page-1 Alignment mismatch: expected "${promptValues.alignment}", got "${savedAlignment}"`,
  );
}

if (!savedAppearance?.includes(chronicle.race.entry.name)) {
  throw new Error("Page-2 appearance missing race name");
}

if (!savedBackstory?.includes(chronicle.homeland.entry.region)) {
  throw new Error("Page-2 backstory missing homeland");
}

const outputDir = resolve(import.meta.dirname, "../tmp");
mkdirSync(outputDir, { recursive: true });
const outputPath = resolve(outputDir, "chronicle-pdf-export-smoke.pdf");
writeFileSync(outputPath, pdfBytes);

let pdftotextSample = "";
try {
  pdftotextSample = execSync(`pdftotext "${outputPath}" -`, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  }).slice(0, 500);
} catch {
  pdftotextSample = "(pdftotext unavailable)";
}

console.log("chronicle-pdf-export-smoke: OK");
console.log(`Fields mapped: ${fields.length}`);
console.log(`Race: ${chronicle.race.entry.name}, Class: ${chronicle.characterClass.entry.name}`);
console.log(`Page-1 CharacterName: ${savedPage1Name}`);
console.log(`Page-2 name (${PAGE2_FIELD_MAP.CHARACTER_NAME.fieldId}): ${savedPage2Name}`);
console.log(`Appearance traits line present: ${savedAppearance?.includes("Особенности расы:")}`);
console.log(`Output: ${outputPath} (${pdfBytes.byteLength} bytes)`);
console.log(`pdftotext sample:\n${pdftotextSample}`);
