import { applyCharacterBuildToChronicle } from "~/lib/character/applyCharacterBuild";
import {
  currentSettlementOptions,
  setContactChoice,
  setCount,
  setSectionChoice,
  type Chronicle,
  type CountKey,
  type SectionKey,
} from "~/lib/chronicle/generator";

import type {
  CharacterCreateRequest,
  ChronicleContactOverrides,
  ChronicleCountsInput,
  ChronicleSectionOverrides,
} from "./types";
import { createPrng } from "./prng";

const SECTION_OVERRIDE_KEYS: Array<
  keyof ChronicleSectionOverrides & SectionKey
> = [
  "race",
  "characterClass",
  "gender",
  "age",
  "status",
  "hairColor",
  "eyeColor",
  "skinColor",
  "homeland",
  "settlement",
  "background",
  "familyRelation",
  "food",
];

function trySetSection(
  chronicle: Chronicle,
  section: SectionKey,
  id: string,
  warnings: string[],
  index = 0,
): Chronicle {
  try {
    return setSectionChoice(chronicle, section, id, index);
  } catch {
    warnings.push(
      `Unknown chronicle ${section} id "${id}"; kept generated value.`,
    );
    return chronicle;
  }
}

function applySectionOverrides(
  chronicle: Chronicle,
  overrides: ChronicleSectionOverrides | undefined,
  warnings: string[],
): Chronicle {
  if (!overrides) {
    return chronicle;
  }

  let next = chronicle;

  for (const key of SECTION_OVERRIDE_KEYS) {
    const id = overrides[key];
    if (typeof id === "string" && id.length > 0) {
      next = trySetSection(next, key, id, warnings);
    }
  }

  if (overrides.government) {
    const options = next.homeland.entry.governmentOptions;
    if (options.includes(overrides.government)) {
      next = { ...next, government: overrides.government };
    } else {
      warnings.push(
        `Unknown government "${overrides.government}" for homeland "${next.homeland.entry.id}"; kept generated value.`,
      );
    }
  }

  return next;
}

function applyCountOverrides(
  chronicle: Chronicle,
  counts: ChronicleCountsInput | undefined,
  warnings: string[],
): Chronicle {
  if (!counts) {
    return chronicle;
  }

  let next = chronicle;

  for (const key of Object.keys(counts) as CountKey[]) {
    const value = counts[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      next = setCount(next, key, value);
    } else if (value !== undefined) {
      warnings.push(`Invalid chronicleCounts.${key}; skipped.`);
    }
  }

  return next;
}

function applyArrayEntryOverrides(
  chronicle: Chronicle,
  overrides: ChronicleSectionOverrides | undefined,
  warnings: string[],
): Chronicle {
  if (!overrides) {
    return chronicle;
  }

  let next = chronicle;

  if (overrides.fate) {
    overrides.fate.forEach((entry, index) => {
      if (entry.id) {
        next = trySetSection(next, "fate", entry.id, warnings, index);
      }
    });
  }

  if (overrides.secrets) {
    overrides.secrets.forEach((entry, index) => {
      if (entry.id) {
        next = trySetSection(next, "secret", entry.id, warnings, index);
      }
    });
  }

  if (overrides.prophecies) {
    overrides.prophecies.forEach((entry, index) => {
      if (entry.id) {
        next = trySetSection(next, "prophecies", entry.id, warnings, index);
      }
    });
  }

  return next;
}

function applyContactOverrides(
  chronicle: Chronicle,
  contacts: ChronicleContactOverrides | undefined,
  warnings: string[],
): Chronicle {
  if (!contacts) {
    return chronicle;
  }

  let next = chronicle;

  if (contacts.allies) {
    contacts.allies.forEach((contact, index) => {
      if (contact.relationId) {
        try {
          next = setContactChoice(
            next,
            "ally",
            index,
            "relation",
            contact.relationId,
          );
        } catch {
          warnings.push(
            `Unknown ally relationId "${contact.relationId}" at index ${index}; skipped.`,
          );
        }
      }
      if (contact.statId) {
        try {
          next = setContactChoice(
            next,
            "ally",
            index,
            "stat",
            contact.statId,
          );
        } catch {
          warnings.push(
            `Unknown ally statId "${contact.statId}" at index ${index}; skipped.`,
          );
        }
      }
    });
  }

  if (contacts.rivals) {
    contacts.rivals.forEach((contact, index) => {
      if (contact.relationId) {
        try {
          next = setContactChoice(
            next,
            "rival",
            index,
            "relation",
            contact.relationId,
          );
        } catch {
          warnings.push(
            `Unknown rival relationId "${contact.relationId}" at index ${index}; skipped.`,
          );
        }
      }
      if (contact.statId) {
        try {
          next = setContactChoice(
            next,
            "rival",
            index,
            "stat",
            contact.statId,
          );
        } catch {
          warnings.push(
            `Unknown rival statId "${contact.statId}" at index ${index}; skipped.`,
          );
        }
      }
    });
  }

  return next;
}

function validateSettlementForHomeland(
  chronicle: Chronicle,
  warnings: string[],
  seed?: number,
): Chronicle {
  const options = currentSettlementOptions(chronicle);
  const settlementId = chronicle.settlement.entry.id;
  const valid = options.some((entry) => entry.id === settlementId);

  if (valid) {
    return chronicle;
  }

  warnings.push(
    `Settlement "${settlementId}" is incompatible with homeland "${chronicle.homeland.entry.id}"; rerolled settlement.`,
  );

  const prng = createPrng(seed);
  const replacement = prng.pick(options);
  return trySetSection(chronicle, "settlement", replacement.id, warnings);
}

export function assembleChronicle(
  build: Parameters<typeof applyCharacterBuildToChronicle>[0],
  request: Pick<
    CharacterCreateRequest,
    "chronicle" | "chronicleCounts" | "chronicleContacts" | "options"
  >,
): { chronicle: Chronicle; warnings: string[] } {
  const warnings: string[] = [];
  let chronicle = applyCharacterBuildToChronicle(build);

  chronicle = applyCountOverrides(chronicle, request.chronicleCounts, warnings);

  chronicle = applySectionOverrides(chronicle, request.chronicle, warnings);

  chronicle = applyContactOverrides(
    chronicle,
    request.chronicleContacts,
    warnings,
  );

  chronicle = applyArrayEntryOverrides(
    chronicle,
    request.chronicle,
    warnings,
  );

  chronicle = validateSettlementForHomeland(
    chronicle,
    warnings,
    request.options?.seed,
  );

  return { chronicle, warnings };
}
