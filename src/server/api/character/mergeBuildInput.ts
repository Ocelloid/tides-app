import {
  ABILITY_KEYS,
  computeAbilityScoreState,
  emptyCharacterBuild,
  setClassLevels,
  updateBackground,
  updateBackgroundSkillChoices,
  updateClassSkillChoices,
  updateEquipmentChoice,
  updateRace,
  type AbilityKey,
  type AbilityScores,
  type CharacterBuild,
  type InventoryItem,
  type SkillName,
  type SpellSelection,
  type WeaponAttack,
} from "~/lib/character";
import { emptyAbilityScores } from "~/lib/character/racialBonuses";

import type { CharacterBuildInput } from "./types";

function isCompleteBase(
  partial: Partial<Record<AbilityKey, number>>,
): partial is AbilityScores {
  return ABILITY_KEYS.every(
    (key) =>
      typeof partial[key] === "number" && Number.isInteger(partial[key]),
  );
}

function mergeCoins(
  current: CharacterBuild["coins"],
  input?: CharacterBuildInput["coins"],
): CharacterBuild["coins"] {
  if (!input) {
    return current;
  }

  return {
    cp: input.cp ?? current.cp,
    sp: input.sp ?? current.sp,
    ep: input.ep ?? current.ep,
    gp: input.gp ?? current.gp,
    pp: input.pp ?? current.pp,
  };
}

function mergeInventoryItem(
  item: NonNullable<CharacterBuildInput["inventory"]>[number],
): InventoryItem {
  return {
    catalogId: item.catalogId ?? null,
    nameRu: item.nameRu ?? "",
    quantity: item.quantity ?? 1,
    weightLb: item.weightLb ?? 0,
    source: item.source ?? "shop",
  };
}

/**
 * Deep-merge explicit `input` onto an empty build before random fill.
 * Applies wizard side effects (background/class changes reset dependent fields).
 */
export function mergeBuildInput(input?: CharacterBuildInput): CharacterBuild {
  let build = emptyCharacterBuild();

  if (!input) {
    return build;
  }

  if (input.classLevels !== undefined) {
    build = setClassLevels(build, input.classLevels);
  }

  if (input.raceId !== undefined) {
    build = updateRace(build, input.raceId);
  }

  if (input.backgroundId !== undefined) {
    build = updateBackground(build, input.backgroundId);
  }

  if (input.flexRacialChoices !== undefined) {
    build = {
      ...build,
      flexRacialChoices: input.flexRacialChoices,
    };
  }

  if (input.backgroundSkillChoices !== undefined) {
    build = updateBackgroundSkillChoices(
      build,
      input.backgroundSkillChoices as SkillName[],
    );
  }

  if (input.classSkillChoices !== undefined) {
    build = updateClassSkillChoices(
      build,
      input.classSkillChoices as SkillName[],
    );
  }

  if (
    input.abilityScores?.method &&
    input.abilityScores.base &&
    isCompleteBase(input.abilityScores.base)
  ) {
    const flexPlusOne = build.flexRacialChoices ?? undefined;
    build = {
      ...build,
      abilityScores: computeAbilityScoreState(
        input.abilityScores.method,
        input.abilityScores.base,
        build.raceId ?? "human",
        flexPlusOne,
      ),
    };
  }

  if (input.equipmentChoice !== undefined) {
    build = updateEquipmentChoice(build, input.equipmentChoice);
  } else if (input.inventory !== undefined || input.coins !== undefined) {
    build = {
      ...build,
      inventory:
        input.inventory?.map((item) => mergeInventoryItem(item)) ??
        build.inventory,
      coins: mergeCoins(build.coins, input.coins),
    };
  }

  if (input.purchasedGearIds !== undefined) {
    build = { ...build, purchasedGearIds: [...input.purchasedGearIds] };
  }

  if (input.weaponAttacks !== undefined) {
    build = {
      ...build,
      weaponAttacks: input.weaponAttacks as WeaponAttack[],
    };
  }

  if (input.selectedSpells !== undefined) {
    build = {
      ...build,
      selectedSpells: input.selectedSpells as SpellSelection[],
    };
  }

  if (input.attacksSpellcastingNotes !== undefined) {
    build = {
      ...build,
      attacksSpellcastingNotes: input.attacksSpellcastingNotes,
    };
  }

  return build;
}

export function getPartialAbilityInput(
  input?: CharacterBuildInput,
): CharacterBuildInput["abilityScores"] | undefined {
  return input?.abilityScores;
}

export function emptyAbilityBase(): AbilityScores {
  return emptyAbilityScores();
}
