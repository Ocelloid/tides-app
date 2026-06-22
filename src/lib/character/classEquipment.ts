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

function textItem(nameRu: string, weightLb = 0, quantity = 1): InventoryItem {
  return {
    catalogId: null,
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
    textItem("Набор путешественника", 21),
    weaponItem("javelin", 4),
  ],
  bard: [
    weaponItem("rapier"),
    textItem("Набор дипломата", 39),
    textItem("Кожаный доспех", 10),
    weaponItem("dagger"),
  ],
  cleric: [
    weaponItem("mace"),
    textItem("Чешуйчатый доспех", 45),
    weaponItem("light-crossbow"),
    textItem("20 болтов", 1.5),
    textItem("Набор священника", 24),
    textItem("Щит", 6),
    gearItem("holy-symbol"),
  ],
  druid: [
    textItem("Деревянный щит", 6),
    weaponItem("scimitar"),
    textItem("Кожаный доспех", 10),
    textItem("Набор путешественника", 21),
    gearItem("druidic-focus"),
  ],
  fighter: [
    textItem("Кольчуга", 55),
    weaponItem("longsword"),
    textItem("Щит", 6),
    weaponItem("light-crossbow"),
    textItem("20 болтов", 1.5),
    textItem("Набор исследователя подземелий", 21.5),
  ],
  monk: [
    weaponItem("shortsword"),
    textItem("Набор исследователя подземелий", 21.5),
    weaponItem("dart", 10),
  ],
  paladin: [
    weaponItem("longsword"),
    textItem("Щит", 6),
    weaponItem("javelin", 5),
    textItem("Набор священника", 24),
    textItem("Кольчуга", 55),
    gearItem("holy-symbol"),
  ],
  ranger: [
    textItem("Чешуйчатый доспех", 45),
    weaponItem("shortsword"),
    textItem("Набор исследователя подземелий", 21.5),
    weaponItem("longbow"),
    textItem("20 стрел", 1),
  ],
  rogue: [
    weaponItem("rapier"),
    weaponItem("shortbow"),
    textItem("20 стрел", 1),
    textItem("Набор вора", 16),
    textItem("Кожаный доспех", 10),
    weaponItem("dagger", 2),
    textItem("Инструменты вора", 1),
  ],
  sorcerer: [
    weaponItem("light-crossbow"),
    textItem("20 болтов", 1.5),
    weaponItem("dagger", 2),
    textItem("Мешочек с реагентами", 0),
    textItem("Набор исследователя подземелий", 21.5),
  ],
  warlock: [
    weaponItem("light-crossbow"),
    textItem("20 болтов", 1.5),
    textItem("Мешочек с реагентами", 0),
    textItem("Набор учёного", 22),
  ],
  wizard: [
    weaponItem("quarterstaff"),
    textItem("Мешочек с реагентами", 0),
    textItem("Набор учёного", 22),
  ],
};

export function resolveClassPack(classId: string): InventoryItem[] {
  return CLASS_STARTING_ITEMS[classId]?.map((item) => ({ ...item })) ?? [];
}

export function getClassStartingItemLabels(classId: string): string[] {
  return resolveClassPack(classId).map((item) =>
    item.quantity > 1 ? `${item.nameRu} (×${item.quantity})` : item.nameRu,
  );
}
