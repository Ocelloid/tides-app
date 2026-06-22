import { getPhbGearItem } from "./phbGearCatalog";
import { getPhbWeapon } from "./phbWeaponsCatalog";
import type { InventoryItem } from "./types";

function weaponItem(weaponId: string, quantity = 1): InventoryItem {
  const weapon = getPhbWeapon(weaponId);

  return {
    catalogId: weaponId,
    nameRu: weapon?.nameRu ?? weaponId,
    quantity,
    weightLb: weapon?.weightLb ?? 0,
    source: "class",
  };
}

function gearItem(catalogId: string, quantity = 1): InventoryItem {
  const gear = getPhbGearItem(catalogId);

  return {
    catalogId,
    nameRu: gear?.nameRu ?? catalogId,
    quantity,
    weightLb: gear?.weightLb ?? 0,
    source: "class",
  };
}

type ClassTextCatalogItem = {
  catalogId: string;
  nameRu: string;
  weightLb: number;
};

const classTextCatalogById = new Map<string, ClassTextCatalogItem>();

function registerClassTextCatalogItem(
  catalogId: string,
  nameRu: string,
  weightLb: number,
): ClassTextCatalogItem {
  const existing = classTextCatalogById.get(catalogId);
  if (existing) {
    if (existing.nameRu !== nameRu || existing.weightLb !== weightLb) {
      throw new Error(
        `[classEquipment] Conflicting class item definition: ${catalogId}`,
      );
    }
    return existing;
  }

  const item = { catalogId, nameRu, weightLb };
  classTextCatalogById.set(catalogId, item);
  return item;
}

function textItem(
  catalogId: string,
  nameRu: string,
  weightLb = 0,
  quantity = 1,
): InventoryItem {
  registerClassTextCatalogItem(catalogId, nameRu, weightLb);

  return {
    catalogId,
    nameRu,
    quantity,
    weightLb,
    source: "class",
  };
}

/**
 * Стартовое снаряжение класса (PHB 2014, вариант «а» в каждой группе выбора).
 * Доспехи и наборы — текстовые строки (нет в каталоге gear).
 */
const CLASS_STARTING_ITEMS: Record<string, InventoryItem[]> = {
  barbarian: [
    weaponItem("greataxe"),
    weaponItem("handaxe", 2),
    textItem("cls:explorers-pack", "Набор путешественника", 21),
    weaponItem("javelin", 4),
  ],
  bard: [
    weaponItem("rapier"),
    textItem("cls:diplomats-pack", "Набор дипломата", 39),
    textItem("cls:leather-armor", "Кожаный доспех", 10),
    weaponItem("dagger"),
  ],
  cleric: [
    weaponItem("mace"),
    textItem("cls:scale-mail", "Чешуйчатый доспех", 45),
    weaponItem("light-crossbow"),
    textItem("cls:bolts-20", "20 болтов", 1.5),
    textItem("cls:priests-pack", "Набор священника", 24),
    textItem("cls:shield", "Щит", 6),
    gearItem("holy-symbol"),
  ],
  druid: [
    textItem("cls:wooden-shield", "Деревянный щит", 6),
    weaponItem("scimitar"),
    textItem("cls:leather-armor", "Кожаный доспех", 10),
    textItem("cls:explorers-pack", "Набор путешественника", 21),
    gearItem("druidic-focus"),
  ],
  fighter: [
    textItem("cls:chain-mail", "Кольчуга", 55),
    weaponItem("longsword"),
    textItem("cls:shield", "Щит", 6),
    weaponItem("light-crossbow"),
    textItem("cls:bolts-20", "20 болтов", 1.5),
    textItem("cls:dungeoneers-pack", "Набор исследователя подземелий", 21.5),
  ],
  monk: [
    weaponItem("shortsword"),
    textItem("cls:dungeoneers-pack", "Набор исследователя подземелий", 21.5),
    weaponItem("dart", 10),
  ],
  paladin: [
    weaponItem("longsword"),
    textItem("cls:shield", "Щит", 6),
    weaponItem("javelin", 5),
    textItem("cls:priests-pack", "Набор священника", 24),
    textItem("cls:chain-mail", "Кольчуга", 55),
    gearItem("holy-symbol"),
  ],
  ranger: [
    textItem("cls:scale-mail", "Чешуйчатый доспех", 45),
    weaponItem("shortsword"),
    textItem("cls:dungeoneers-pack", "Набор исследователя подземелий", 21.5),
    weaponItem("longbow"),
    textItem("cls:arrows-20", "20 стрел", 1),
  ],
  rogue: [
    weaponItem("rapier"),
    weaponItem("shortbow"),
    textItem("cls:arrows-20", "20 стрел", 1),
    textItem("cls:burglars-pack", "Набор вора", 16),
    textItem("cls:leather-armor", "Кожаный доспех", 10),
    weaponItem("dagger", 2),
    textItem("cls:thieves-tools", "Инструменты вора", 1),
  ],
  sorcerer: [
    weaponItem("light-crossbow"),
    textItem("cls:bolts-20", "20 болтов", 1.5),
    weaponItem("dagger", 2),
    textItem("cls:component-pouch", "Мешочек с реагентами", 0),
    textItem("cls:dungeoneers-pack", "Набор исследователя подземелий", 21.5),
  ],
  warlock: [
    weaponItem("light-crossbow"),
    textItem("cls:bolts-20", "20 болтов", 1.5),
    textItem("cls:component-pouch", "Мешочек с реагентами", 0),
    textItem("cls:scholars-pack", "Набор учёного", 22),
  ],
  wizard: [
    weaponItem("quarterstaff"),
    textItem("cls:component-pouch", "Мешочек с реагентами", 0),
    textItem("cls:scholars-pack", "Набор учёного", 22),
  ],
};

export function getClassEquipmentCatalogItem(
  catalogId: string,
): ClassTextCatalogItem | undefined {
  return classTextCatalogById.get(catalogId);
}

export function resolveClassPack(classId: string): InventoryItem[] {
  return CLASS_STARTING_ITEMS[classId]?.map((item) => ({ ...item })) ?? [];
}

export function getClassStartingItemLabels(classId: string): string[] {
  return resolveClassPack(classId).map((item) =>
    item.quantity > 1 ? `${item.nameRu} (×${item.quantity})` : item.nameRu,
  );
}
