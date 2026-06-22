import { formatChronicleForBuild } from "~/lib/character/applyCharacterBuild";
import {
  createCharacterSnapshot,
  encodeCharacterUrl,
  hydrateCharacterUrl,
  isCharacterUrlTooLong,
  snapshotInputToPayload,
} from "~/lib/generator/characterSnapshot";
import {
  formatNamePlaceholder,
  resolveCharacterNameForExport,
  rollRaceName,
} from "~/lib/chronicle/raceNames";
import { buildPdfDownloadFilename } from "~/lib/pdf/downloadPdfBytes";
import { exportChroniclePdf } from "~/lib/pdf/exportChroniclePdf";
import { loadPdfAssets } from "~/lib/pdf/loadPdfAssets.server";
import type { PdfPromptValues } from "~/lib/pdf/characterSheetFields";

import { assembleChronicle } from "./assembleChronicle";
import { fillMissingBuildSteps } from "./randomFill";
import { mergeBuildInput } from "./mergeBuildInput";
import type { CharacterCreateRequest, CharacterCreateResponse } from "./types";

export type CreateCharacterDeps = {
  appPublicUrl: string;
};

function normalizePublicUrl(base: string): string {
  return base.replace(/\/+$/g, "");
}

function buildPdfPromptValues(
  request: CharacterCreateRequest,
  characterName: string,
  characterNamePlaceholder: string,
): PdfPromptValues {
  const pdf = request.pdf ?? {};

  return {
    characterName: resolveCharacterNameForExport(
      characterName,
      characterNamePlaceholder,
    ),
    playerName: pdf.playerName?.trim() ?? "",
    alignment: pdf.alignment?.trim() ?? "",
    height: pdf.height?.trim() ?? "",
    weight: pdf.weight?.trim() ?? "",
  };
}

export async function createCharacterFromRequest(
  request: CharacterCreateRequest,
  deps: CreateCharacterDeps,
): Promise<CharacterCreateResponse> {
  const warnings: string[] = [];
  const options = request.options ?? {};
  const includeMarkdown = options.includeMarkdown !== false;
  const includePdf = options.includePdf !== false;

  let build = mergeBuildInput(request.build);
  build = fillMissingBuildSteps(build, request.build, {
    seed: options.seed,
    warnings,
  });

  const { chronicle, warnings: chronicleWarnings } = assembleChronicle(
    build,
    request,
  );
  warnings.push(...chronicleWarnings);

  let characterName = "";
  let characterNamePlaceholder = "";

  if (request.characterName?.trim()) {
    characterName = request.characterName.trim();
    characterNamePlaceholder = "";
  } else {
    const genderId = chronicle.gender.entry.id;
    const raceId = build.raceId ?? chronicle.race.entry.id;
    const rolled = rollRaceName(raceId, genderId);
    characterNamePlaceholder = formatNamePlaceholder(rolled);
  }

  const snapshotInput = {
    characterBuild: build,
    chronicle,
    characterName,
    characterNamePlaceholder,
    wizardPhase: "done" as const,
    wizardStep: "review" as const,
  };

  const snapshot = createCharacterSnapshot(snapshotInput);
  const charParam = encodeCharacterUrl(snapshotInputToPayload(snapshotInput));

  try {
    hydrateCharacterUrl(charParam);
  } catch {
    throw new Error("Generated share URL failed decode round-trip");
  }

  const urlTooLong = isCharacterUrlTooLong(charParam);

  const baseUrl = normalizePublicUrl(deps.appPublicUrl);
  const url = `${baseUrl}/?char=${charParam}`;

  if (urlTooLong) {
    warnings.push(
      `Share URL exceeds ${2000} characters; use JSON/PDF from this response instead of the link.`,
    );
  }

  const promptValues = buildPdfPromptValues(
    request,
    characterName,
    characterNamePlaceholder,
  );

  let pdf: CharacterCreateResponse["pdf"] = null;

  if (includePdf) {
    const pdfAssets = await loadPdfAssets();
    const pdfBytes = await exportChroniclePdf(
      {
        chronicle,
        promptValues,
        characterBuild: build,
      },
      pdfAssets,
    );
    pdf = {
      base64: Buffer.from(pdfBytes).toString("base64"),
      filename: buildPdfDownloadFilename(chronicle, promptValues),
      mimeType: "application/pdf",
    };
  }

  const markdown = includeMarkdown
    ? formatChronicleForBuild(chronicle, build)
    : undefined;

  return {
    url,
    urlTooLong,
    snapshot,
    markdown,
    pdf,
    warnings,
  };
}
