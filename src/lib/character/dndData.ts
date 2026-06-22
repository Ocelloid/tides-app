import classFeaturesJson from "~/data/dnd/classFeatures.json";
import classSpellsJson from "~/data/dnd/classSpells.json";
import spellsJson from "~/data/dnd/spells.json";
import type {
  ClassFeatureEntry,
  ClassFeaturesFile,
  ClassSpellsFile,
  SpellEntry,
  SpellsFile,
} from "./dndTypes";

const classFeaturesData = classFeaturesJson as ClassFeaturesFile;
const spellsData = spellsJson as SpellsFile;
const classSpellsData = classSpellsJson as ClassSpellsFile;

const spellsById = new Map<string, SpellEntry>(
  spellsData.spells.map((spell) => [spell.id, spell]),
);

export function getClassFeatures(
  classId: string,
  maxLevel: number,
): ClassFeatureEntry[] {
  return classFeaturesData.features.filter(
    (feature) => feature.classId === classId && feature.level <= maxLevel,
  );
}

export function getSpellsForClass(
  classId: string,
  maxSpellLevel: number,
): SpellEntry[] {
  const byLevel = classSpellsData.classSpells[classId];
  if (!byLevel) {
    return [];
  }

  const spellIds = new Set<string>();
  for (const [levelKey, ids] of Object.entries(byLevel)) {
    const level = Number(levelKey);
    if (Number.isNaN(level) || level > maxSpellLevel) {
      continue;
    }
    for (const id of ids) {
      spellIds.add(id);
    }
  }

  return [...spellIds]
    .map((id) => spellsById.get(id))
    .filter((spell): spell is SpellEntry => spell !== undefined)
    .sort((a, b) => a.level - b.level || a.nameRu.localeCompare(b.nameRu, "ru"));
}

export function getSpellById(id: string): SpellEntry | undefined {
  return spellsById.get(id);
}

export function getDndDataMetadata() {
  return {
    classFeatures: classFeaturesData.metadata,
    spells: spellsData.metadata,
    classSpells: classSpellsData.metadata,
  };
}
