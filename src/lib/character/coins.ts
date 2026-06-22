import { pluralizeRu } from "./weight";

export type CoinPurse = {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
};

export const EMPTY_PURSE: CoinPurse = {
  cp: 0,
  sp: 0,
  ep: 0,
  gp: 0,
  pp: 0,
};

const GOLD_FORMS = ["золото", "золота", "золота"] as const;
const SILVER_FORMS = ["серебро", "серебра", "серебра"] as const;
const COPPER_FORMS = ["медь", "меди", "меди"] as const;

const WALLET_GOLD_REGEX = /(\d+)\s+зм/i;

/** Сумма кошелька в медных монетах (1 sp = 10 cp, 1 ep = 50 cp, 1 gp = 100 cp, 1 pp = 1000 cp). */
export function purseTotalCp(purse: CoinPurse): number {
  return (
    purse.cp +
    purse.sp * 10 +
    purse.ep * 50 +
    purse.gp * 100 +
    purse.pp * 1000
  );
}

/** Парсит «Кошелёк с N зм» и аналогичные строки из пакета предыстории. */
export function parseGoldFromBackgroundItems(items: string[]): number {
  for (const item of items) {
    if (!/кошел/i.test(item)) {
      continue;
    }

    const match = WALLET_GOLD_REGEX.exec(item);
    if (match) {
      return Number.parseInt(match[1]!, 10);
    }
  }

  return 0;
}

function cpToPurse(totalCp: number): CoinPurse {
  let remaining = totalCp;

  const pp = Math.floor(remaining / 1000);
  remaining %= 1000;

  const gp = Math.floor(remaining / 100);
  remaining %= 100;

  const ep = Math.floor(remaining / 50);
  remaining %= 50;

  const sp = Math.floor(remaining / 10);
  remaining %= 10;

  return { cp: remaining, sp, ep, gp, pp };
}

/** Сводит кошелёк к золоту, серебру и меди (электрум и платина включаются в сумму). */
export function compactPurseToGsp(
  purse: CoinPurse,
): Pick<CoinPurse, "cp" | "gp" | "sp"> {
  const totalCp = purseTotalCp(purse);
  const gp = Math.floor(totalCp / 100);
  const remainder = totalCp % 100;
  const sp = Math.floor(remainder / 10);

  return { gp, sp, cp: remainder % 10 };
}

/** «14 золота, 9 серебра, 9 меди» — только ненулевые номиналы. */
export function formatPurseBreakdownRu(purse: CoinPurse): string {
  const { gp, sp, cp } = compactPurseToGsp(purse);
  const parts: string[] = [];

  if (gp > 0) {
    parts.push(`${gp} ${pluralizeRu(gp, GOLD_FORMS)}`);
  }
  if (sp > 0) {
    parts.push(`${sp} ${pluralizeRu(sp, SILVER_FORMS)}`);
  }
  if (cp > 0) {
    parts.push(`${cp} ${pluralizeRu(cp, COPPER_FORMS)}`);
  }

  if (parts.length === 0) {
    return `0 ${pluralizeRu(0, COPPER_FORMS)}`;
  }

  return parts.join(", ");
}

/** Возвращает эквивалент кошелька в золотых (для отображения). */
export function formatPurseGpEquivalent(purse: CoinPurse): string {
  const totalGp = purseTotalCp(purse) / 100;
  return Number.isInteger(totalGp) ? String(totalGp) : totalGp.toFixed(2);
}

/** Форматирует цену в медных монетах для UI магазина. */
export function formatCostCp(costCp: number): string {
  if (costCp >= 1000 && costCp % 1000 === 0) {
    return `${costCp / 1000} пм`;
  }

  if (costCp >= 100 && costCp % 100 === 0) {
    return `${costCp / 100} зм`;
  }

  if (costCp >= 50 && costCp % 50 === 0) {
    return `${costCp / 50} эм`;
  }

  if (costCp >= 10 && costCp % 10 === 0) {
    return `${costCp / 10} см`;
  }

  return `${costCp} мм`;
}

/** Возвращает true, если в кошельке достаточно монет для покупки. */
export function canAffordCost(purse: CoinPurse, costCp: number): boolean {
  return purseTotalCp(purse) >= costCp;
}

/** Возвращает кошелёк с добавленной суммой (возврат при продаже). */
export function addCost(purse: CoinPurse, costCp: number): CoinPurse {
  if (costCp <= 0) {
    return purse;
  }

  return cpToPurse(purseTotalCp(purse) + costCp);
}

/** Списывает стоимость; возвращает null, если монет недостаточно. */
export function subtractCost(
  purse: CoinPurse,
  costCp: number,
): CoinPurse | null {
  if (costCp < 0) {
    return null;
  }

  const total = purseTotalCp(purse);
  if (total < costCp) {
    return null;
  }

  return cpToPurse(total - costCp);
}

/** Одна строка для блока снаряжения на PDF-листе. */
export function formatCoinsLineForPdf(purse: CoinPurse): string {
  const parts: string[] = [];

  if (purse.pp > 0) {
    parts.push(`${purse.pp} пм`);
  }
  if (purse.gp > 0) {
    parts.push(`${purse.gp} зм`);
  }
  if (purse.ep > 0) {
    parts.push(`${purse.ep} эм`);
  }
  if (purse.sp > 0) {
    parts.push(`${purse.sp} см`);
  }
  if (purse.cp > 0) {
    parts.push(`${purse.cp} мм`);
  }

  if (parts.length === 0) {
    return "";
  }

  return `Монеты: ${parts.join(", ")}`;
}
