import { classTable } from "~/lib/chronicle/chronicle";

import { getClassFeatures } from "./dndData";
import type { CharacterBuild } from "./types";

const CLASS_NAME_BY_ID = new Map(classTable.map((entry) => [entry.id, entry.name]));

function getClassName(classId: string): string {
  return CLASS_NAME_BY_ID.get(classId) ?? classId;
}

function normalizeDescription(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatClassBlock(classId: string, level: number): string | null {
  const features = getClassFeatures(classId, level);

  if (features.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[formatClassFeaturesForPdf] No class features found for classId="${classId}"`,
      );
    }
    return null;
  }

  const sorted = [...features].sort((a, b) => a.level - b.level || a.nameRu.localeCompare(b.nameRu, "ru"));
  const className = getClassName(classId);
  const lines = [`=== ${className} (ур. ${level}) ===`];

  for (const feature of sorted) {
    const description = normalizeDescription(feature.descriptionRu);
    lines.push(`${feature.nameRu} (ур. ${feature.level}): ${description}`);
  }

  return lines.join("\n");
}

/** Class features for PDF field «Features and Traits_3R4V» (page 1). */
export function formatClassFeaturesForPdf(build: CharacterBuild): string {
  if (build.classLevels.length === 0) {
    return "";
  }

  const blocks: string[] = [];

  for (const entry of build.classLevels) {
    const block = formatClassBlock(entry.classId, entry.level);
    if (block) {
      blocks.push(block);
    }
  }

  return blocks.join("\n\n");
}
