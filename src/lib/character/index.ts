export type {
  AbilityKey,
  AbilityScoreState,
  AbilityScores,
  CharacterBuild,
  CharacterBuildStep,
  ClassLevelEntry,
  CoinPurse,
  EquipmentChoice,
  FlexibleRacialChoice,
  InventoryItem,
  ScoreGenerationMethod,
  SpellSelection,
  StepValidation,
  WeaponAttack,
} from "./types";

export {
  ABILITY_KEYS,
  CHARACTER_BUILD_STEPS,
  addClassLevel,
  applyBackgroundEquipment,
  canAdvanceToStep,
  emptyCharacterBuild,
  isStepComplete,
  purchaseGearItem,
  purchaseWeapon,
  removePurchasedGear,
  removeClassLevel,
  resetAbilityScores,
  setAttacksSpellcastingNotes,
  setClassLevels,
  setSelectedSpells,
  setWeaponAttacks,
  updateBackground,
  updateBackgroundSkillChoices,
  updateClassLevel,
  updateClassSkillChoices,
  updateEquipmentChoice,
  updateRace,
} from "./characterBuild";

export {
  getPrimaryClassId,
  getTotalLevel,
  migrateCharacterBuild,
  validateClassLevels,
} from "./classLevels";

export { PHB_CORE_CLASS_IDS, isPhbCoreClass } from "./phbCoreClasses";

export type {
  ClassFeatureEntry,
  ClassSpellsByLevel,
  ClassSpellsFile,
  ClassFeaturesFile,
  DndDataMetadata,
  SpellEntry,
  SpellsFile,
} from "./dndTypes";

export {
  getClassFeatures,
  getDndDataMetadata,
  getSpellById,
  getSpellsForClass,
} from "./dndData";

export {
  STANDARD_ARRAY,
  abilityModifier,
  assignStandardArray,
  computeAbilityScoreState,
  getAbilityScoreWarnings,
  getClassRecommendations,
  requiresFlexChoice,
  validateAbilityScoreState,
  validateBaseScoresForMethod,
  validateFlexChoices,
  validateManualBaseScores,
  validateStandardArrayAssignment,
} from "./abilityScores";

export {
  POINT_BUY_BUDGET,
  POINT_BUY_COST,
  POINT_BUY_MAX,
  POINT_BUY_MIN,
  getPointBuyCost,
  getRemainingPoints,
  isValidPointBuyScore,
  validatePointBuy,
} from "./pointBuy";

export {
  assertAllRacesHaveAsi,
  formatRacialAsiText,
  getRacialAsiDefinition,
  racialAsiByRaceId,
} from "./racialBonuses";

export type { RacialAsiDefinition } from "./racialBonuses";

export type { BackgroundEquipmentPack } from "./backgroundEquipment";

export {
  BACKGROUND_EQUIPMENT,
  formatEquipmentForPdf,
  formatInventoryForPdf,
  getBackgroundEquipment,
  resolveBackgroundPack,
} from "./backgroundEquipment";

export {
  EMPTY_PURSE,
  addCost,
  canAffordCost,
  formatCoinsLineForPdf,
  formatCostCp,
  formatPurseGpEquivalent,
  parseGoldFromBackgroundItems,
  purseTotalCp,
  subtractCost,
} from "./coins";

export type { PhbGearCategory, PhbGearItem } from "./phbGearCatalog";
export { PHB_GEAR_CATALOG, getPhbGearItem } from "./phbGearCatalog";

export {
  applyCharacterBuildToChronicle,
  clearNarrativeChronicle,
  formatChronicleForBuild,
  formatClassLabelForBuild,
  rerollNarrativeChronicle,
  syncCharacterBuildToChronicle,
} from "./applyCharacterBuild";

export {
  computeCombatStats,
  estimateArmorClass,
  formatClassLevelForPdf,
  PDF_SKILL_FIELD_IDS,
  SAVING_THROW_PDF_FIELDS,
  SKILL_LABELS_RU,
  formatSkillLabel,
} from "./combatStats";

export type { CombatStats, SkillName } from "./combatStats";

export {
  ALL_SKILLS,
  CLASS_HIT_DIE,
  CLASS_SAVING_THROWS,
  CLASS_SKILL_COUNT,
  CLASS_SKILL_OPTIONS,
  getBackgroundSkillOptions,
  getBackgroundSkillPickCount,
  getClassSkillOptions,
  getClassSkillPickCount,
  getDefaultBackgroundSkillChoices,
  validateBackgroundSkillChoices,
  validateClassSkillChoices,
} from "./skillProficiencies";

export { formatProficienciesAndLanguages } from "./proficienciesAndLanguages";

export { formatClassFeaturesForPdf } from "./classFeaturesFormat";

export type { PhbWeapon } from "./phbWeaponsCatalog";
export { PHB_WEAPONS_CATALOG, getInventoryWeapons, getPhbWeapon, resolveInventoryWeapon } from "./phbWeaponsCatalog";

export type { WeaponProficiency } from "./weaponProficiencies";
export {
  CLASS_WEAPON_PROFICIENCIES,
  computeMonkUnarmedAttack,
  computeWeaponAttack,
  hasWeaponProficiency,
} from "./weaponProficiencies";

export type { SpellcastingInfo, SpellValidationResult } from "./spellcasting";
export {
  MULTICLASS_CASTER_LEVEL,
  MULTICLASS_SPELL_SLOT_TABLE,
  SPELLCASTING_CLASS_IDS,
  buildSpellcastingInfo,
  computeSpellAttackBonus,
  computeSpellSaveDc,
  getCantripsKnown,
  getCombinedCasterLevel,
  getMaxSpellLevelForClass,
  getPrimarySpellcastingClassId,
  getSecondarySpellcastingClassId,
  getSpellSlots,
  getSpellSlotsForClass,
  getSpellcastingAbility,
  getSpellsKnownLimit,
  getSpellsPreparedLimit,
  hasSpellcasting,
  isSpellcastingClass,
  validateSpellSelection,
} from "./spellcasting";
