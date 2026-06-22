export type ClassFeatureEntry = {
  classId: string;
  level: number;
  nameRu: string;
  descriptionRu: string;
  sourceUrl?: string;
};

export type SpellEntry = {
  id: string;
  nameRu: string;
  level: number;
  schoolRu: string;
  castingTimeRu: string;
  rangeRu: string;
  componentsRu: string;
  durationRu: string;
  descriptionRu: string;
  classes: string[];
  sourceUrl?: string;
};

export type ClassSpellsByLevel = Record<string, string[]>;

export type DndDataMetadata = {
  generatedAt: string;
  source: "dnd.su";
  version: string;
};

export type ClassFeaturesFile = {
  metadata: DndDataMetadata;
  features: ClassFeatureEntry[];
};

export type SpellsFile = {
  metadata: DndDataMetadata;
  spells: SpellEntry[];
};

export type ClassSpellsFile = {
  metadata: DndDataMetadata;
  classSpells: Record<string, ClassSpellsByLevel>;
};
