import { EMPTY_PURSE, parseGoldFromBackgroundItems } from "./coins";
import type { CharacterBuild, CoinPurse, InventoryItem } from "./types";

export type BackgroundEquipmentItem = {
  catalogId: string;
  nameRu: string;
  weightLb: number;
};

export type BackgroundEquipmentPack = {
  items: BackgroundEquipmentItem[];
  goldAlternativeGp?: number;
};

type BackgroundEquipmentItemInput = {
  key: string;
  nameRu: string;
  weightLb?: number;
};

const EMPTY_PACK: BackgroundEquipmentPack = { items: [] };

function bgItem({
  key,
  nameRu,
  weightLb = 0,
}: BackgroundEquipmentItemInput): BackgroundEquipmentItem {
  return {
    catalogId: `bg:${key}`,
    nameRu,
    weightLb,
  };
}

/** PHB 2014 starting equipment (Russian). */
const PHB_EQUIPMENT: Record<string, BackgroundEquipmentPack> = {
  acolyte: {
    items: [
      bgItem({ key: "acolyte-holy-symbol-gift", nameRu: "Священный символ (дар при вступлении в сан)" }),
      bgItem({ key: "acolyte-prayer-book-or-wheel", nameRu: "Молитвенник или молитвенное колесо" }),
      bgItem({ key: "acolyte-incense-5", nameRu: "5 палочек благовоний" }),
      bgItem({ key: "acolyte-robes", nameRu: "Облачение" }),
      bgItem({ key: "acolyte-common-clothes", nameRu: "Комплект простой одежды" }),
      bgItem({ key: "acolyte-wallet-15-gp", nameRu: "Кошелёк с 15 зм" }),
    ],
    goldAlternativeGp: 15,
  },
  charlatan: {
    items: [
      bgItem({ key: "charlatan-fine-clothes", nameRu: "Комплект нарядной одежды" }),
      bgItem({ key: "charlatan-disguise-kit", nameRu: "Набор для маскировки" }),
      bgItem({ key: "charlatan-con-tools-choice", nameRu: "Инструменты жулика на выбор" }),
      bgItem({ key: "charlatan-wallet-15-gp", nameRu: "Кошелёк с 15 зм" }),
    ],
    goldAlternativeGp: 15,
  },
  criminal: {
    items: [
      bgItem({ key: "criminal-crowbar", nameRu: "Ломик" }),
      bgItem({ key: "criminal-dark-common-clothes-hood", nameRu: "Комплект тёмной простой одежды с капюшоном" }),
      bgItem({ key: "criminal-wallet-15-gp", nameRu: "Кошелёк с 15 зм" }),
    ],
    goldAlternativeGp: 15,
  },
  entertainer: {
    items: [
      bgItem({ key: "entertainer-musical-instrument-choice", nameRu: "Музыкальный инструмент на выбор" }),
      bgItem({ key: "entertainer-admirer-gift", nameRu: "Дар поклонника (любовное письмо, локон волос или безделушка)" }),
      bgItem({ key: "entertainer-costume", nameRu: "Костюм" }),
      bgItem({ key: "entertainer-wallet-15-gp", nameRu: "Кошелёк с 15 зм" }),
    ],
    goldAlternativeGp: 15,
  },
  "folk-hero": {
    items: [
      bgItem({ key: "folk-hero-artisan-tools-choice", nameRu: "Набор ремесленных инструментов на выбор" }),
      bgItem({ key: "folk-hero-shovel", nameRu: "Лопата" }),
      bgItem({ key: "folk-hero-iron-pot", nameRu: "Чугунный котёл" }),
      bgItem({ key: "folk-hero-common-clothes", nameRu: "Комплект простой одежды" }),
      bgItem({ key: "folk-hero-wallet-10-gp", nameRu: "Кошелёк с 10 зм" }),
    ],
    goldAlternativeGp: 10,
  },
  "guild-artisan": {
    items: [
      bgItem({ key: "guild-artisan-artisan-tools-choice", nameRu: "Набор ремесленных инструментов на выбор" }),
      bgItem({ key: "guild-artisan-letter-of-introduction", nameRu: "Рекомендательное письмо из гильдии" }),
      bgItem({ key: "guild-artisan-travel-clothes", nameRu: "Комплект дорожной одежды" }),
      bgItem({ key: "guild-artisan-wallet-15-gp", nameRu: "Кошелёк с 15 зм" }),
    ],
    goldAlternativeGp: 15,
  },
  hermit: {
    items: [
      bgItem({ key: "hermit-scroll-case-notes", nameRu: "Футляр для свитков с записями исследований или молитв" }),
      bgItem({ key: "hermit-winter-blanket", nameRu: "Зимнее одеяло" }),
      bgItem({ key: "hermit-common-clothes", nameRu: "Комплект простой одежды" }),
      bgItem({ key: "hermit-herbalism-kit", nameRu: "Набор травника" }),
      bgItem({ key: "hermit-wallet-5-gp", nameRu: "Кошелёк с 5 зм" }),
    ],
    goldAlternativeGp: 5,
  },
  noble: {
    items: [
      bgItem({ key: "noble-fine-clothes", nameRu: "Комплект нарядной одежды" }),
      bgItem({ key: "noble-signet-ring", nameRu: "Печатка" }),
      bgItem({ key: "noble-scroll-pedigree", nameRu: "Свиток родословной" }),
      bgItem({ key: "noble-wallet-25-gp", nameRu: "Кошелёк с 25 зм" }),
    ],
    goldAlternativeGp: 25,
  },
  outlander: {
    items: [
      bgItem({ key: "outlander-staff", nameRu: "Посох" }),
      bgItem({ key: "outlander-hunting-trap", nameRu: "Охотничья силок" }),
      bgItem({ key: "outlander-hunting-trophy", nameRu: "Трофей убитого зверя" }),
      bgItem({ key: "outlander-travel-clothes", nameRu: "Комплект дорожной одежды" }),
      bgItem({ key: "outlander-wallet-10-gp", nameRu: "Кошелёк с 10 зм" }),
    ],
    goldAlternativeGp: 10,
  },
  sage: {
    items: [
      bgItem({ key: "sage-ink-bottle", nameRu: "Бутыль чёрных чернил" }),
      bgItem({ key: "sage-quill", nameRu: "Перо" }),
      bgItem({ key: "sage-small-knife", nameRu: "Небольшой нож" }),
      bgItem({
        key: "sage-dead-colleague-letter",
        nameRu: "Письмо от покойного коллеги с вопросом, на который вы ещё не нашли ответ",
      }),
      bgItem({ key: "sage-common-clothes", nameRu: "Комплект простой одежды" }),
      bgItem({ key: "sage-wallet-10-gp", nameRu: "Кошелёк с 10 зм" }),
    ],
    goldAlternativeGp: 10,
  },
  sailor: {
    items: [
      bgItem({ key: "sailor-belaying-pin-club", nameRu: "Штопор (дубинка)" }),
      bgItem({ key: "sailor-silk-rope-15m", nameRu: "15 м шёлковой верёвки" }),
      bgItem({ key: "sailor-lucky-charm", nameRu: "Талисман удачи (кроличья лапка или камень с отверстием)" }),
      bgItem({ key: "sailor-common-clothes", nameRu: "Комплект простой одежды" }),
      bgItem({ key: "sailor-wallet-10-gp", nameRu: "Кошелёк с 10 зм" }),
    ],
    goldAlternativeGp: 10,
  },
  soldier: {
    items: [
      bgItem({ key: "soldier-insignia-rank", nameRu: "Знак отличия" }),
      bgItem({ key: "soldier-trophy-from-enemy", nameRu: "Трофей поверженного врага (кинжал, сломанный клинок или клочок знамени)" }),
      bgItem({ key: "soldier-bone-dice-or-cards", nameRu: "Костяные кости или колода карт" }),
      bgItem({ key: "soldier-common-clothes", nameRu: "Комплект простой одежды" }),
      bgItem({ key: "soldier-wallet-10-gp", nameRu: "Кошелёк с 10 зм" }),
    ],
    goldAlternativeGp: 10,
  },
  urchin: {
    items: [
      bgItem({ key: "urchin-small-knife", nameRu: "Небольшой нож" }),
      bgItem({ key: "urchin-city-map", nameRu: "Карта города, в котором вы выросли" }),
      bgItem({ key: "urchin-pet-mouse", nameRu: "Ручная мышь" }),
      bgItem({ key: "urchin-parents-memento", nameRu: "Безделушка в память о родителях" }),
      bgItem({ key: "urchin-common-clothes", nameRu: "Комплект простой одежды" }),
      bgItem({ key: "urchin-wallet-10-gp", nameRu: "Кошелёк с 10 зм" }),
    ],
    goldAlternativeGp: 10,
  },
};

function extendPack(
  baseId: string,
  extraItems: BackgroundEquipmentItemInput[],
): BackgroundEquipmentPack {
  const base = PHB_EQUIPMENT[baseId];
  if (!base) {
    return { items: extraItems.map((item) => bgItem(item)) };
  }

  return {
    items: [...base.items, ...extraItems.map((item) => bgItem(item))],
    goldAlternativeGp: base.goldAlternativeGp,
  };
}

/** All 20 background ids from chronicle.ts backgrounds. */
export const BACKGROUND_EQUIPMENT: Record<string, BackgroundEquipmentPack> = {
  ...PHB_EQUIPMENT,
  "luxonborn-acolyte": extendPack("acolyte", [
    { key: "luxonborn-acolyte-luxon-symbol", nameRu: "Символ Люксона" },
  ]),
  "myriad-operative": extendPack("criminal", [
    { key: "myriad-operative-myriad-sign", nameRu: "Знак Мириады" },
  ]),
  grinner: extendPack("entertainer", [
    { key: "grinner-golden-grin-mask", nameRu: "Маска Золотой Ухмылки" },
  ]),
  "cobalt-soul-sage": extendPack("sage", [
    { key: "cobalt-soul-sage-cobalt-seal", nameRu: "Печать Кобальтовой Души" },
  ]),
  "revelry-pirate": extendPack("sailor", [
    { key: "revelry-pirate-tattoo", nameRu: "Татуировка Разгулья" },
  ]),
  "augen-trust-spy": extendPack("criminal", [
    { key: "augen-trust-spy-codebook", nameRu: "Шифровальная книга Trust" },
  ]),
  "volstrucker-agent": extendPack("criminal", [
    { key: "volstrucker-agent-brand", nameRu: "Клеймо Волштрукера" },
  ]),
};

const backgroundCatalogById = new Map<string, BackgroundEquipmentItem>();
for (const pack of Object.values(BACKGROUND_EQUIPMENT)) {
  for (const item of pack.items) {
    const existing = backgroundCatalogById.get(item.catalogId);
    if (existing) {
      if (
        existing.nameRu !== item.nameRu ||
        existing.weightLb !== item.weightLb
      ) {
        throw new Error(
          `[backgroundEquipment] Conflicting background item key: ${item.catalogId}`,
        );
      }
      continue;
    }
    backgroundCatalogById.set(item.catalogId, item);
  }
}

export function getBackgroundEquipmentCatalogItem(
  catalogId: string,
): BackgroundEquipmentItem | undefined {
  return backgroundCatalogById.get(catalogId);
}

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

  const goldGp = parseGoldFromBackgroundItems(pack.items.map((item) => item.nameRu));
  const inventory: InventoryItem[] = [];

  for (const item of pack.items) {
    if (isWalletLine(item.nameRu)) {
      continue;
    }

    inventory.push({
      catalogId: item.catalogId,
      nameRu: item.nameRu,
      quantity: 1,
      weightLb: item.weightLb,
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
