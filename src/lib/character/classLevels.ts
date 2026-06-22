import { EMPTY_PURSE, parseGoldFromBackgroundItems } from "./coins";
import { isPhbCoreClass } from "./phbCoreClasses";
import type {
  CharacterBuild,
  ClassLevelEntry,
  CoinPurse,
  InventoryItem,
  SpellSelection,
  StepValidation,
  WeaponAttack,
} from "./types";

function emptyBuildDefaults(): CharacterBuild {
  return {
    classLevels: [],
    raceId: null,
    backgroundId: null,
    flexRacialChoices: null,
    abilityScores: null,
    equipmentChoice: null,
    inventory: [],
    coins: { ...EMPTY_PURSE },
    purchasedGearIds: [],
    backgroundSkillChoices: [],
    classSkillChoices: [],
    weaponAttacks: [],
    selectedSpells: [],
    attacksSpellcastingNotes: "",
    wizardCompleted: false,
  };
}

export function getTotalLevel(build: CharacterBuild): number {
  return build.classLevels.reduce((sum, entry) => sum + entry.level, 0);
}

/** Класс с max level; при равенстве — первый в classLevels. */
export function getPrimaryClassId(build: CharacterBuild): string | null {
  if (build.classLevels.length === 0) {
    return null;
  }

  let primary = build.classLevels[0]!;
  for (const entry of build.classLevels.slice(1)) {
    if (entry.level > primary.level) {
      primary = entry;
    }
  }

  return primary.classId;
}

export function validateClassLevels(entries: ClassLevelEntry[]): StepValidation {
  if (entries.length === 0) {
    return { valid: false, message: "Выберите класс персонажа." };
  }

  const seenClassIds = new Set<string>();

  for (const entry of entries) {
    if (!Number.isInteger(entry.level) || entry.level < 1) {
      return { valid: false, message: "Уровень класса должен быть не меньше 1." };
    }

    if (seenClassIds.has(entry.classId)) {
      return { valid: false, message: "Каждый класс можно указать только один раз." };
    }
    seenClassIds.add(entry.classId);

    if (!isPhbCoreClass(entry.classId)) {
      return { valid: false, message: "Выберите базовый класс PHB." };
    }
  }

  const totalLevel = entries.reduce((sum, entry) => sum + entry.level, 0);
  if (totalLevel > 20) {
    return { valid: false, message: "Сумма уровней не может превышать 20" };
  }

  return { valid: true };
}

function normalizeClassLevels(value: unknown): ClassLevelEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const entries: ClassLevelEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    if (typeof record.classId !== "string" || typeof record.level !== "number") {
      continue;
    }

    entries.push({ classId: record.classId, level: record.level });
  }

  return entries;
}

const WALLET_LINE_REGEX = /кошел/i;

function normalizeInventory(value: unknown): InventoryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: InventoryItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    if (typeof record.nameRu !== "string") {
      continue;
    }

    items.push({
      catalogId:
        typeof record.catalogId === "string" || record.catalogId === null
          ? record.catalogId
          : null,
      nameRu: record.nameRu,
      quantity: typeof record.quantity === "number" ? record.quantity : 1,
      weightLb: typeof record.weightLb === "number" ? record.weightLb : 0,
      source:
        record.source === "background" ||
        record.source === "shop" ||
        record.source === "weapon-step"
          ? record.source
          : "background",
    });
  }

  return items;
}

function normalizeCoinPurse(value: unknown): CoinPurse {
  if (!value || typeof value !== "object") {
    return { ...EMPTY_PURSE };
  }

  const record = value as Record<string, unknown>;
  return {
    cp: typeof record.cp === "number" ? record.cp : 0,
    sp: typeof record.sp === "number" ? record.sp : 0,
    ep: typeof record.ep === "number" ? record.ep : 0,
    gp: typeof record.gp === "number" ? record.gp : 0,
    pp: typeof record.pp === "number" ? record.pp : 0,
  };
}

function normalizeWeaponAttacks(value: unknown): WeaponAttack[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const attacks: WeaponAttack[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    if (typeof record.name !== "string" || typeof record.attackBonus !== "number") {
      continue;
    }

    attacks.push({
      weaponId: typeof record.weaponId === "string" ? record.weaponId : undefined,
      name: record.name,
      attackBonus: record.attackBonus,
      damage: typeof record.damage === "string" ? record.damage : "",
    });
  }

  return attacks;
}

function normalizeSelectedSpells(value: unknown): SpellSelection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const spells: SpellSelection[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const record = entry as Record<string, unknown>;
    if (typeof record.spellId !== "string" || typeof record.classId !== "string") {
      continue;
    }

    spells.push({
      spellId: record.spellId,
      classId: record.classId,
      prepared: record.prepared === true,
    });
  }

  return spells;
}

function normalizePurchasedGearIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function migrateLegacyEquipment(raw: Record<string, unknown>): {
  inventory: InventoryItem[];
  coins: CoinPurse;
} {
  const legacyItems = Array.isArray(raw.equipmentItems)
    ? raw.equipmentItems.filter((entry): entry is string => typeof entry === "string")
    : [];

  const legacyGoldGp =
    typeof raw.startingGoldGp === "number" ? raw.startingGoldGp : 0;

  const walletGold = parseGoldFromBackgroundItems(legacyItems);
  const coins: CoinPurse = {
    ...EMPTY_PURSE,
    gp: legacyGoldGp > 0 ? legacyGoldGp : walletGold,
  };

  const inventory: InventoryItem[] = [];
  for (const itemName of legacyItems) {
    if (WALLET_LINE_REGEX.test(itemName)) {
      continue;
    }

    if (legacyGoldGp > 0 && itemName === `${legacyGoldGp} зм`) {
      continue;
    }

    inventory.push({
      catalogId: null,
      nameRu: itemName,
      quantity: 1,
      weightLb: 0,
      source: "background",
    });
  }

  return { inventory, coins };
}

export function migrateCharacterBuild(build: unknown): CharacterBuild {
  const defaults = emptyBuildDefaults();

  if (!build || typeof build !== "object") {
    return defaults;
  }

  const raw = build as Record<string, unknown>;
  const classLevels = normalizeClassLevels(raw.classLevels);

  if (classLevels.length === 0 && typeof raw.classId === "string" && raw.classId) {
    classLevels.push({ classId: raw.classId, level: 1 });
  }

  const hasNewInventory = Array.isArray(raw.inventory);
  const equipmentMigration = hasNewInventory
    ? {
        inventory: normalizeInventory(raw.inventory),
        coins: normalizeCoinPurse(raw.coins),
      }
    : migrateLegacyEquipment(raw);

  const {
    classId: _legacyClassId,
    classLevels: _rawClassLevels,
    equipmentItems: _legacyEquipmentItems,
    startingGoldGp: _legacyStartingGoldGp,
    inventory: _rawInventory,
    coins: _rawCoins,
    ...rest
  } = raw;

  return {
    ...defaults,
    ...rest,
    classLevels,
    inventory: equipmentMigration.inventory,
    coins: equipmentMigration.coins,
    purchasedGearIds: normalizePurchasedGearIds(raw.purchasedGearIds),
    weaponAttacks: normalizeWeaponAttacks(raw.weaponAttacks),
    selectedSpells: normalizeSelectedSpells(raw.selectedSpells),
    attacksSpellcastingNotes:
      typeof raw.attacksSpellcastingNotes === "string"
        ? raw.attacksSpellcastingNotes
        : "",
  } as CharacterBuild;
}
