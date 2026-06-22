import { getPrimaryClassId, validateClassLevels } from "./classLevels";
import { validateSpellSelection } from "./spellcasting";
import { resolveStartingEquipment } from "./startingEquipment";
import { addCost, EMPTY_PURSE, subtractCost } from "./coins";
import { getPhbGearItem } from "./phbGearCatalog";
import { getPhbWeapon } from "./phbWeaponsCatalog";
import {
  getDefaultBackgroundSkillChoices,
  validateBackgroundSkillChoices,
  validateClassSkillChoices,
  type SkillName,
} from "./skillProficiencies";
import type {
  CharacterBuild,
  CharacterBuildStep,
  ClassLevelEntry,
  EquipmentChoice,
  SpellSelection,
  StepValidation,
  WeaponAttack,
} from "./types";
import {
  ABILITY_KEYS,
  validateAbilityScoreState,
  validateFlexChoices,
} from "./abilityScores";

export { ABILITY_KEYS };

export const CHARACTER_BUILD_STEPS: readonly CharacterBuildStep[] = [
  "class",
  "race",
  "background",
  "abilities",
  "equipment",
  "weapons-magic",
  "review",
];

export function emptyCharacterBuild(): CharacterBuild {
  return {
    classLevels: [],
    raceId: null,
    backgroundId: null,
    flexRacialChoices: null,
    abilityScores: null,
    equipmentChoice: null,
    inventory: [],
    coins: { ...EMPTY_PURSE },
    purchasedGearIds: [],
    backgroundSkillChoices: [],
    classSkillChoices: [],
    weaponAttacks: [],
    selectedSpells: [],
    attacksSpellcastingNotes: "",
    wizardCompleted: false,
  };
}

export function resetAbilityScores(build: CharacterBuild): CharacterBuild {
  return {
    ...build,
    abilityScores: null,
    flexRacialChoices: null,
  };
}

function classIdsChanged(
  before: ClassLevelEntry[],
  after: ClassLevelEntry[],
): boolean {
  const beforeIds = before.map((entry) => entry.classId).sort();
  const afterIds = after.map((entry) => entry.classId).sort();

  if (beforeIds.length !== afterIds.length) {
    return true;
  }

  return beforeIds.some((classId, index) => classId !== afterIds[index]);
}

export function setClassLevels(
  build: CharacterBuild,
  entries: ClassLevelEntry[],
): CharacterBuild {
  const resetSkills = classIdsChanged(build.classLevels, entries);

  let next: CharacterBuild = {
    ...build,
    classLevels: entries,
    classSkillChoices: resetSkills ? [] : build.classSkillChoices,
  };

  if (classIdsChanged(build.classLevels, entries) && build.equipmentChoice) {
    next = applyStartingEquipment(next);
  }

  return next;
}

export function addClassLevel(
  build: CharacterBuild,
  classId: string,
): CharacterBuild {
  if (build.classLevels.some((entry) => entry.classId === classId)) {
    return build;
  }

  return setClassLevels(build, [...build.classLevels, { classId, level: 1 }]);
}

export function updateClassLevel(
  build: CharacterBuild,
  classId: string,
  level: number,
): CharacterBuild {
  const index = build.classLevels.findIndex((entry) => entry.classId === classId);
  if (index === -1) {
    return build;
  }

  const next = [...build.classLevels];
  next[index] = { classId, level };

  return {
    ...build,
    classLevels: next,
  };
}

export function removeClassLevel(
  build: CharacterBuild,
  classId: string,
): CharacterBuild {
  return setClassLevels(
    build,
    build.classLevels.filter((entry) => entry.classId !== classId),
  );
}

export function updateRace(
  build: CharacterBuild,
  raceId: string,
): CharacterBuild {
  return resetAbilityScores({
    ...build,
    raceId,
  });
}

export function updateBackground(
  build: CharacterBuild,
  backgroundId: string,
): CharacterBuild {
  return {
    ...build,
    backgroundId,
    backgroundSkillChoices: getDefaultBackgroundSkillChoices(backgroundId),
    classSkillChoices: [],
    equipmentChoice: null,
    inventory: [],
    coins: { ...EMPTY_PURSE },
    purchasedGearIds: [],
  };
}

export function updateBackgroundSkillChoices(
  build: CharacterBuild,
  skills: SkillName[],
): CharacterBuild {
  return {
    ...build,
    backgroundSkillChoices: skills,
    classSkillChoices: build.classSkillChoices.filter(
      (skill) => !skills.includes(skill),
    ),
  };
}

export function updateClassSkillChoices(
  build: CharacterBuild,
  skills: SkillName[],
): CharacterBuild {
  return {
    ...build,
    classSkillChoices: skills,
  };
}

export function applyStartingEquipment(
  build: CharacterBuild,
): CharacterBuild {
  const resolved = resolveStartingEquipment(build);

  return {
    ...build,
    inventory: resolved.inventory,
    coins: resolved.coins,
    purchasedGearIds: [],
  };
}

/** @deprecated Используйте applyStartingEquipment */
export function applyBackgroundEquipment(
  build: CharacterBuild,
): CharacterBuild {
  return applyStartingEquipment(build);
}

export function updateEquipmentChoice(
  build: CharacterBuild,
  equipmentChoice: EquipmentChoice,
): CharacterBuild {
  return applyStartingEquipment({
    ...build,
    equipmentChoice,
  });
}

export function purchaseGearItem(
  build: CharacterBuild,
  catalogId: string,
): CharacterBuild {
  const gear = getPhbGearItem(catalogId);
  if (!gear || !build.equipmentChoice) {
    return build;
  }

  const nextCoins = subtractCost(build.coins, gear.costCp);
  if (!nextCoins) {
    return build;
  }

  const existingIndex = build.inventory.findIndex(
    (item) => item.catalogId === catalogId && item.source === "shop",
  );

  let inventory;
  if (existingIndex >= 0) {
    inventory = [...build.inventory];
    const existing = inventory[existingIndex]!;
    inventory[existingIndex] = {
      ...existing,
      quantity: existing.quantity + 1,
    };
  } else {
    inventory = [
      ...build.inventory,
      {
        catalogId,
        nameRu: gear.nameRu,
        quantity: 1,
        weightLb: gear.weightLb,
        source: "shop" as const,
      },
    ];
  }

  const purchasedGearIds = build.purchasedGearIds.includes(catalogId)
    ? build.purchasedGearIds
    : [...build.purchasedGearIds, catalogId];

  return {
    ...build,
    coins: nextCoins,
    inventory,
    purchasedGearIds,
  };
}

export function setWeaponAttacks(
  build: CharacterBuild,
  weaponAttacks: WeaponAttack[],
): CharacterBuild {
  return {
    ...build,
    weaponAttacks: weaponAttacks.slice(0, 3),
  };
}

export function setSelectedSpells(
  build: CharacterBuild,
  selectedSpells: SpellSelection[],
): CharacterBuild {
  return {
    ...build,
    selectedSpells,
  };
}

export function setAttacksSpellcastingNotes(
  build: CharacterBuild,
  notes: string,
): CharacterBuild {
  return {
    ...build,
    attacksSpellcastingNotes: notes,
  };
}

export function purchaseWeapon(
  build: CharacterBuild,
  catalogId: string,
): CharacterBuild {
  const weapon = getPhbWeapon(catalogId);
  if (!weapon || !build.equipmentChoice) {
    return build;
  }

  const nextCoins = subtractCost(build.coins, weapon.costCp);
  if (!nextCoins) {
    return build;
  }

  const existingIndex = build.inventory.findIndex(
    (item) => item.catalogId === catalogId && item.source === "weapon-step",
  );

  let inventory;
  if (existingIndex >= 0) {
    inventory = [...build.inventory];
    const existing = inventory[existingIndex]!;
    inventory[existingIndex] = {
      ...existing,
      quantity: existing.quantity + 1,
    };
  } else {
    inventory = [
      ...build.inventory,
      {
        catalogId,
        nameRu: weapon.nameRu,
        quantity: 1,
        weightLb: weapon.weightLb,
        source: "weapon-step" as const,
      },
    ];
  }

  return {
    ...build,
    coins: nextCoins,
    inventory,
  };
}

export function removePurchasedGear(
  build: CharacterBuild,
  catalogId: string,
): CharacterBuild {
  const gear = getPhbGearItem(catalogId);
  if (!gear) {
    return build;
  }

  const existingIndex = build.inventory.findIndex(
    (item) => item.catalogId === catalogId && item.source === "shop",
  );
  if (existingIndex === -1) {
    return build;
  }

  const existing = build.inventory[existingIndex]!;
  let inventory;
  let purchasedGearIds = build.purchasedGearIds;

  if (existing.quantity <= 1) {
    inventory = build.inventory.filter((_, index) => index !== existingIndex);
    purchasedGearIds = purchasedGearIds.filter((id) => id !== catalogId);
  } else {
    inventory = [...build.inventory];
    inventory[existingIndex] = {
      ...existing,
      quantity: existing.quantity - 1,
    };
  }

  return {
    ...build,
    inventory,
    coins: addCost(build.coins, gear.costCp),
    purchasedGearIds,
  };
}

export function isStepComplete(
  build: CharacterBuild,
  step: CharacterBuildStep,
): boolean {
  return validateStep(build, step).valid;
}

export function canAdvanceToStep(
  build: CharacterBuild,
  step: CharacterBuildStep,
): boolean {
  const targetIndex = CHARACTER_BUILD_STEPS.indexOf(step);
  if (targetIndex === -1) {
    return false;
  }

  for (let index = 0; index < targetIndex; index += 1) {
    const previousStep = CHARACTER_BUILD_STEPS[index];
    if (!previousStep || !isStepComplete(build, previousStep)) {
      return false;
    }
  }

  return true;
}

function validateStep(
  build: CharacterBuild,
  step: CharacterBuildStep,
): StepValidation {
  switch (step) {
    case "class":
      return validateClassStep(build);
    case "race":
      return validateRaceStep(build);
    case "background":
      return validateBackgroundStep(build);
    case "abilities":
      return validateAbilitiesStep(build);
    case "equipment":
      return validateEquipmentStep(build);
    case "weapons-magic":
      return validateWeaponsMagicStep(build);
    case "review":
      return validateReviewStep(build);
    default:
      return { valid: false, message: "Неизвестный шаг wizard." };
  }
}

function validateClassStep(build: CharacterBuild): StepValidation {
  return validateClassLevels(build.classLevels);
}

function validateRaceStep(build: CharacterBuild): StepValidation {
  if (!build.raceId) {
    return { valid: false, message: "Выберите расу персонажа." };
  }

  return { valid: true };
}

function validateBackgroundStep(build: CharacterBuild): StepValidation {
  if (!build.backgroundId) {
    return { valid: false, message: "Выберите предысторию персонажа." };
  }

  return validateBackgroundSkillChoices(
    build.backgroundId,
    build.backgroundSkillChoices,
  );
}

function validateAbilitiesStep(build: CharacterBuild): StepValidation {
  if (!build.raceId) {
    return { valid: false, message: "Сначала выберите расу." };
  }

  const flexValidation = validateFlexChoices(
    build.raceId,
    build.flexRacialChoices,
  );
  if (!flexValidation.valid) {
    return flexValidation;
  }

  return validateAbilityScoreState(build.abilityScores).valid
    ? validateClassSkillChoices(
        getPrimaryClassId(build),
        build.backgroundSkillChoices,
        build.classSkillChoices,
      )
    : validateAbilityScoreState(build.abilityScores);
}

function validateEquipmentStep(build: CharacterBuild): StepValidation {
  if (!build.backgroundId) {
    return { valid: false, message: "Сначала выберите предысторию." };
  }

  if (!build.equipmentChoice) {
    return { valid: false, message: "Выберите снаряжение или золото." };
  }

  if (build.equipmentChoice === "equipment") {
    if (!getPrimaryClassId(build)) {
      return { valid: false, message: "Выберите класс персонажа." };
    }

    if (build.inventory.length === 0) {
      return { valid: false, message: "Выберите стартовое снаряжение." };
    }
  }

  if (build.equipmentChoice === "gold" && build.coins.gp <= 0) {
    return { valid: false, message: "Укажите стартовое золото." };
  }

  return { valid: true };
}

function validateWeaponsMagicStep(build: CharacterBuild): StepValidation {
  return validateSpellSelection(build);
}

function validateReviewStep(build: CharacterBuild): StepValidation {
  for (const step of CHARACTER_BUILD_STEPS) {
    if (step === "review") {
      continue;
    }

    const validation = validateStep(build, step);
    if (!validation.valid) {
      return validation;
    }
  }

  return { valid: true };
}

