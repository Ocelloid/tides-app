import { EMPTY_PURSE, parseGoldFromBackgroundItems } from "./coins";
import type { CharacterBuild, CoinPurse, InventoryItem } from "./types";

export type BackgroundEquipmentPack = {
  items: string[];
  goldAlternativeGp?: number;
};

const EMPTY_PACK: BackgroundEquipmentPack = { items: [] };

/** PHB 2014 starting equipment (Russian). */
const PHB_EQUIPMENT: Record<string, BackgroundEquipmentPack> = {
  acolyte: {
    items: [
      "Священный символ (дар при вступлении в сан)",
      "Молитвенник или молитвенное колесо",
      "5 палочек благовоний",
      "Облачение",
      "Комплект простой одежды",
      "Кошелёк с 15 зм",
    ],
    goldAlternativeGp: 15,
  },
  charlatan: {
    items: [
      "Комплект нарядной одежды",
      "Набор для маскировки",
      "Инструменты жулика на выбор",
      "Кошелёк с 15 зм",
    ],
    goldAlternativeGp: 15,
  },
  criminal: {
    items: [
      "Ломик",
      "Комплект тёмной простой одежды с капюшоном",
      "Кошелёк с 15 зм",
    ],
    goldAlternativeGp: 15,
  },
  entertainer: {
    items: [
      "Музыкальный инструмент на выбор",
      "Дар поклонника (любовное письмо, локон волос или безделушка)",
      "Костюм",
      "Кошелёк с 15 зм",
    ],
    goldAlternativeGp: 15,
  },
  "folk-hero": {
    items: [
      "Набор ремесленных инструментов на выбор",
      "Лопата",
      "Чугунный котёл",
      "Комплект простой одежды",
      "Кошелёк с 10 зм",
    ],
    goldAlternativeGp: 10,
  },
  "guild-artisan": {
    items: [
      "Набор ремесленных инструментов на выбор",
      "Рекомендательное письмо из гильдии",
      "Комплект дорожной одежды",
      "Кошелёк с 15 зм",
    ],
    goldAlternativeGp: 15,
  },
  hermit: {
    items: [
      "Футляр для свитков с записями исследований или молитв",
      "Зимнее одеяло",
      "Комплект простой одежды",
      "Набор травника",
      "Кошелёк с 5 зм",
    ],
    goldAlternativeGp: 5,
  },
  noble: {
    items: [
      "Комплект нарядной одежды",
      "Печатка",
      "Свиток родословной",
      "Кошелёк с 25 зм",
    ],
    goldAlternativeGp: 25,
  },
  outlander: {
    items: [
      "Посох",
      "Охотничья силок",
      "Трофей убитого зверя",
      "Комплект дорожной одежды",
      "Кошелёк с 10 зм",
    ],
    goldAlternativeGp: 10,
  },
  sage: {
    items: [
      "Бутыль чёрных чернил",
      "Перо",
      "Небольшой нож",
      "Письмо от покойного коллеги с вопросом, на который вы ещё не нашли ответ",
      "Комплект простой одежды",
      "Кошелёк с 10 зм",
    ],
    goldAlternativeGp: 10,
  },
  sailor: {
    items: [
      "Штопор (дубинка)",
      "15 м шёлковой верёвки",
      "Талисман удачи (кроличья лапка или камень с отверстием)",
      "Комплект простой одежды",
      "Кошелёк с 10 зм",
    ],
    goldAlternativeGp: 10,
  },
  soldier: {
    items: [
      "Знак отличия",
      "Трофей поверженного врага (кинжал, сломанный клинок или клочок знамени)",
      "Костяные кости или колода карт",
      "Комплект простой одежды",
      "Кошелёк с 10 зм",
    ],
    goldAlternativeGp: 10,
  },
  urchin: {
    items: [
      "Небольшой нож",
      "Карта города, в котором вы выросли",
      "Ручная мышь",
      "Безделушка в память о родителях",
      "Комплект простой одежды",
      "Кошелёк с 10 зм",
    ],
    goldAlternativeGp: 10,
  },
};

function extendPack(
  baseId: string,
  extraItems: string[],
): BackgroundEquipmentPack {
  const base = PHB_EQUIPMENT[baseId];
  if (!base) {
    return { items: [...extraItems] };
  }

  return {
    items: [...base.items, ...extraItems],
    goldAlternativeGp: base.goldAlternativeGp,
  };
}

/** All 20 background ids from chronicle.ts backgrounds. */
export const BACKGROUND_EQUIPMENT: Record<string, BackgroundEquipmentPack> = {
  ...PHB_EQUIPMENT,
  "luxonborn-acolyte": extendPack("acolyte", ["Символ Люксона"]),
  "myriad-operative": extendPack("criminal", ["Знак Мириады"]),
  grinner: extendPack("entertainer", ["Маска Золотой Ухмылки"]),
  "cobalt-soul-sage": extendPack("sage", ["Печать Кобальтовой Души"]),
  "revelry-pirate": extendPack("sailor", ["Татуировка Разгулья"]),
  "augen-trust-spy": extendPack("criminal", ["Шифровальная книга Trust"]),
  "volstrucker-agent": extendPack("criminal", ["Клеймо Волштрукера"]),
};

export function getBackgroundEquipment(
  backgroundId: string,
): BackgroundEquipmentPack {
  const pack = BACKGROUND_EQUIPMENT[backgroundId];
  if (!pack) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[backgroundEquipment] Unknown background id: ${backgroundId}`,
      );
    }
    return EMPTY_PACK;
  }

  return pack;
}

const WALLET_LINE_REGEX = /кошел/i;

function isWalletLine(itemName: string): boolean {
  return WALLET_LINE_REGEX.test(itemName);
}

export function resolveBackgroundPack(build: CharacterBuild): {
  inventory: InventoryItem[];
  coins: CoinPurse;
} {
  if (!build.backgroundId || !build.equipmentChoice) {
    return { inventory: [], coins: { ...EMPTY_PURSE } };
  }

  const pack = getBackgroundEquipment(build.backgroundId);

  if (build.equipmentChoice === "gold") {
    return {
      inventory: [],
      coins: { ...EMPTY_PURSE, gp: pack.goldAlternativeGp ?? 0 },
    };
  }

  const goldGp = parseGoldFromBackgroundItems(pack.items);
  const inventory: InventoryItem[] = [];

  for (const itemName of pack.items) {
    if (isWalletLine(itemName)) {
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

  return {
    inventory,
    coins: { ...EMPTY_PURSE, gp: goldGp },
  };
}

export function formatEquipmentForPdf(inventory: InventoryItem[]): string {
  return inventory
    .map((item) =>
      item.quantity > 1 ? `${item.nameRu} (×${item.quantity})` : item.nameRu,
    )
    .join("\n");
}

/** Alias for PDF inventory text (no wallet lines, no duplicate GP). */
export const formatInventoryForPdf = formatEquipmentForPdf;
