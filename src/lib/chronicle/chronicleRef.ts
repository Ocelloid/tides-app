import {
  backgrounds,
  familyRelations,
  fateMoments,
  homelandTable,
  prophecies,
  secrets,
  type RangeEntry,
} from "./chronicle";
import {
  ageOptions,
  classOptions,
  contactRelationOptions,
  contactStatOptions,
  currentFoodOptions,
  currentSettlementOptions,
  eyeColorOptions,
  familySizeOptions,
  genderOptions,
  generateChronicle,
  hairColorOptions,
  raceOptions,
  setCount,
  skinColorOptions,
  statusOptions,
  type Chronicle,
  type Contact,
  type RollResult,
} from "./generator";

export type RollRef = {
  i: string;
  r: number;
};

export type ChronicleRef = {
  race: RollRef;
  cls: RollRef;
  gender: RollRef;
  age: RollRef;
  status: RollRef;
  hair: RollRef;
  eyes: RollRef;
  skin: RollRef;
  homeland: RollRef;
  gov: number;
  settlement: RollRef;
  background: RollRef;
  familySize: RollRef;
  familyRelation: RollRef;
  food: RollRef;
  counts: {
    sa: number;
    sr: number;
    ac: number;
    rc: number;
    fc: number;
    sc: number;
    pc: number;
    sib: number;
  };
  allies: Array<{ rel: RollRef; stat: RollRef }>;
  rivals: Array<{ rel: RollRef; stat: RollRef }>;
  fate: RollRef[];
  secrets: RollRef[];
  prophecies: RollRef[];
};

const MAX_BLOCK_COUNT = 5;

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function clampCount(value: number): number {
  return clampInt(value, 0, MAX_BLOCK_COUNT);
}

function toRollRef<T extends RangeEntry>(result: RollResult<T>): RollRef {
  return { i: result.entry.id, r: result.roll };
}

function fromRollRef<T extends RangeEntry>(table: T[], ref: RollRef): RollResult<T> | null {
  const entry = table.find((item) => item.id === ref.i);
  if (!entry) {
    return null;
  }

  const roll = clampInt(ref.r, entry.min, entry.max);

  return {
    entry,
    roll,
  };
}

function withHydratedRoll<T extends RangeEntry>(
  current: RollResult<T>,
  table: T[],
  ref: RollRef,
  sectionLabel: string,
  warnings: string[],
): RollResult<T> {
  const hydrated = fromRollRef(table, ref);

  if (!hydrated) {
    warnings.push(`Часть ссылки устарела: не найден id "${ref.i}" в секции "${sectionLabel}".`);
    return current;
  }

  return hydrated;
}

function hydrateRollList<T extends RangeEntry>(
  current: RollResult<T>[],
  refs: RollRef[],
  table: T[],
  sectionLabel: string,
  warnings: string[],
): RollResult<T>[] {
  return current.map((item, index) => {
    const ref = refs[index];
    if (!ref) {
      return item;
    }

    const hydrated = fromRollRef(table, ref);
    if (!hydrated) {
      warnings.push(`Часть ссылки устарела: не найден id "${ref.i}" в секции "${sectionLabel}" #${index + 1}.`);
      return item;
    }

    return hydrated;
  });
}

function hydrateContacts(
  current: Contact[],
  refs: Array<{ rel: RollRef; stat: RollRef }>,
  kind: "ally" | "rival",
  warnings: string[],
): Contact[] {
  const relationTable = contactRelationOptions(kind);
  const statTable = contactStatOptions();

  return current.map((item, index) => {
    const ref = refs[index];
    if (!ref) {
      return item;
    }

    const relation = fromRollRef(relationTable, ref.rel);
    const stat = fromRollRef(statTable, ref.stat);

    if (!relation) {
      warnings.push(`Часть ссылки устарела: не найден id "${ref.rel.i}" в ${kind === "ally" ? "союзнике" : "сопернике"} #${index + 1} (отношение).`);
    }
    if (!stat) {
      warnings.push(`Часть ссылки устарела: не найден id "${ref.stat.i}" в ${kind === "ally" ? "союзнике" : "сопернике"} #${index + 1} (характеристика).`);
    }

    return {
      ...item,
      relation: relation ?? item.relation,
      stat: stat ?? item.stat,
    };
  });
}

export function chronicleToRef(chronicle: Chronicle): ChronicleRef {
  const governmentIndex = chronicle.homeland.entry.governmentOptions.indexOf(chronicle.government);

  return {
    race: toRollRef(chronicle.race),
    cls: toRollRef(chronicle.characterClass),
    gender: toRollRef(chronicle.gender),
    age: toRollRef(chronicle.age),
    status: toRollRef(chronicle.status),
    hair: toRollRef(chronicle.hairColor),
    eyes: toRollRef(chronicle.eyeColor),
    skin: toRollRef(chronicle.skinColor),
    homeland: toRollRef(chronicle.homeland),
    gov: governmentIndex >= 0 ? governmentIndex : 0,
    settlement: toRollRef(chronicle.settlement),
    background: toRollRef(chronicle.background),
    familySize: toRollRef(chronicle.familySize),
    familyRelation: toRollRef(chronicle.familyRelation),
    food: toRollRef(chronicle.food),
    counts: {
      sa: chronicle.socialAllyCount,
      sr: chronicle.socialRivalCount,
      ac: chronicle.allyCount,
      rc: chronicle.rivalCount,
      fc: chronicle.fateCount,
      sc: chronicle.secretCount,
      pc: chronicle.prophecyCount,
      sib: chronicle.siblingCount,
    },
    allies: chronicle.allies.map((contact) => ({
      rel: toRollRef(contact.relation),
      stat: toRollRef(contact.stat),
    })),
    rivals: chronicle.rivals.map((contact) => ({
      rel: toRollRef(contact.relation),
      stat: toRollRef(contact.stat),
    })),
    fate: chronicle.fate.map(toRollRef),
    secrets: chronicle.secrets.map(toRollRef),
    prophecies: chronicle.prophecyList.map(toRollRef),
  };
}

export function hydrateChronicleFromRef(ref: ChronicleRef): { chronicle: Chronicle; warnings: string[] } {
  const warnings: string[] = [];
  let chronicle = generateChronicle();

  chronicle = {
    ...chronicle,
    race: withHydratedRoll(chronicle.race, raceOptions(), ref.race, "race", warnings),
    characterClass: withHydratedRoll(chronicle.characterClass, classOptions(), ref.cls, "cls", warnings),
    gender: withHydratedRoll(chronicle.gender, genderOptions(), ref.gender, "gender", warnings),
    age: withHydratedRoll(chronicle.age, ageOptions(), ref.age, "age", warnings),
    status: withHydratedRoll(chronicle.status, statusOptions(), ref.status, "status", warnings),
    hairColor: withHydratedRoll(chronicle.hairColor, hairColorOptions(), ref.hair, "hair", warnings),
    eyeColor: withHydratedRoll(chronicle.eyeColor, eyeColorOptions(), ref.eyes, "eyes", warnings),
    skinColor: withHydratedRoll(chronicle.skinColor, skinColorOptions(), ref.skin, "skin", warnings),
  };

  chronicle = {
    ...chronicle,
    homeland: withHydratedRoll(chronicle.homeland, homelandTable, ref.homeland, "homeland", warnings),
  };

  const governmentOptions = chronicle.homeland.entry.governmentOptions;
  if (governmentOptions.length > 0) {
    let govIndex = Number.isFinite(ref.gov) ? Math.trunc(ref.gov) : 0;
    if (govIndex < 0 || govIndex >= governmentOptions.length) {
      warnings.push(`Часть ссылки устарела: индекс правительства ${ref.gov} вне диапазона, выбран первый вариант.`);
      govIndex = 0;
    }

    chronicle = {
      ...chronicle,
      government: governmentOptions[govIndex] ?? governmentOptions[0]!,
    };
  } else {
    warnings.push("Часть ссылки устарела: для родины нет доступных вариантов правительства.");
  }

  chronicle = {
    ...chronicle,
    settlement: withHydratedRoll(
      chronicle.settlement,
      currentSettlementOptions(chronicle),
      ref.settlement,
      "settlement",
      warnings,
    ),
  };

  chronicle = {
    ...chronicle,
    food: withHydratedRoll(chronicle.food, currentFoodOptions(chronicle), ref.food, "food", warnings),
    background: withHydratedRoll(chronicle.background, backgrounds, ref.background, "background", warnings),
  };

  chronicle = {
    ...chronicle,
    familySize: withHydratedRoll(
      chronicle.familySize,
      familySizeOptions(chronicle),
      ref.familySize,
      "familySize",
      warnings,
    ),
    familyRelation: withHydratedRoll(
      chronicle.familyRelation,
      familyRelations,
      ref.familyRelation,
      "familyRelation",
      warnings,
    ),
    siblingCount: clampInt(ref.counts.sib, 0, 20),
    allyCount: clampCount(ref.counts.ac),
    rivalCount: clampCount(ref.counts.rc),
    fateCount: clampCount(ref.counts.fc),
    secretCount: clampCount(ref.counts.sc),
    prophecyCount: clampCount(ref.counts.pc),
  };

  chronicle = setCount(chronicle, "allies", chronicle.allyCount);
  chronicle = setCount(chronicle, "rivals", chronicle.rivalCount);
  chronicle = setCount(chronicle, "fate", chronicle.fateCount);
  chronicle = setCount(chronicle, "secrets", chronicle.secretCount);
  chronicle = setCount(chronicle, "prophecies", chronicle.prophecyCount);

  chronicle = {
    ...chronicle,
    allies: hydrateContacts(chronicle.allies, ref.allies, "ally", warnings),
    rivals: hydrateContacts(chronicle.rivals, ref.rivals, "rival", warnings),
    fate: hydrateRollList(chronicle.fate, ref.fate, fateMoments, "fate", warnings),
    secrets: hydrateRollList(chronicle.secrets, ref.secrets, secrets, "secrets", warnings),
    prophecyList: hydrateRollList(chronicle.prophecyList, ref.prophecies, prophecies, "prophecies", warnings),
  };

  return { chronicle, warnings };
}
