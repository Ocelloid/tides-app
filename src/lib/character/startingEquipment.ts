import {
  getBackgroundEquipment,
  resolveBackgroundPack,
} from "./backgroundEquipment";
import { resolveClassPack } from "./classEquipment";
import { getPrimaryClassId } from "./classLevels";
import { getClassStartingGoldGp } from "./classStartingGold";
import { EMPTY_PURSE } from "./coins";
import type { CharacterBuild, CoinPurse, InventoryItem } from "./types";

export function getStartingGoldAlternativeTotalGp(build: CharacterBuild): number {
  if (!build.backgroundId) {
    return 0;
  }

  const pack = getBackgroundEquipment(build.backgroundId);
  const backgroundGold = pack.goldAlternativeGp ?? 0;
  const classId = getPrimaryClassId(build);
  const classGold = classId ? getClassStartingGoldGp(classId) : 0;

  return backgroundGold + classGold;
}

export function resolveStartingEquipment(build: CharacterBuild): {
  inventory: InventoryItem[];
  coins: CoinPurse;
} {
  if (!build.equipmentChoice || !build.backgroundId) {
    return { inventory: [], coins: { ...EMPTY_PURSE } };
  }

  if (build.equipmentChoice === "gold") {
    return {
      inventory: [],
      coins: {
        ...EMPTY_PURSE,
        gp: getStartingGoldAlternativeTotalGp(build),
      },
    };
  }

  const background = resolveBackgroundPack({
    ...build,
    equipmentChoice: "equipment",
  });

  const classId = getPrimaryClassId(build);
  const classItems = classId ? resolveClassPack(classId) : [];

  return {
    inventory: [...classItems, ...background.inventory],
    coins: background.coins,
  };
}
