import { z } from "zod";

import type { CountKey, SectionKey } from "~/lib/chronicle/generator";
import {
  ageTable,
  allyRelations,
  backgrounds,
  classTable,
  contactStats,
  eyeColorTable,
  familyRelations,
  fateMoments,
  foodTables,
  genderTable,
  hairColorTable,
  homelandTable,
  prophecies,
  rivalRelations,
  secrets,
  settlements,
  skinColorTable,
  statusTable,
} from "~/lib/chronicle/chronicle";
import { CHARACTER_SNAPSHOT_VERSION } from "~/lib/generator/characterSnapshot";

import {
  isKnownClassId,
  isKnownRaceId,
  isKnownSpellId,
  unknownIdMessage,
  VALID_BACKGROUND_IDS,
  VALID_CLASS_IDS,
  VALID_PHB_CORE_CLASS_IDS,
  VALID_PURCHASED_GEAR_IDS,
  VALID_RACE_IDS,
  VALID_SKILL_NAMES,
  VALID_WEAPON_IDS,
} from "./validationIds";

const ALL_SETTLEMENT_IDS = Object.values(settlements).flatMap((table) =>
  table.map((entry) => entry.id),
);
const ALL_FOOD_IDS = Object.values(foodTables).flatMap((table) =>
  table.map((entry) => entry.id),
);

function entryIds<T extends { id: string }>(entries: readonly T[]): string[] {
  return entries.map((entry) => entry.id);
}

function pushUnknownIdIssue(
  ctx: z.RefinementCtx,
  path: (string | number)[],
  field: string,
  value: string,
  validIds: readonly string[],
): void {
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    path,
    message: unknownIdMessage(field, value, validIds),
  });
}

export const abilityKeySchema = z
  .enum(["str", "dex", "con", "int", "wis", "cha"])
  .describe("Ability score key (STR/DEX/CON/INT/WIS/CHA).");

export const scoreGenerationMethodSchema = z
  .enum(["point-buy", "standard-array", "manual"])
  .describe(
    "How ability scores are generated: point-buy (27 points), standard-array, or manual entry.",
  );

export const equipmentChoiceSchema = z
  .enum(["equipment", "gold"])
  .describe(
    "Starting equipment package from class/background or starting gold instead.",
  );

export const countKeySchema = z
  .enum(["allies", "rivals", "fate", "secrets", "prophecies"])
  .describe("Chronicle block count key.");

export const classLevelEntrySchema = z
  .object({
    classId: z
      .string()
      .min(1)
      .describe("PHB core class id, e.g. fighter, wizard."),
    level: z
      .number()
      .int()
      .min(1)
      .max(20)
      .describe("Class level (1–20); total across all classes must not exceed 20."),
  })
  .describe("Single class and level entry for multiclass builds.");

export const abilityScoresInputSchema = z
  .object({
    method: scoreGenerationMethodSchema,
    base: z
      .object({
        str: z.number().int().min(1).max(30).optional(),
        dex: z.number().int().min(1).max(30).optional(),
        con: z.number().int().min(1).max(30).optional(),
        int: z.number().int().min(1).max(30).optional(),
        wis: z.number().int().min(1).max(30).optional(),
        cha: z.number().int().min(1).max(30).optional(),
      })
      .partial()
      .optional()
      .describe(
        "Partial base scores before racial bonuses; pipeline fills missing abilities.",
      ),
  })
  .describe("Ability score generation method and optional partial base scores.");

export const coinPurseSchema = z
  .object({
    cp: z.number().int().min(0).optional(),
    sp: z.number().int().min(0).optional(),
    ep: z.number().int().min(0).optional(),
    gp: z.number().int().min(0).optional(),
    pp: z.number().int().min(0).optional(),
  })
  .describe("Coin purse in cp/sp/ep/gp/pp.");

export const inventoryItemSchema = z
  .object({
    catalogId: z
      .string()
      .nullable()
      .optional()
      .describe("Gear/weapon catalog id, or null for custom items."),
    nameRu: z.string().optional().describe("Russian display name."),
    quantity: z.number().int().min(1).optional().describe("Item quantity."),
    weightLb: z.number().min(0).optional().describe("Weight in pounds."),
    source: z
      .enum(["background", "class", "shop", "weapon-step"])
      .optional()
      .describe("Where the item came from in the build pipeline."),
  })
  .describe("Inventory row on the character sheet.");

export const weaponAttackSchema = z
  .object({
    weaponId: z
      .string()
      .optional()
      .describe("PHB weapon catalog id; omit for custom attacks."),
    name: z.string().optional().describe("Attack name shown on the PDF."),
    attackBonus: z.number().int().describe("Attack bonus (+/-)."),
    damage: z.string().describe('Damage dice/expression, e.g. "1d8+3".'),
  })
  .describe("Weapon or custom attack row for the character sheet.");

export const spellSelectionSchema = z
  .object({
    spellId: z.string().min(1).describe("Spell id from the spell catalog."),
    classId: z
      .string()
      .min(1)
      .describe("Caster class id that knows/prepares this spell."),
    prepared: z
      .boolean()
      .optional()
      .describe("Whether the spell is prepared (prepared casters only)."),
  })
  .describe("Known or prepared spell tied to a caster class.");

export const characterBuildInputSchema = z
  .object({
    classLevels: z
      .array(classLevelEntrySchema)
      .optional()
      .describe("Multiclass levels; empty or omitted → random class step."),
    raceId: z
      .string()
      .optional()
      .describe('Race id, e.g. "human", "half-elf".'),
    backgroundId: z
      .string()
      .optional()
      .describe('Background id, e.g. "acolyte", "soldier".'),
    flexRacialChoices: z
      .array(abilityKeySchema)
      .optional()
      .describe("Flexible +1 ability choices (half-elf: exactly two distinct keys)."),
    abilityScores: abilityScoresInputSchema.optional(),
    equipmentChoice: equipmentChoiceSchema.optional(),
    inventory: z.array(inventoryItemSchema).optional(),
    coins: coinPurseSchema.optional(),
    purchasedGearIds: z
      .array(z.string())
      .optional()
      .describe("Ids of gear/weapons bought during equipment step."),
    backgroundSkillChoices: z
      .array(z.string())
      .optional()
      .describe("Two skill names chosen from the background pool."),
    classSkillChoices: z
      .array(z.string())
      .optional()
      .describe("Class skill proficiencies from the class pool."),
    weaponAttacks: z.array(weaponAttackSchema).optional(),
    selectedSpells: z.array(spellSelectionSchema).optional(),
    attacksSpellcastingNotes: z
      .string()
      .optional()
      .describe("Overflow text for PDF Attacks/Spellcasting section."),
  })
  .superRefine((build, ctx) => {
    if (build.raceId !== undefined) {
      if (!isKnownRaceId(build.raceId)) {
        pushUnknownIdIssue(ctx, ["raceId"], "raceId", build.raceId, VALID_RACE_IDS);
      }
    }

    if (build.backgroundId !== undefined) {
      if (!VALID_BACKGROUND_IDS.includes(build.backgroundId)) {
        pushUnknownIdIssue(
          ctx,
          ["backgroundId"],
          "backgroundId",
          build.backgroundId,
          VALID_BACKGROUND_IDS,
        );
      }
    }

    if (build.classLevels) {
      for (const [index, entry] of build.classLevels.entries()) {
        if (!isKnownClassId(entry.classId)) {
          pushUnknownIdIssue(
            ctx,
            ["classLevels", index, "classId"],
            "classId",
            entry.classId,
            VALID_PHB_CORE_CLASS_IDS,
          );
        }
      }
    }

    if (build.backgroundSkillChoices) {
      for (const [index, skill] of build.backgroundSkillChoices.entries()) {
        if (!VALID_SKILL_NAMES.includes(skill as (typeof VALID_SKILL_NAMES)[number])) {
          pushUnknownIdIssue(
            ctx,
            ["backgroundSkillChoices", index],
            "skill",
            skill,
            VALID_SKILL_NAMES,
          );
        }
      }
    }

    if (build.classSkillChoices) {
      for (const [index, skill] of build.classSkillChoices.entries()) {
        if (!VALID_SKILL_NAMES.includes(skill as (typeof VALID_SKILL_NAMES)[number])) {
          pushUnknownIdIssue(
            ctx,
            ["classSkillChoices", index],
            "skill",
            skill,
            VALID_SKILL_NAMES,
          );
        }
      }
    }

    if (build.purchasedGearIds) {
      for (const [index, gearId] of build.purchasedGearIds.entries()) {
        if (!VALID_PURCHASED_GEAR_IDS.includes(gearId)) {
          pushUnknownIdIssue(
            ctx,
            ["purchasedGearIds", index],
            "purchasedGearId",
            gearId,
            VALID_PURCHASED_GEAR_IDS,
          );
        }
      }
    }

    if (build.weaponAttacks) {
      for (const [index, attack] of build.weaponAttacks.entries()) {
        if (attack.weaponId && !VALID_WEAPON_IDS.includes(attack.weaponId)) {
          pushUnknownIdIssue(
            ctx,
            ["weaponAttacks", index, "weaponId"],
            "weaponId",
            attack.weaponId,
            VALID_WEAPON_IDS,
          );
        }
      }
    }

    if (build.selectedSpells) {
      for (const [index, spell] of build.selectedSpells.entries()) {
        if (!isKnownSpellId(spell.spellId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["selectedSpells", index, "spellId"],
            message: `Unknown spellId "${spell.spellId}". Use GET /api/v1/catalog?classId=<class> for valid spell ids.`,
          });
        }
        if (!isKnownClassId(spell.classId)) {
          pushUnknownIdIssue(
            ctx,
            ["selectedSpells", index, "classId"],
            "classId",
            spell.classId,
            VALID_CLASS_IDS,
          );
        }
      }
    }
  })
  .describe(
    "Partial character build; omitted fields are filled randomly in wizard order.",
  );

const chronicleEntryIdSchema = z
  .object({
    id: z.string().min(1).describe("Chronicle table entry id."),
  })
  .describe("Explicit chronicle entry id for a list slot.");

export const chronicleSectionOverridesSchema = z
  .object({
    race: z.string().optional().describe("Chronicle race entry id."),
    characterClass: z.string().optional().describe("Chronicle class entry id."),
    gender: z.string().optional().describe("Chronicle gender entry id."),
    age: z.string().optional().describe("Chronicle age entry id."),
    status: z.string().optional().describe("Chronicle social status entry id."),
    hairColor: z.string().optional().describe("Chronicle hair color entry id."),
    eyeColor: z.string().optional().describe("Chronicle eye color entry id."),
    skinColor: z.string().optional().describe("Chronicle skin color entry id."),
    homeland: z.string().optional().describe("Chronicle homeland entry id."),
    settlement: z.string().optional().describe("Chronicle settlement entry id."),
    background: z.string().optional().describe("Chronicle background entry id."),
    familyRelation: z
      .string()
      .optional()
      .describe("Chronicle family relation entry id."),
    food: z.string().optional().describe("Chronicle food entry id."),
    government: z
      .string()
      .optional()
      .describe(
        "Homeland government label (not a SectionKey); must match homeland governmentOptions after homeland is resolved.",
      ),
    fate: z
      .array(chronicleEntryIdSchema)
      .optional()
      .describe("Fate moment entry ids; length should match chronicleCounts.fate."),
    secrets: z
      .array(chronicleEntryIdSchema)
      .optional()
      .describe("Secret entry ids; length should match chronicleCounts.secrets."),
    prophecies: z
      .array(chronicleEntryIdSchema)
      .optional()
      .describe(
        "Prophecy entry ids; length should match chronicleCounts.prophecies.",
      ),
  })
  .superRefine((overrides, ctx) => {
    const checks: Array<{
      field: keyof typeof overrides;
      validIds: readonly string[];
    }> = [
      { field: "race", validIds: VALID_RACE_IDS },
      { field: "characterClass", validIds: entryIds(classTable) },
      { field: "gender", validIds: entryIds(genderTable) },
      { field: "age", validIds: entryIds(ageTable) },
      { field: "status", validIds: entryIds(statusTable) },
      { field: "hairColor", validIds: entryIds(hairColorTable) },
      { field: "eyeColor", validIds: entryIds(eyeColorTable) },
      { field: "skinColor", validIds: entryIds(skinColorTable) },
      { field: "homeland", validIds: entryIds(homelandTable) },
      { field: "settlement", validIds: ALL_SETTLEMENT_IDS },
      { field: "background", validIds: entryIds(backgrounds) },
      { field: "familyRelation", validIds: entryIds(familyRelations) },
      { field: "food", validIds: ALL_FOOD_IDS },
    ];

    for (const { field, validIds } of checks) {
      const value = overrides[field];
      if (typeof value === "string" && !validIds.includes(value)) {
        pushUnknownIdIssue(ctx, [field], String(field), value, validIds);
      }
    }

    const listChecks: Array<{
      field: "fate" | "secrets" | "prophecies";
      validIds: readonly string[];
    }> = [
      { field: "fate", validIds: entryIds(fateMoments) },
      { field: "secrets", validIds: entryIds(secrets) },
      { field: "prophecies", validIds: entryIds(prophecies) },
    ];

    for (const { field, validIds } of listChecks) {
      const entries = overrides[field];
      if (!entries) {
        continue;
      }
      for (const [index, entry] of entries.entries()) {
        if (!validIds.includes(entry.id)) {
          pushUnknownIdIssue(ctx, [field, index, "id"], `${field} id`, entry.id, validIds);
        }
      }
    }
  })
  .describe(
    "Explicit chronicle section ids; unset sections stay random. Use chronicleContacts for allies/rivals.",
  );

export const chronicleContactOverridesSchema = z
  .object({
    allies: z
      .array(
        z.object({
          relationId: z
            .string()
            .optional()
            .describe("Ally relation entry id."),
          statId: z.string().optional().describe("Contact stat entry id."),
        }),
      )
      .optional(),
    rivals: z
      .array(
        z.object({
          relationId: z
            .string()
            .optional()
            .describe("Rival relation entry id."),
          statId: z.string().optional().describe("Contact stat entry id."),
        }),
      )
      .optional(),
  })
  .superRefine((contacts, ctx) => {
    const allyRelationIds = entryIds(allyRelations);
    const rivalRelationIds = entryIds(rivalRelations);
    const statIds = entryIds(contactStats);

    if (contacts.allies) {
      for (const [index, contact] of contacts.allies.entries()) {
        if (contact.relationId && !allyRelationIds.includes(contact.relationId)) {
          pushUnknownIdIssue(
            ctx,
            ["allies", index, "relationId"],
            "relationId",
            contact.relationId,
            allyRelationIds,
          );
        }
        if (contact.statId && !statIds.includes(contact.statId)) {
          pushUnknownIdIssue(
            ctx,
            ["allies", index, "statId"],
            "statId",
            contact.statId,
            statIds,
          );
        }
      }
    }

    if (contacts.rivals) {
      for (const [index, contact] of contacts.rivals.entries()) {
        if (contact.relationId && !rivalRelationIds.includes(contact.relationId)) {
          pushUnknownIdIssue(
            ctx,
            ["rivals", index, "relationId"],
            "relationId",
            contact.relationId,
            rivalRelationIds,
          );
        }
        if (contact.statId && !statIds.includes(contact.statId)) {
          pushUnknownIdIssue(
            ctx,
            ["rivals", index, "statId"],
            "statId",
            contact.statId,
            statIds,
          );
        }
      }
    }
  })
  .describe("Per-index ally/rival relation and stat overrides.");

export const chronicleCountsSchema = z
  .object({
    allies: z.number().int().min(0).max(5).optional(),
    rivals: z.number().int().min(0).max(5).optional(),
    fate: z.number().int().min(0).max(5).optional(),
    secrets: z.number().int().min(0).max(5).optional(),
    prophecies: z.number().int().min(0).max(5).optional(),
  })
  .describe("Explicit chronicle block counts (0–5 each).");

export const pdfPromptInputSchema = z
  .object({
    playerName: z.string().optional().describe("Player name on the PDF."),
    alignment: z.string().optional().describe("Character alignment text."),
    height: z.string().optional().describe("Character height text."),
    weight: z.string().optional().describe("Character weight text."),
  })
  .describe("Optional PDF header fields.");

export const characterCreateOptionsSchema = z
  .object({
    includeMarkdown: z
      .boolean()
      .optional()
      .describe("Include chronicle markdown in the JSON response (default true)."),
    includePdf: z
      .boolean()
      .optional()
      .describe("Include PDF base64 in the response (default true)."),
    seed: z
      .number()
      .int()
      .optional()
      .describe("Optional RNG seed for reproducible random fill (tests)."),
  })
  .describe("Response and randomness options.");

export const characterCreateRequestSchema = z
  .object({
    characterName: z
      .string()
      .optional()
      .describe("Character display name; random if omitted."),
    pdf: pdfPromptInputSchema.optional(),
    build: characterBuildInputSchema.optional(),
    chronicle: chronicleSectionOverridesSchema.optional(),
    chronicleCounts: chronicleCountsSchema.optional(),
    chronicleContacts: chronicleContactOverridesSchema.optional(),
    options: characterCreateOptionsSchema.optional(),
  })
  .describe(
    "Create-character request; every field is optional — {} yields a fully random character.",
  );

export const characterSnapshotSchema = z
  .object({
    version: z.literal(CHARACTER_SNAPSHOT_VERSION),
    exportedAt: z.string().describe("ISO timestamp of export."),
    characterBuild: z.record(z.unknown()).describe("Full CharacterBuild state."),
    chronicle: z
      .record(z.unknown())
      .nullable()
      .describe("Generated chronicle object, or null."),
    characterName: z.string(),
    characterNamePlaceholder: z.string(),
    wizardPhase: z.enum(["active", "done"]),
    wizardStep: z.enum([
      "class",
      "race",
      "background",
      "abilities",
      "equipment",
      "weapons-magic",
      "review",
    ]),
  })
  .describe("CharacterSnapshot v1 returned in API responses.");

export const characterCreateResponseSchema = z
  .object({
    url: z.string().describe("Share URL with encoded ?char= payload."),
    urlTooLong: z
      .boolean()
      .describe("True when URL exceeds browser/history limits."),
    snapshot: characterSnapshotSchema,
    markdown: z
      .string()
      .optional()
      .describe("Chronicle markdown when includeMarkdown is true."),
    pdf: z
      .object({
        base64: z.string().describe("PDF bytes encoded as base64."),
        filename: z.string().describe("Suggested download filename."),
        mimeType: z.literal("application/pdf"),
      })
      .nullable()
      .describe("PDF payload; null when options.includePdf is false."),
    warnings: z
      .array(z.string())
      .describe("Non-fatal pipeline warnings for the agent."),
  })
  .describe("Successful character creation response.");

export const catalogQuerySchema = z
  .object({
    classId: z
      .string()
      .optional()
      .describe(
        "Filter spell catalog to spells available to this class id.",
      ),
  })
  .describe("Optional catalog query parameters.");

export const catalogEntrySchema = z
  .object({
    id: z.string(),
    nameRu: z.string(),
  })
  .describe("Catalog row with stable id and Russian display name.");

export const catalogResponseSchema = z
  .object({
    classes: z.array(catalogEntrySchema),
    races: z.array(catalogEntrySchema),
    backgrounds: z.array(catalogEntrySchema),
    abilityMethods: z.array(catalogEntrySchema),
    skills: z.array(catalogEntrySchema),
    spells: z.array(catalogEntrySchema),
    weapons: z.array(catalogEntrySchema),
    chronicleSections: z.record(z.array(catalogEntrySchema)),
  })
  .describe("Discovery catalog for agent-friendly ids.");

export type SectionKeyCatalog = Record<SectionKey, z.infer<typeof catalogEntrySchema>[]>;
export type CountKeySchema = CountKey;
