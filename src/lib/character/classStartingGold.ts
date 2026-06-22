/** Среднее стартовое золото по классу (PHB, таблица «Starting Wealth by Class», без броска). */
export const CLASS_STARTING_GOLD_GP: Record<string, number> = {
  barbarian: 50, // 2d4 × 10, ср. 50
  bard: 125, // 5d4 × 10
  cleric: 125,
  druid: 50, // 2d4 × 10
  fighter: 125,
  monk: 13, // 5d4, ср. 12.5 → 13
  paladin: 125,
  ranger: 125,
  rogue: 100, // 4d4 × 10
  sorcerer: 75, // 3d4 × 10
  warlock: 100,
  wizard: 100,
};

export function getClassStartingGoldGp(classId: string): number {
  return CLASS_STARTING_GOLD_GP[classId] ?? 0;
}
