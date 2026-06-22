import type { CharacterBuildStep } from "~/lib/character";

export const STEP_LABELS: Record<CharacterBuildStep, string> = {
  class: "Класс",
  race: "Раса",
  background: "Происхождение",
  abilities: "Характеристики",
  equipment: "Снаряжение",
  "weapons-magic": "Оружие и магия",
  review: "Обзор",
};

export const STEP_DESCRIPTIONS: Record<CharacterBuildStep, string> = {
  class: "Выберите класс персонажа.",
  race: "Выберите расу или подрасу персонажа.",
  background: "Выберите предысторию — происхождение персонажа.",
  abilities: "Распределите характеристики: point buy, standard array или вручную.",
  equipment: "Выберите стартовое снаряжение или золото от предыстории.",
  "weapons-magic":
    "Выберите до трёх основных атак и заклинания для заклинательных классов.",
  review: "Проверьте выборы перед созданием персонажа.",
};

/** Re-export for WeaponMagicStep heading consistency. */
export const WEAPONS_MAGIC_LABEL = STEP_LABELS["weapons-magic"];
export const WEAPONS_MAGIC_DESCRIPTION = STEP_DESCRIPTIONS["weapons-magic"];
