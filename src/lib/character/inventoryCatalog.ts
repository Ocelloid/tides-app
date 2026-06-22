import {
  getBackgroundEquipmentCatalogItem,
  type BackgroundEquipmentItem,
} from "./backgroundEquipment";
import {
  getClassEquipmentCatalogItem,
} from "./classEquipment";
import { getPhbGearItem } from "./phbGearCatalog";
import { getPhbWeapon } from "./phbWeaponsCatalog";
import type { InventoryItem } from "./types";

type InventoryResolveSource = InventoryItem["source"];

type InventoryItemRef = {
  id: string;
  quantity: number;
  source: InventoryResolveSource;
};

export function resolveInventoryItem(ref: InventoryItemRef): InventoryItem {
  const { id, quantity, source } = ref;

  const gear = getPhbGearItem(id);
  if (gear) {
    return {
      catalogId: gear.id,
      nameRu: gear.nameRu,
      quantity,
      weightLb: gear.weightLb,
      source,
    };
  }

  const weapon = getPhbWeapon(id);
  if (weapon) {
    return {
      catalogId: weapon.id,
      nameRu: weapon.nameRu,
      quantity,
      weightLb: weapon.weightLb,
      source,
    };
  }

  const backgroundItem = getBackgroundEquipmentCatalogItem(id);
  if (backgroundItem) {
    return inventoryFromCatalogItem(backgroundItem, quantity, source);
  }

  const classItem = getClassEquipmentCatalogItem(id);
  if (classItem) {
    return {
      catalogId: classItem.catalogId,
      nameRu: classItem.nameRu,
      quantity,
      weightLb: classItem.weightLb,
      source,
    };
  }

  if (process.env.NODE_ENV === "development") {
    console.warn(`[inventoryCatalog] Unknown item id: ${id}`);
  }

  return {
    catalogId: id,
    nameRu: id,
    quantity,
    weightLb: 0,
    source,
  };
}

function inventoryFromCatalogItem(
  item: BackgroundEquipmentItem,
  quantity: number,
  source: InventoryResolveSource,
): InventoryItem {
  return {
    catalogId: item.catalogId,
    nameRu: item.nameRu,
    quantity,
    weightLb: item.weightLb,
    source,
  };
}
