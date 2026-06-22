import type { z } from "zod";

import type { CountKey, SectionKey } from "~/lib/chronicle/generator";
import type { CharacterSnapshot } from "~/lib/generator/characterSnapshot";
import type {
  AbilityKey,
  EquipmentChoice,
  ScoreGenerationMethod,
} from "~/lib/character/types";

import {
  abilityKeySchema,
  catalogEntrySchema,
  catalogQuerySchema,
  catalogResponseSchema,
  characterBuildInputSchema,
  characterCreateOptionsSchema,
  characterCreateRequestSchema,
  characterCreateResponseSchema,
  chronicleContactOverridesSchema,
  chronicleCountsSchema,
  chronicleSectionOverridesSchema,
  equipmentChoiceSchema,
  pdfPromptInputSchema,
  scoreGenerationMethodSchema,
} from "./schemas";

export type CatalogEntry = z.infer<typeof catalogEntrySchema>;
export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
export type CatalogResponse = z.infer<typeof catalogResponseSchema> & {
  chronicleSections: Record<SectionKey, CatalogEntry[]>;
};

export type CharacterBuildInput = z.infer<typeof characterBuildInputSchema>;
export type ChronicleSectionOverrides = z.infer<
  typeof chronicleSectionOverridesSchema
>;
export type ChronicleContactOverrides = z.infer<
  typeof chronicleContactOverridesSchema
>;
export type ChronicleCountsInput = z.infer<typeof chronicleCountsSchema>;
export type PdfPromptInput = z.infer<typeof pdfPromptInputSchema>;
export type CharacterCreateOptions = z.infer<
  typeof characterCreateOptionsSchema
>;
export type CharacterCreateRequest = z.infer<
  typeof characterCreateRequestSchema
>;

export type CharacterCreateResponse = Omit<
  z.infer<typeof characterCreateResponseSchema>,
  "snapshot"
> & {
  snapshot: CharacterSnapshot;
};

export type { AbilityKey, CountKey, EquipmentChoice, ScoreGenerationMethod };

export {
  abilityKeySchema,
  catalogEntrySchema,
  catalogQuerySchema,
  catalogResponseSchema,
  characterBuildInputSchema,
  characterCreateOptionsSchema,
  characterCreateRequestSchema,
  characterCreateResponseSchema,
  chronicleContactOverridesSchema,
  chronicleCountsSchema,
  chronicleSectionOverridesSchema,
  equipmentChoiceSchema,
  pdfPromptInputSchema,
  scoreGenerationMethodSchema,
};
