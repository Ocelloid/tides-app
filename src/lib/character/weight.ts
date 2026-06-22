const POUND_FORMS = ["фунт", "фунта", "фунтов"] as const;

/**
 * Склонение по числу (русский): 1/21/101…, 2–4/22–24…, остальное (0, 5–20, 11–14, 25–30…).
 * Работает для целых n ≥ 0, в том числе до 1000 и выше.
 */
export function pluralizeRu(
  count: number,
  forms: readonly [string, string, string],
): string {
  const n = Math.abs(Math.trunc(count));
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return forms[1];
  }

  return forms[2];
}

function formatWeightNumber(weight: number): string {
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
}

/** Вес в фунтах с правильным склонением (целые и дробные значения). */
export function formatWeightLbRu(weight: number): string {
  const word = Number.isInteger(weight)
    ? pluralizeRu(weight, POUND_FORMS)
    : POUND_FORMS[1];

  return `${formatWeightNumber(weight)} ${word}`;
}
