import {
  formatChronicle,
  generateChronicle,
  setSectionChoice,
  type Chronicle,
} from "~/lib/chronicle";

import { formatClassLevelForPdf } from "./combatStats";
import { getPrimaryClassId } from "./classLevels";
import type { CharacterBuild } from "./types";

/** Multiclass-aware class label for markdown/PDF when build is available. */
export function formatClassLabelForBuild(
  chronicle: Chronicle,
  build: CharacterBuild,
): string {
  if (build.classLevels.length > 0) {
    return formatClassLevelForPdf(build);
  }

  const characterClass = chronicle.characterClass.entry;
  if (characterClass.category === "subclass" && characterClass.baseClass) {
    return `${characterClass.name} (${characterClass.baseClass.toLowerCase()}) 1`;
  }

  return `${characterClass.name} 1`;
}

function applyBuildChoices(
  build: CharacterBuild,
  chronicle: Chronicle,
): Chronicle {
  let c = chronicle;

  if (build.raceId) {
    c = setSectionChoice(c, "race", build.raceId);
  }
  const classId = getPrimaryClassId(build);
  if (classId) {
    c = setSectionChoice(c, "characterClass", classId);
  }
  if (build.backgroundId) {
    c = setSectionChoice(c, "background", build.backgroundId);
  }

  return c;
}

/** Update wizard race/class/background on an existing chronicle without rerolling narrative. */
export function syncCharacterBuildToChronicle(
  build: CharacterBuild,
  chronicle: Chronicle,
): Chronicle {
  return applyBuildChoices(build, chronicle);
}

/** Generate a full chronicle and lock wizard race/class/background choices. */
export function applyCharacterBuildToChronicle(
  build: CharacterBuild,
): Chronicle {
  return applyBuildChoices(build, generateChronicle());
}

/** Format chronicle markdown with multiclass class label from build. */
export function formatChronicleForBuild(
  chronicle: Chronicle,
  build: CharacterBuild,
): string {
  return formatChronicle(chronicle, {
    classLabel: formatClassLabelForBuild(chronicle, build),
  });
}

/** Reroll narrative sections while preserving wizard race/class/background. */
export function rerollNarrativeChronicle(build: CharacterBuild): Chronicle {
  return applyBuildChoices(build, generateChronicle());
}

/** Reroll chronicle narrative; keep only race and class from the build. */
export function clearNarrativeChronicle(build: CharacterBuild): Chronicle {
  let chronicle = generateChronicle();

  if (build.raceId) {
    chronicle = setSectionChoice(chronicle, "race", build.raceId);
  }

  const classId = getPrimaryClassId(build);
  if (classId) {
    chronicle = setSectionChoice(chronicle, "characterClass", classId);
  }

  return chronicle;
}
