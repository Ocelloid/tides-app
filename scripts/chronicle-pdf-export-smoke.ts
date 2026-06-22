import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PDFDocument } from "pdf-lib";

import {
  applyCharacterBuildToChronicle,
  computeAbilityScoreState,
  computeCombatStats,
  computeWeaponAttack,
  getPhbWeapon,
  type CharacterBuild,
} from "../src/lib/character";
import {
  PAGE1_ABILITY_FIELD_IDS,
  PAGE1_FIELD_IDS,
  PDF_ATTACKS_SPELLCASTING_FIELD_ID,
  PDF_FEATURES_TRAITS_FIELD_ID,
  PDF_LIMITS,
  buildPdfFieldValues,
  formatPdfAbilityModifier,
  splitTextAtSentenceBoundary,
} from "../src/lib/pdf/characterSheetFields";
import { formatClassFeaturesForPdf } from "../src/lib/character/classFeaturesFormat";
import { fillCharacterSheetPdf } from "../src/lib/pdf/exportCharacterSheet";
import type { PdfFieldValue, PdfTextFieldValue } from "../src/lib/pdf/exportCharacterSheet";
import {
  PDF_PASSIVE_FIELD_ID,
  PDF_PROFICIENCIES_LANG_FIELD_ID,
  PDF_SAVING_THROW_CHECKBOX,
  PDF_SKILL_PROFICIENCY_CHECKBOX,
} from "../src/lib/pdf/pdfFieldMapping";
import { PAGE2_FIELD_MAP } from "../src/lib/pdf/page2Mapping";
import { PAGE3_SPELLCASTING_HEADER } from "../src/lib/pdf/page3Mapping";

function isTextField(field: PdfFieldValue): field is PdfTextFieldValue {
  return !("kind" in field) || field.kind !== "checkbox";
}

function findTextField(
  fields: PdfFieldValue[],
  fieldId: string,
): PdfTextFieldValue | undefined {
  for (const field of fields) {
    if (field.fieldId === fieldId && isTextField(field)) {
      return field;
    }
  }

  return undefined;
}

const publicDir = resolve(import.meta.dirname, "../public");
const templateBytes = readFileSync(
  resolve(publicDir, "DnD5e_character_sheet_RUS.pdf"),
).buffer;
const fontBytes = readFileSync(
  resolve(publicDir, "fonts/NotoSans-Regular.ttf"),
).buffer;

const promptValues = {
  characterName: "Тестовый Герой",
  playerName: "Игрок Тест",
  alignment: "нейтральный добрый",
  height: "175 см",
  weight: "70 кг",
};

const abilityBase = {
  str: 15,
  dex: 14,
  con: 13,
  int: 14,
  wis: 10,
  cha: 8,
};
const abilityScores = computeAbilityScoreState(
  "standard-array",
  abilityBase,
  "human",
);

const longsword = getPhbWeapon("longsword");
if (!longsword) {
  throw new Error("PHB longsword missing from catalog");
}

const characterBuild: CharacterBuild = {
  classLevels: [
    { classId: "fighter", level: 2 },
    { classId: "wizard", level: 1 },
  ],
  raceId: "human",
  backgroundId: "acolyte",
  flexRacialChoices: null,
  abilityScores,
  equipmentChoice: "equipment",
  inventory: [
    {
      catalogId: null,
      nameRu: "Священный символ (дар при вступлении в сан)",
      quantity: 1,
      weightLb: 0,
      source: "background",
    },
    {
      catalogId: null,
      nameRu: "Молитвенник или молитвенное колесо",
      quantity: 1,
      weightLb: 0,
      source: "background",
    },
    {
      catalogId: null,
      nameRu: "5 палочек благовоний",
      quantity: 1,
      weightLb: 0,
      source: "background",
    },
    {
      catalogId: null,
      nameRu: "Облачение",
      quantity: 1,
      weightLb: 0,
      source: "background",
    },
    {
      catalogId: null,
      nameRu: "Комплект простой одежды",
      quantity: 1,
      weightLb: 0,
      source: "background",
    },
    {
      catalogId: "rope-hempen",
      nameRu: "Верёвка пеньковая (50 футов)",
      quantity: 1,
      weightLb: 10,
      source: "shop",
    },
    {
      catalogId: "longsword",
      nameRu: "Длинный меч",
      quantity: 1,
      weightLb: 3,
      source: "weapon-step",
    },
  ],
  coins: { cp: 0, sp: 0, ep: 0, gp: 14, pp: 0 },
  purchasedGearIds: ["rope-hempen"],
  backgroundSkillChoices: ["Insight", "Religion"],
  classSkillChoices: ["Athletics", "Perception"],
  weaponAttacks: [],
  selectedSpells: [
    { spellId: "fire-bolt", classId: "wizard", prepared: false },
    { spellId: "magic-missile", classId: "wizard", prepared: true },
  ],
  attacksSpellcastingNotes: "",
  wizardCompleted: true,
};

const combatStats = computeCombatStats(characterBuild);
if (!combatStats) {
  throw new Error("computeCombatStats returned null");
}

characterBuild.weaponAttacks = [
  computeWeaponAttack(
    characterBuild,
    longsword,
    combatStats.proficiencyBonus,
    abilityScores.modifier,
  ),
];

const chronicle = applyCharacterBuildToChronicle(characterBuild);

const fields = buildPdfFieldValues({ chronicle, promptValues, characterBuild });

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
  const found = findTextField(fields, fieldId);
  if (!found?.value) {
    throw new Error(`Missing mandatory page-2 field: ${key} (${fieldId})`);
  }
}

if (hasAdditionalContent) {
  const additionalFieldId = PAGE2_FIELD_MAP.ADDITIONAL_FEATURES.fieldId;
  const found = findTextField(fields, additionalFieldId);
  if (!found?.value) {
    throw new Error(
      `Missing mandatory page-2 field: ADDITIONAL_FEATURES (${additionalFieldId})`,
    );
  }
}

const page1CharacterName = findTextField(fields, PAGE1_FIELD_IDS.CHARACTER_NAME);
if (!page1CharacterName?.value) {
  throw new Error("Missing page-1 CharacterName");
}

const expectedStrScore = String(abilityScores.total.str);
const expectedStrMod = formatPdfAbilityModifier(abilityScores.modifier.str);
const strField = findTextField(fields, PAGE1_ABILITY_FIELD_IDS.str.score);
const strModField = findTextField(fields, PAGE1_ABILITY_FIELD_IDS.str.mod);
if (strField?.value !== expectedStrScore) {
  throw new Error(
    `STR mismatch: expected "${expectedStrScore}", got "${strField?.value ?? ""}"`,
  );
}
if (strModField?.value !== expectedStrMod) {
  throw new Error(
    `STRmod mismatch: expected "${expectedStrMod}", got "${strModField?.value ?? ""}"`,
  );
}

const equipmentField = findTextField(fields, PAGE1_FIELD_IDS.EQUIPMENT);
if (!equipmentField?.value.includes("Священный символ")) {
  throw new Error("Equipment_VXRI missing acolyte gear");
}
if (!equipmentField?.value.includes("Верёвка пеньковая")) {
  throw new Error("Equipment_VXRI missing shop gear");
}
if (!equipmentField?.value.includes("Монеты: 14 зм")) {
  throw new Error(
    `Equipment_VXRI missing coins line: got "${equipmentField?.value ?? ""}"`,
  );
}

const gpField = findTextField(fields, PAGE1_FIELD_IDS.GP);
if (gpField?.value) {
  throw new Error(
    `GP coin field must stay empty; coins go to equipment box, got "${gpField.value}"`,
  );
}

const classLevelField = findTextField(fields, PAGE1_FIELD_IDS.CLASS_LEVEL);
if (!classLevelField?.value.includes("Воин 2")) {
  throw new Error(
    `ClassLevel missing fighter: got "${classLevelField?.value ?? ""}"`,
  );
}
if (!classLevelField?.value.includes("Волшебник 1")) {
  throw new Error(
    `ClassLevel missing wizard: got "${classLevelField?.value ?? ""}"`,
  );
}

const featuresField = findTextField(fields, PDF_FEATURES_TRAITS_FIELD_ID);
if (!featuresField?.value) {
  throw new Error("Features and Traits_3R4V is empty");
}
if (!featuresField.value.includes("Воин")) {
  throw new Error("Features missing fighter section");
}
if (featuresField.value.length > PDF_LIMITS.features) {
  throw new Error(
    `Features and Traits exceeds ${PDF_LIMITS.features} chars: ${featuresField.value.length}`,
  );
}

const fullFeaturesText = formatClassFeaturesForPdf(characterBuild);
const expectedFeaturesSplit = splitTextAtSentenceBoundary(
  fullFeaturesText,
  PDF_LIMITS.features,
);
if (featuresField.value !== expectedFeaturesSplit.main) {
  throw new Error("Features and Traits main block does not match sentence split");
}

const additionalField = findTextField(
  fields,
  PAGE2_FIELD_MAP.ADDITIONAL_FEATURES.fieldId,
);
if (expectedFeaturesSplit.overflow) {
  if (!additionalField?.value?.includes(expectedFeaturesSplit.overflow.slice(0, 40))) {
    throw new Error(
      "Class features overflow missing from page-2 additional features",
    );
  }
}

const attacksNotesField = findTextField(fields, PDF_ATTACKS_SPELLCASTING_FIELD_ID);
if (attacksNotesField?.value?.includes("Умения (продолжение)")) {
  throw new Error("Class features overflow must not go to AttacksSpellcasting");
}

const weaponNameField = findTextField(fields, "Wpn Name");
if (!weaponNameField?.value?.includes("Длинный меч")) {
  throw new Error(
    `Wpn Name missing longsword: got "${weaponNameField?.value ?? ""}"`,
  );
}

const spellClassField = findTextField(
  fields,
  PAGE3_SPELLCASTING_HEADER.className,
);
if (!spellClassField?.value?.includes("Волшебник")) {
  throw new Error(
    `Page-3 primary caster missing wizard: got "${spellClassField?.value ?? ""}"`,
  );
}

const spellAbilityField = findTextField(
  fields,
  PAGE3_SPELLCASTING_HEADER.ability,
);
if (spellAbilityField?.value !== "INT") {
  throw new Error(
    `Page-3 spellcasting ability mismatch: expected INT, got "${spellAbilityField?.value ?? ""}"`,
  );
}

const cantripField = fields.find(
  (field) =>
    isTextField(field) &&
    field.fieldId.startsWith("Spells ") &&
    field.value?.includes("Огненный снаряд"),
);
if (!cantripField) {
  throw new Error("Page-3 cantrip field missing fire-bolt");
}

const level1SpellField = fields.find(
  (field) =>
    isTextField(field) &&
    field.fieldId.startsWith("Spells ") &&
    field.value?.includes("Волшебная стрела"),
);
if (!level1SpellField) {
  throw new Error("Page-3 level-1 spell field missing magic-missile");
}

const slotsTotal1 = findTextField(fields, "SlotsTotal 19");
if (!slotsTotal1?.value || Number(slotsTotal1.value) < 1) {
  throw new Error("Page-3 SlotsTotal 19 missing for multiclass caster");
}

const expectedHp = String(combatStats.hitPointMaximum);
const hpMaxField = findTextField(fields, "HPMax");
const acField = findTextField(fields, "AC");
const initiativeField = findTextField(fields, "Initiative");
const speedField = findTextField(fields, "Speed");
const athleticsField = findTextField(fields, "Athletics");
const insightField = findTextField(fields, "Insight");

if (hpMaxField?.value !== expectedHp) {
  throw new Error(
    `HPMax mismatch: expected "${expectedHp}", got "${hpMaxField?.value ?? ""}"`,
  );
}
if (acField?.value !== String(combatStats.armorClass)) {
  throw new Error(
    `AC mismatch: expected "${combatStats.armorClass}", got "${acField?.value ?? ""}"`,
  );
}
if (initiativeField?.value !== formatPdfAbilityModifier(combatStats.initiative)) {
  throw new Error(
    `Initiative mismatch: expected "${formatPdfAbilityModifier(combatStats.initiative)}", got "${initiativeField?.value ?? ""}"`,
  );
}
if (speedField?.value !== String(combatStats.speed)) {
  throw new Error(
    `Speed mismatch: expected "${combatStats.speed}", got "${speedField?.value ?? ""}"`,
  );
}
if (insightField?.value !== formatPdfAbilityModifier(combatStats.skillBonuses.Insight)) {
  throw new Error("Insight skill bonus missing or incorrect for acolyte");
}
if (!athleticsField?.value) {
  throw new Error("Athletics skill field missing");
}

const checkboxFields = fields.filter(
  (field) => "kind" in field && field.kind === "checkbox" && field.checked,
);
if (checkboxFields.length < 6) {
  throw new Error(
    `Expected at least 6 proficiency checkboxes, got ${checkboxFields.length}`,
  );
}

const proficienciesField = findTextField(
  fields,
  PDF_PROFICIENCIES_LANG_FIELD_ID,
);
if (!proficienciesField?.value) {
  throw new Error("ProficienciesLang_OVQQ missing class/background proficiencies");
}

const passiveField = findTextField(fields, PDF_PASSIVE_FIELD_ID);
if (!passiveField?.value) {
  throw new Error("Passive perception field missing");
}

const personalityTraits = findTextField(
  fields,
  PAGE1_FIELD_IDS.PERSONALITY_TRAITS,
);
if (personalityTraits) {
  throw new Error("PersonalityTraits _25LZ must remain empty");
}

const backstoryField = findTextField(fields, PAGE2_FIELD_MAP.BACKSTORY.fieldId);
const appearanceField = findTextField(fields, PAGE2_FIELD_MAP.APPEARANCE.fieldId);

if (!appearanceField?.value.includes("Особенности расы:")) {
  throw new Error("Page-2 appearance missing race traits");
}
if (!appearanceField?.value.includes("Воин 2")) {
  throw new Error("Page-2 appearance missing multiclass label");
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

const savedStr = form.getTextField(PAGE1_ABILITY_FIELD_IDS.str.score).getText();
const savedStrMod = form
  .getTextField(PAGE1_ABILITY_FIELD_IDS.str.mod)
  .getText();
const savedEquipment = form.getTextField(PAGE1_FIELD_IDS.EQUIPMENT).getText();
const savedGp = form.getTextField(PAGE1_FIELD_IDS.GP).getText();
const savedClassLevel = form.getTextField(PAGE1_FIELD_IDS.CLASS_LEVEL).getText();
const savedFeatures = form.getTextField(PDF_FEATURES_TRAITS_FIELD_ID).getText();
const savedHpMax = form.getTextField("HPMax").getText();
const savedAc = form.getTextField("AC").getText();
const savedInsight = form.getTextField("Insight").getText();
const savedProficiencies = form
  .getTextField(PDF_PROFICIENCIES_LANG_FIELD_ID)
  .getText();
const savedPassive = form.getTextField(PDF_PASSIVE_FIELD_ID).getText();
const savedWeaponName = form.getTextField("Wpn Name").getText();
const savedSpellClass = form
  .getTextField(PAGE3_SPELLCASTING_HEADER.className)
  .getText();
const savedAttacksNotes = form
  .getTextField(PDF_ATTACKS_SPELLCASTING_FIELD_ID)
  .getText();

const insightChecked = form
  .getCheckBox(PDF_SKILL_PROFICIENCY_CHECKBOX.Insight)
  .isChecked();
const athleticsChecked = form
  .getCheckBox(PDF_SKILL_PROFICIENCY_CHECKBOX.Athletics)
  .isChecked();
const strSaveChecked = form
  .getCheckBox(PDF_SAVING_THROW_CHECKBOX.str)
  .isChecked();
const magicMissilePrepared = form.getCheckBox("Check Box 251").isChecked();

if (savedStr !== expectedStrScore) {
  throw new Error(
    `Saved STR mismatch: expected "${expectedStrScore}", got "${savedStr}"`,
  );
}
if (savedStrMod !== expectedStrMod) {
  throw new Error(
    `Saved STRmod mismatch: expected "${expectedStrMod}", got "${savedStrMod}"`,
  );
}
if (!savedEquipment?.includes("Священный символ")) {
  throw new Error("Saved Equipment_VXRI missing gear text");
}
if (!savedEquipment?.includes("Монеты: 14 зм")) {
  throw new Error(`Saved equipment missing coins line: "${savedEquipment ?? ""}"`);
}
if (savedGp) {
  throw new Error(`Saved GP coin field must stay empty, got "${savedGp}"`);
}
if (!savedClassLevel?.includes("Воин 2") || !savedClassLevel.includes("Волшебник 1")) {
  throw new Error(`Saved ClassLevel multiclass mismatch: "${savedClassLevel}"`);
}
if (!savedFeatures?.includes("Воин")) {
  throw new Error("Saved Features and Traits_3R4V missing fighter features");
}
if (savedHpMax !== expectedHp) {
  throw new Error(
    `Saved HPMax mismatch: expected "${expectedHp}", got "${savedHpMax}"`,
  );
}
if (savedAc !== String(combatStats.armorClass)) {
  throw new Error(
    `Saved AC mismatch: expected "${combatStats.armorClass}", got "${savedAc}"`,
  );
}
if (savedInsight !== formatPdfAbilityModifier(combatStats.skillBonuses.Insight)) {
  throw new Error("Saved Insight skill bonus mismatch");
}
if (!savedProficiencies?.includes("Доспехи")) {
  throw new Error("Saved proficiencies missing class armor proficiencies");
}
if (savedPassive !== String(10 + combatStats.skillBonuses.Perception)) {
  throw new Error(
    `Saved passive perception mismatch: expected "${10 + combatStats.skillBonuses.Perception}", got "${savedPassive}"`,
  );
}
if (!insightChecked || !athleticsChecked || !strSaveChecked) {
  throw new Error("Proficiency checkboxes not checked in saved PDF");
}
if (!savedWeaponName?.includes("Длинный меч")) {
  throw new Error(`Saved Wpn Name missing longsword: "${savedWeaponName}"`);
}
if (!savedSpellClass?.includes("Волшебник")) {
  throw new Error(`Saved page-3 caster class missing wizard: "${savedSpellClass}"`);
}
if (!magicMissilePrepared) {
  throw new Error("Prepared checkbox not checked for magic-missile");
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
console.log(`Fields mapped: ${fields.length} (${checkboxFields.length} checkboxes)`);
console.log(
  `Race: ${chronicle.race.entry.name}, Primary class: ${chronicle.characterClass.entry.name}`,
);
console.log(`Page-1 CharacterName: ${savedPage1Name}`);
console.log(`Page-2 name (${PAGE2_FIELD_MAP.CHARACTER_NAME.fieldId}): ${savedPage2Name}`);
console.log(`Appearance traits line present: ${savedAppearance?.includes("Особенности расы:")}`);
console.log(`Page-1 STR: ${savedStr} (${savedStrMod})`);
console.log(`Page-1 HPMax: ${savedHpMax}, AC: ${savedAc}, Speed: ${speedField?.value}`);
console.log(`Page-1 ClassLevel: ${savedClassLevel}`);
console.log(`Page-1 equipment coins: ${savedEquipment?.includes("Монеты:")}, Wpn Name: ${savedWeaponName}`);
console.log(`Page-3 caster: ${savedSpellClass}, prepared magic-missile: ${magicMissilePrepared}`);
console.log(`AttacksSpellcasting notes length: ${savedAttacksNotes?.length ?? 0}`);
console.log(`Equipment present: ${savedEquipment?.includes("Верёвка пеньковая")}`);
console.log(`Output: ${outputPath} (${pdfBytes.byteLength} bytes)`);
console.log(`pdftotext sample:\n${pdftotextSample}`);
