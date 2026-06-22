import spellsJson from "~/data/dnd/spells.json";
import {
  allyRelations,
  backgrounds,
  cityFamilySize,
  contactStats,
  familyRelations,
  fateMoments,
  foodTables,
  homelandTable,
  prophecies,
  rivalRelations,
  secrets,
  settlements,
  villageFamilySize,
} from "~/lib/chronicle/chronicle";
import {
  ageOptions,
  classOptions,
  eyeColorOptions,
  genderOptions,
  hairColorOptions,
  raceOptions,
  skinColorOptions,
  statusOptions,
} from "~/lib/chronicle/generator";
import type { SectionKey } from "~/lib/chronicle/generator";
import { getSpellsForClass } from "~/lib/character/dndData";
import type { SpellsFile } from "~/lib/character/dndTypes";
import { PHB_WEAPONS_CATALOG } from "~/lib/character/phbWeaponsCatalog";
import {
  ALL_SKILLS,
  SKILL_LABELS_RU,
} from "~/lib/character/skillProficiencies";

import type { CatalogEntry, CatalogQuery, CatalogResponse } from "./types";

const spellsData = spellsJson as SpellsFile;
const DEFAULT_SPELL_LIMIT = 100;
const MAX_SPELL_LEVEL = 9;

const ABILITY_METHOD_LABELS: Record<string, string> = {
  "point-buy": "Point Buy (27 очков)",
  "standard-array": "Standard Array",
  manual: "Вручную",
};

function toCatalogEntry(id: string, nameRu: string): CatalogEntry {
  return { id, nameRu };
}

function mapNamedEntries(
  entries: ReadonlyArray<{ id: string; name: string }>,
): CatalogEntry[] {
  return entries.map((entry) => toCatalogEntry(entry.id, entry.name));
}

function mapTextEntries(
  entries: ReadonlyArray<{ id: string; text: string }>,
): CatalogEntry[] {
  return entries.map((entry) =>
    toCatalogEntry(entry.id, entry.text.slice(0, 120)),
  );
}

function mapHomelandEntries(): CatalogEntry[] {
  return homelandTable.map((entry: (typeof homelandTable)[number]) =>
    toCatalogEntry(entry.id, entry.region),
  );
}

function mapAllSettlements(): CatalogEntry[] {
  return Object.values(settlements).flatMap((table) =>
    table.map((entry) => toCatalogEntry(entry.id, entry.name)),
  );
}

function mapAllFood(): CatalogEntry[] {
  return Object.values(foodTables).flatMap((table) =>
    table.map((entry) => toCatalogEntry(entry.id, entry.name)),
  );
}

function mapFamilySizes(): CatalogEntry[] {
  const combined = [...villageFamilySize, ...cityFamilySize];
  const seen = new Set<string>();
  const entries: CatalogEntry[] = [];

  for (const entry of combined) {
    if (seen.has(entry.id)) {
      continue;
    }
    seen.add(entry.id);
    entries.push(
      toCatalogEntry(
        entry.id,
        `${entry.parents}; siblings: ${entry.siblingsFormula}`,
      ),
    );
  }

  return entries;
}

function mapContactSection(): CatalogEntry[] {
  const entries: CatalogEntry[] = [];
  const seen = new Set<string>();

  for (const entry of [...allyRelations, ...rivalRelations, ...contactStats]) {
    if (seen.has(entry.id)) {
      continue;
    }
    seen.add(entry.id);
    entries.push(toCatalogEntry(entry.id, entry.text.slice(0, 120)));
  }

  return entries;
}

function buildSpellCatalog(filter?: CatalogQuery): CatalogEntry[] {
  if (filter?.classId) {
    return getSpellsForClass(filter.classId, MAX_SPELL_LEVEL).map((spell) =>
      toCatalogEntry(spell.id, spell.nameRu),
    );
  }

  return spellsData.spells
    .slice(0, DEFAULT_SPELL_LIMIT)
    .map((spell) => toCatalogEntry(spell.id, spell.nameRu));
}

function buildChronicleSections(): Record<SectionKey, CatalogEntry[]> {
  return {
    race: mapNamedEntries(raceOptions()),
    characterClass: mapNamedEntries(classOptions()),
    gender: mapNamedEntries(genderOptions()),
    age: mapNamedEntries(ageOptions()),
    status: mapNamedEntries(statusOptions()),
    hairColor: mapNamedEntries(hairColorOptions()),
    eyeColor: mapNamedEntries(eyeColorOptions()),
    skinColor: mapNamedEntries(skinColorOptions()),
    homeland: mapHomelandEntries(),
    settlement: mapAllSettlements(),
    background: mapNamedEntries(backgrounds),
    family: mapFamilySizes(),
    familyRelation: mapTextEntries(familyRelations),
    ally: mapTextEntries(allyRelations),
    rival: mapTextEntries(rivalRelations),
    contacts: mapContactSection(),
    fate: mapTextEntries(fateMoments),
    food: mapAllFood(),
    secret: mapTextEntries(secrets),
    prophecies: mapTextEntries(prophecies),
  };
}

export function buildCatalogResponse(filter?: CatalogQuery): CatalogResponse {
  return {
    classes: mapNamedEntries(classOptions()),
    races: mapNamedEntries(raceOptions()),
    backgrounds: mapNamedEntries(backgrounds),
    abilityMethods: Object.entries(ABILITY_METHOD_LABELS).map(([id, nameRu]) =>
      toCatalogEntry(id, nameRu),
    ),
    skills: ALL_SKILLS.map((skill) =>
      toCatalogEntry(skill, SKILL_LABELS_RU[skill]),
    ),
    spells: buildSpellCatalog(filter),
    weapons: PHB_WEAPONS_CATALOG.map((weapon) =>
      toCatalogEntry(weapon.id, weapon.nameRu),
    ),
    chronicleSections: buildChronicleSections(),
  };
}
