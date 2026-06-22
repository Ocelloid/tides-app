import type { SkillName } from "./skillProficiencies";

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export type ScoreGenerationMethod = "point-buy" | "standard-array" | "manual";

export type AbilityScores = Record<AbilityKey, number>;

export type FlexibleRacialChoice = {
  /** Fixed racial bonuses (e.g. half-elf +2 CHA). */
  fixed: Partial<AbilityScores>;
  /** Selected +1 bonuses — keys must be unique. */
  flexPlusOne: AbilityKey[];
};

export type AbilityScoreState = {
  method: ScoreGenerationMethod;
  base: AbilityScores;
  racialBonus: AbilityScores;
  flexChoices: FlexibleRacialChoice | null;
  total: AbilityScores;
  modifier: Record<AbilityKey, number>;
};

export type EquipmentChoice = "equipment" | "gold";

export type CoinPurse = {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
};

export type InventoryItem = {
  catalogId: string | null;
  nameRu: string;
  quantity: number;
  weightLb: number;
  source: "background" | "class" | "shop" | "weapon-step";
};

export type ClassLevelEntry = {
  classId: string;
  level: number;
};

export type WeaponAttack = {
  weaponId?: string;
  name: string;
  attackBonus: number;
  damage: string;
};

export type SpellSelection = {
  spellId: string;
  classId: string;
  prepared: boolean;
};

export type CharacterBuild = {
  classLevels: ClassLevelEntry[];
  raceId: string | null;
  backgroundId: string | null;
  /** Flex +1 choices for half-elf and similar races; null until chosen. */
  flexRacialChoices: AbilityKey[] | null;
  abilityScores: AbilityScoreState | null;
  equipmentChoice: EquipmentChoice | null;
  inventory: InventoryItem[];
  coins: CoinPurse;
  purchasedGearIds: string[];
  /** Two skills from background (player picks from pool). */
  backgroundSkillChoices: SkillName[];
  /** Class skill proficiencies (count depends on class). */
  classSkillChoices: SkillName[];
  /** Up to 3 rows on PDF page 1; extras go to AttacksSpellcasting notes (Task 11). */
  weaponAttacks: WeaponAttack[];
  /** Known/prepared spells tagged with caster classId. */
  selectedSpells: SpellSelection[];
  /** Overflow notes for PDF AttacksSpellcasting_XFCE (spell descriptions, extra attacks). */
  attacksSpellcastingNotes: string;
  wizardCompleted: boolean;
};

export type CharacterBuildStep =
  | "class"
  | "race"
  | "background"
  | "abilities"
  | "equipment"
  | "weapons-magic"
  | "review";

export type StepValidation = {
  valid: boolean;
  message?: string;
};
