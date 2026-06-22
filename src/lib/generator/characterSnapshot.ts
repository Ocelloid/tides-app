import {
  CHARACTER_BUILD_STEPS,
  migrateCharacterBuild,
  type CharacterBuild,
  type CharacterBuildStep,
} from "~/lib/character";
import type { Chronicle } from "~/lib/chronicle";
import {
  formatNamePlaceholder,
  resolveCharacterNameForExport,
  rollRaceName,
} from "~/lib/chronicle/raceNames";

import { sanitizeFilenamePart } from "~/lib/pdf/downloadPdfBytes";
import { formatClassLabel } from "~/lib/pdf/characterSheetFields";

export const CHARACTER_SNAPSHOT_VERSION = 1 as const;

export type CharacterSnapshot = {
  version: typeof CHARACTER_SNAPSHOT_VERSION;
  exportedAt: string;
  characterBuild: CharacterBuild;
  chronicle: Chronicle | null;
  characterName: string;
  characterNamePlaceholder: string;
  wizardPhase: "active" | "done";
  wizardStep: CharacterBuildStep;
};

export type CharacterSnapshotInput = Omit<
  CharacterSnapshot,
  "version" | "exportedAt"
>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseWizardStep(value: unknown): CharacterBuildStep {
  if (
    typeof value === "string" &&
    CHARACTER_BUILD_STEPS.includes(value as CharacterBuildStep)
  ) {
    return value as CharacterBuildStep;
  }

  return "class";
}

function formatSnapshotVersion(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "нет";
}

function parseChronicle(value: unknown): Chronicle | null {
  if (value == null) {
    return null;
  }

  if (!isRecord(value)) {
    throw new Error("Некорректная хроника в файле.");
  }

  const requiredKeys = [
    "race",
    "characterClass",
    "gender",
    "homeland",
    "background",
    "allies",
    "rivals",
  ] as const;

  for (const key of requiredKeys) {
    if (!(key in value)) {
      throw new Error(`В хронике отсутствует поле «${key}».`);
    }
  }

  return value as Chronicle;
}

export function createCharacterSnapshot(
  input: CharacterSnapshotInput,
): CharacterSnapshot {
  return {
    version: CHARACTER_SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    ...input,
  };
}

export function parseCharacterSnapshot(raw: unknown): CharacterSnapshot {
  if (!isRecord(raw)) {
    throw new Error("Файл не содержит объект JSON.");
  }

  if (raw.version !== CHARACTER_SNAPSHOT_VERSION) {
    throw new Error(
      `Неподдерживаемая версия файла: ${formatSnapshotVersion(raw.version)}.`,
    );
  }

  if (!("characterBuild" in raw)) {
    throw new Error("В файле нет данных персонажа.");
  }

  const wizardPhase = raw.wizardPhase === "done" ? "done" : "active";
  const characterNamePlaceholder =
    typeof raw.characterNamePlaceholder === "string"
      ? raw.characterNamePlaceholder
      : "";
  const characterNameRaw =
    typeof raw.characterName === "string" ? raw.characterName : "";

  return {
    version: CHARACTER_SNAPSHOT_VERSION,
    exportedAt:
      typeof raw.exportedAt === "string"
        ? raw.exportedAt
        : new Date().toISOString(),
    characterBuild: migrateCharacterBuild(raw.characterBuild),
    chronicle: parseChronicle(raw.chronicle),
    characterName: resolveCharacterNameForExport(
      characterNameRaw,
      characterNamePlaceholder,
    ),
    characterNamePlaceholder,
    wizardPhase,
    wizardStep: parseWizardStep(raw.wizardStep),
  };
}

export function buildCharacterSnapshotFilename(
  snapshot: CharacterSnapshot,
): string {
  const chronicle = snapshot.chronicle;
  const characterName = resolveCharacterNameForExport(
    snapshot.characterName,
    snapshot.characterNamePlaceholder,
  );

  const parts = [
    sanitizeFilenamePart(characterName) || "personazh",
    chronicle
      ? sanitizeFilenamePart(formatClassLabel(chronicle))
      : sanitizeFilenamePart(
          snapshot.characterBuild.classLevels[0]?.classId ?? "klass",
        ),
    chronicle
      ? sanitizeFilenamePart(chronicle.race.entry.name)
      : sanitizeFilenamePart(snapshot.characterBuild.raceId ?? "rasa"),
  ].filter((part) => part.length > 0);

  return `${parts.join("-")}.json`;
}

export function downloadCharacterSnapshot(snapshot: CharacterSnapshot): void {
  const filename = buildCharacterSnapshotFilename(snapshot);
  const json = `${JSON.stringify(snapshot, null, 2)}\n`;
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export {
  CHARACTER_URL_VERSION,
  decodeCharacterUrl,
  encodeCharacterUrl,
  hydrateCharacterUrl,
  isCharacterUrlTooLong,
  payloadToSnapshotInput,
  snapshotInputToPayload,
  type CharacterUrlPayload,
} from "./characterUrlCodec";
