import {
  ABILITY_KEYS,
  computeAbilityScoreState,
  getClassEquipmentCatalogItem,
  getPhbGearItem,
  getPhbWeapon,
  migrateCharacterBuild,
  resolveInventoryItem,
  type AbilityKey,
  type CharacterBuild,
  type EquipmentChoice,
  type ScoreGenerationMethod,
  type SkillName,
} from "~/lib/character";
import { getBackgroundEquipmentCatalogItem } from "~/lib/character/backgroundEquipment";

type AbilityBaseTuple = [number, number, number, number, number, number];

export type InventoryRef = {
  id: string;
  q: number;
  s: "b" | "c" | "s" | "w";
};

type AttackRef = {
  w?: string;
  n?: string;
  b: number;
  d: string;
};

type SpellRef = {
  id: string;
  c: string;
  p: 0 | 1;
};

export type BuildRef = {
  cls: Array<{ id: string; lv: number }>;
  race: string | null;
  bg: string | null;
  flex: AbilityKey[] | null;
  ab: {
    m: ScoreGenerationMethod;
    b: AbilityBaseTuple;
  } | null;
  eq: 0 | 1 | null;
  coins: [number, number, number, number, number];
  inv: InventoryRef[];
  bsk: SkillName[];
  csk: SkillName[];
  atk: AttackRef[];
  spl: SpellRef[];
  notes?: string;
  done: 0 | 1;
};

const SCORE_METHODS: readonly ScoreGenerationMethod[] = [
  "point-buy",
  "standard-array",
  "manual",
];

function clampInt(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.trunc(value);
}

function toAbilityBaseTuple(build: CharacterBuild): AbilityBaseTuple | null {
  if (!build.abilityScores) {
    return null;
  }

  return ABILITY_KEYS.map((key) => build.abilityScores?.base[key] ?? 0) as AbilityBaseTuple;
}

function toAbilityScores(
  tuple: AbilityBaseTuple,
): Record<AbilityKey, number> {
  return {
    str: tuple[0],
    dex: tuple[1],
    con: tuple[2],
    int: tuple[3],
    wis: tuple[4],
    cha: tuple[5],
  };
}

function toInventorySource(ref: InventoryRef): CharacterBuild["inventory"][number]["source"] {
  switch (ref.s) {
    case "b":
      return "background";
    case "c":
      return "class";
    case "s":
      return "shop";
    case "w":
      return "weapon-step";
    default:
      return "background";
  }
}

function toRefSource(source: CharacterBuild["inventory"][number]["source"]): InventoryRef["s"] {
  switch (source) {
    case "background":
      return "b";
    case "class":
      return "c";
    case "shop":
      return "s";
    case "weapon-step":
      return "w";
    default:
      return "b";
  }
}

function isKnownInventoryId(id: string): boolean {
  return Boolean(
    getPhbGearItem(id) ??
      getPhbWeapon(id) ??
      getBackgroundEquipmentCatalogItem(id) ??
      getClassEquipmentCatalogItem(id),
  );
}

function parseSkillList(value: unknown): SkillName[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is SkillName => typeof entry === "string");
}

function parseInventory(value: unknown): InventoryRef[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const refs: InventoryRef[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const record = entry as Record<string, unknown>;
    if (typeof record.id !== "string") {
      continue;
    }

    const source =
      record.s === "b" ||
      record.s === "c" ||
      record.s === "s" ||
      record.s === "w"
        ? record.s
        : "b";

    refs.push({
      id: record.id,
      q: typeof record.q === "number" ? Math.max(1, clampInt(record.q, 1)) : 1,
      s: source,
    });
  }

  return refs;
}

function parseClassLevels(value: unknown): BuildRef["cls"] {
  if (!Array.isArray(value)) {
    return [];
  }

  const levels: BuildRef["cls"] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const record = entry as Record<string, unknown>;
    if (typeof record.id !== "string") {
      continue;
    }
    levels.push({
      id: record.id,
      lv: typeof record.lv === "number" ? Math.max(1, clampInt(record.lv, 1)) : 1,
    });
  }
  return levels;
}

function parseAbilityRef(value: unknown): BuildRef["ab"] {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record.b) || record.b.length !== ABILITY_KEYS.length) {
    return null;
  }
  if (typeof record.m !== "string" || !SCORE_METHODS.includes(record.m as ScoreGenerationMethod)) {
    return null;
  }

  return {
    m: record.m as ScoreGenerationMethod,
    b: [
      clampInt(Number(record.b[0]), 8),
      clampInt(Number(record.b[1]), 8),
      clampInt(Number(record.b[2]), 8),
      clampInt(Number(record.b[3]), 8),
      clampInt(Number(record.b[4]), 8),
      clampInt(Number(record.b[5]), 8),
    ],
  };
}

export function parseBuildRef(value: unknown): BuildRef {
  if (!value || typeof value !== "object") {
    return {
      cls: [],
      race: null,
      bg: null,
      flex: null,
      ab: null,
      eq: null,
      coins: [0, 0, 0, 0, 0],
      inv: [],
      bsk: [],
      csk: [],
      atk: [],
      spl: [],
      done: 0,
    };
  }

  const record = value as Record<string, unknown>;
  const coinsRaw = Array.isArray(record.coins) ? record.coins : [];

  const atkRaw = Array.isArray(record.atk) ? record.atk : [];
  const atk: AttackRef[] = atkRaw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }
    const attack = entry as Record<string, unknown>;
    const hasWeaponId = typeof attack.w === "string";
    const hasName = typeof attack.n === "string";
    if (!hasWeaponId && !hasName) {
      return [];
    }
    return [
      {
        w: hasWeaponId ? (attack.w as string) : undefined,
        n: !hasWeaponId && hasName ? (attack.n as string) : undefined,
        b: typeof attack.b === "number" ? clampInt(attack.b) : 0,
        d: typeof attack.d === "string" ? attack.d : "",
      },
    ];
  });

  const splRaw = Array.isArray(record.spl) ? record.spl : [];
  const spl: SpellRef[] = splRaw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }
    const spell = entry as Record<string, unknown>;
    if (typeof spell.id !== "string" || typeof spell.c !== "string") {
      return [];
    }
    return [
      {
        id: spell.id,
        c: spell.c,
        p: spell.p === 1 ? 1 : 0,
      },
    ];
  });

  return {
    cls: parseClassLevels(record.cls),
    race: typeof record.race === "string" ? record.race : null,
    bg: typeof record.bg === "string" ? record.bg : null,
    flex: Array.isArray(record.flex)
      ? record.flex.filter((entry): entry is AbilityKey => typeof entry === "string")
      : null,
    ab: parseAbilityRef(record.ab),
    eq: record.eq === 0 || record.eq === 1 ? record.eq : null,
    coins: [
      clampInt(Number(coinsRaw[0]), 0),
      clampInt(Number(coinsRaw[1]), 0),
      clampInt(Number(coinsRaw[2]), 0),
      clampInt(Number(coinsRaw[3]), 0),
      clampInt(Number(coinsRaw[4]), 0),
    ],
    inv: parseInventory(record.inv),
    bsk: parseSkillList(record.bsk),
    csk: parseSkillList(record.csk),
    atk,
    spl,
    notes: typeof record.notes === "string" ? record.notes : undefined,
    done: record.done === 1 ? 1 : 0,
  };
}

export function buildToRef(build: CharacterBuild): BuildRef {
  const abilityBase = toAbilityBaseTuple(build);

  return {
    cls: build.classLevels.map((entry) => ({
      id: entry.classId,
      lv: entry.level,
    })),
    race: build.raceId,
    bg: build.backgroundId,
    flex: build.flexRacialChoices,
    ab: abilityBase
      ? {
          m: build.abilityScores?.method ?? "point-buy",
          b: abilityBase,
        }
      : null,
    eq:
      build.equipmentChoice === "equipment"
        ? 0
        : build.equipmentChoice === "gold"
          ? 1
          : null,
    coins: [
      build.coins.cp,
      build.coins.sp,
      build.coins.ep,
      build.coins.gp,
      build.coins.pp,
    ],
    inv: build.inventory.flatMap((item) =>
      item.catalogId
        ? [
            {
              id: item.catalogId,
              q: item.quantity,
              s: toRefSource(item.source),
            },
          ]
        : [],
    ),
    bsk: build.backgroundSkillChoices,
    csk: build.classSkillChoices,
    atk: build.weaponAttacks.map((attack) => ({
      w: attack.weaponId,
      n: attack.weaponId ? undefined : attack.name,
      b: attack.attackBonus,
      d: attack.damage,
    })),
    spl: build.selectedSpells.map((spell) => ({
      id: spell.spellId,
      c: spell.classId,
      p: spell.prepared ? 1 : 0,
    })),
    notes:
      build.attacksSpellcastingNotes.trim().length > 0
        ? build.attacksSpellcastingNotes
        : undefined,
    done: build.wizardCompleted ? 1 : 0,
  };
}

function equipmentChoiceFromRef(ref: BuildRef): EquipmentChoice | null {
  if (ref.eq === 0) {
    return "equipment";
  }
  if (ref.eq === 1) {
    return "gold";
  }
  return null;
}

export function hydrateBuildFromRef(refInput: BuildRef): {
  build: CharacterBuild;
  warnings: string[];
} {
  const ref = parseBuildRef(refInput);
  const warnings: string[] = [];

  const inventory = ref.inv.map((itemRef) => {
    if (!isKnownInventoryId(itemRef.id)) {
      warnings.push(`Часть ссылки устарела: не найден предмет "${itemRef.id}".`);
    }
    return resolveInventoryItem({
      id: itemRef.id,
      quantity: itemRef.q,
      source: toInventorySource(itemRef),
    });
  });

  const purchasedGearIds = Array.from(
    new Set(ref.inv.filter((entry) => entry.s === "s").map((entry) => entry.id)),
  );

  const rawBuild: Partial<CharacterBuild> = {
    classLevels: ref.cls.map((entry) => ({
      classId: entry.id,
      level: entry.lv,
    })),
    raceId: ref.race,
    backgroundId: ref.bg,
    flexRacialChoices: ref.flex,
    abilityScores: null,
    equipmentChoice: equipmentChoiceFromRef(ref),
    inventory,
    coins: {
      cp: ref.coins[0],
      sp: ref.coins[1],
      ep: ref.coins[2],
      gp: ref.coins[3],
      pp: ref.coins[4],
    },
    purchasedGearIds,
    backgroundSkillChoices: ref.bsk,
    classSkillChoices: ref.csk,
    weaponAttacks: ref.atk.map((attack) => ({
      weaponId: attack.w,
      name: attack.n ?? (attack.w ? (getPhbWeapon(attack.w)?.nameRu ?? attack.w) : ""),
      attackBonus: attack.b,
      damage: attack.d,
    })),
    selectedSpells: ref.spl.map((spell) => ({
      spellId: spell.id,
      classId: spell.c,
      prepared: spell.p === 1,
    })),
    attacksSpellcastingNotes: ref.notes ?? "",
    wizardCompleted: ref.done === 1,
  };

  let build = migrateCharacterBuild(rawBuild);

  if (ref.ab && build.raceId) {
    build = {
      ...build,
      abilityScores: computeAbilityScoreState(
        ref.ab.m,
        toAbilityScores(ref.ab.b),
        build.raceId,
        build.flexRacialChoices ?? undefined,
      ),
    };
  } else if (ref.ab && !build.raceId) {
    warnings.push("Не удалось восстановить характеристики: отсутствует raceId.");
  }

  return { build, warnings };
}
