import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PDFDocument } from "pdf-lib";

import { PAGE2_FIELD_MAP } from "../src/lib/pdf/page2Mapping";
import { fillCharacterSheetPdf } from "../src/lib/pdf/exportCharacterSheet";

const publicDir = resolve(import.meta.dirname, "../public");
const templateBytes = readFileSync(
  resolve(publicDir, "DnD5e_character_sheet_RUS.pdf"),
).buffer;
const fontBytes = readFileSync(
  resolve(publicDir, "fonts/NotoSans-Regular.ttf"),
).buffer;

const characterName = "Тестовый Герой";
const appearanceText = "Внешность: сине-зелёные глаза, длинные волосы";

const pdfBytes = await fillCharacterSheetPdf({
  templateBytes,
  fontBytes,
  fields: [
    { fieldId: "CharacterName", value: characterName },
    {
      fieldId: PAGE2_FIELD_MAP.APPEARANCE.fieldId,
      value: appearanceText,
    },
  ],
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

const savedName = form.getTextField("CharacterName").getText();
const savedAppearance = form
  .getTextField(PAGE2_FIELD_MAP.APPEARANCE.fieldId)
  .getText();

if (savedName !== characterName) {
  throw new Error(`CharacterName mismatch: expected "${characterName}", got "${savedName}"`);
}

if (savedAppearance !== appearanceText) {
  throw new Error(
    `Appearance mismatch: expected "${appearanceText}", got "${savedAppearance}"`,
  );
}

const outputDir = resolve(import.meta.dirname, "../tmp");
mkdirSync(outputDir, { recursive: true });
const outputPath = resolve(outputDir, "pdf-export-smoke.pdf");
writeFileSync(outputPath, pdfBytes);

console.log("pdf-export-smoke: OK");
console.log(`CharacterName: ${savedName}`);
console.log(`Appearance (${PAGE2_FIELD_MAP.APPEARANCE.fieldId}): ${savedAppearance}`);
console.log(`Output: ${outputPath} (${pdfBytes.byteLength} bytes)`);
console.log("Open the PDF manually to verify visible Cyrillic in form fields.");
