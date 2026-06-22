import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  CHARACTER_BUILD_STEPS,
  isStepComplete,
} from "../src/lib/character";
import { createCharacterFromRequest } from "../src/server/api/character/createCharacterFromRequest";
import { hydrateCharacterUrl } from "../src/lib/generator/characterUrlCodec";

const APP_URL = process.env.APP_PUBLIC_URL ?? "http://localhost:3000";
const outputDir = resolve(import.meta.dirname, "../tmp");
const pdfPath = resolve(outputDir, "character-api-smoke.pdf");
const jsonPath = resolve(outputDir, "character-api-smoke.json");

async function smokeEmpty(): Promise<void> {
  const result = await createCharacterFromRequest({}, { appPublicUrl: APP_URL });

  if (result.snapshot.wizardPhase !== "done") {
    throw new Error(
      `Expected wizardPhase "done", got "${result.snapshot.wizardPhase}"`,
    );
  }

  if (!result.url.includes("?char=")) {
    throw new Error("Empty request missing char param in url");
  }

  const charParam = result.url.split("char=")[1];
  if (!charParam) {
    throw new Error("Empty request missing char payload in url");
  }
  hydrateCharacterUrl(charParam);

  if (!result.snapshot.characterBuild.raceId) {
    throw new Error("Empty request did not produce raceId");
  }

  if (!result.pdf?.base64) {
    throw new Error("Empty request missing pdf.base64");
  }

  const pdfBytes = Buffer.from(result.pdf.base64, "base64");
  if (pdfBytes.length === 0) {
    throw new Error("Empty request pdf bytes length is 0");
  }

  for (const step of CHARACTER_BUILD_STEPS) {
    if (!isStepComplete(result.snapshot.characterBuild, step)) {
      throw new Error(
        `Empty request: step "${step}" incomplete after pipeline`,
      );
    }
  }

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(pdfPath, pdfBytes);
  writeFileSync(jsonPath, JSON.stringify(result.snapshot, null, 2));

  console.log(
    `empty: race=${result.snapshot.characterBuild.raceId}, class=${result.snapshot.characterBuild.classLevels[0]?.classId}, pdf=${pdfBytes.length} bytes, warnings=${result.warnings.length}`,
  );
  console.log(`artifacts: ${pdfPath}, ${jsonPath}`);
}

async function smokePartialElfWizard(): Promise<void> {
  const result = await createCharacterFromRequest(
    {
      build: {
        raceId: "elf",
        classLevels: [{ classId: "wizard", level: 1 }],
      },
    },
    { appPublicUrl: APP_URL },
  );

  if (result.snapshot.characterBuild.raceId !== "elf") {
    throw new Error(
      `Expected elf race, got ${result.snapshot.characterBuild.raceId}`,
    );
  }

  const classId = result.snapshot.characterBuild.classLevels[0]?.classId;
  if (classId !== "wizard") {
    throw new Error(`Expected wizard class, got ${classId}`);
  }

  if (result.snapshot.chronicle?.race.entry.id !== "elf") {
    throw new Error("Chronicle race should be elf");
  }

  console.log("partial elf wizard: OK");
}

async function smokeSeededNoPdf(): Promise<void> {
  const first = await createCharacterFromRequest(
    { options: { seed: 42, includePdf: false } },
    { appPublicUrl: APP_URL },
  );
  const second = await createCharacterFromRequest(
    { options: { seed: 42, includePdf: false } },
    { appPublicUrl: APP_URL },
  );

  if (first.pdf !== null) {
    throw new Error("Expected pdf null with includePdf: false");
  }

  if (!first.snapshot?.characterBuild?.raceId) {
    throw new Error("Missing snapshot with includePdf: false");
  }

  if (
    first.snapshot.characterBuild.raceId !==
    second.snapshot.characterBuild.raceId
  ) {
    throw new Error("Seeded runs produced different races");
  }

  if (
    first.snapshot.characterBuild.classLevels[0]?.classId !==
    second.snapshot.characterBuild.classLevels[0]?.classId
  ) {
    throw new Error("Seeded runs produced different classes");
  }

  console.log(
    `seeded no-pdf: race=${first.snapshot.characterBuild.raceId}, class=${first.snapshot.characterBuild.classLevels[0]?.classId}`,
  );
}

async function main(): Promise<void> {
  await smokeEmpty();
  await smokePartialElfWizard();
  await smokeSeededNoPdf();
  console.log("character-api-pipeline-smoke: OK");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
