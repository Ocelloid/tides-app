import type { RaceCategory, RaceEntry } from "~/lib/chronicle/chronicle";

export type RaceGroup = {
  parentId: string;
  parent: RaceEntry;
  subraces: RaceEntry[];
};

export type RaceGroups = {
  standalone: RaceEntry[];
  groups: RaceGroup[];
};

export const RACE_CATEGORY_LABELS: Record<RaceCategory, string> = {
  base: "Базовая",
  subrace: "Подраса",
  variant: "Вариант",
  lineage: "Происхождение",
  "supernatural-gift": "Сверхъестественный дар",
};

export function buildRaceGroups(races: readonly RaceEntry[]): RaceGroups {
  const childrenByParent = new Map<string, RaceEntry[]>();

  for (const race of races) {
    if (!race.parentRace) {
      continue;
    }

    const siblings = childrenByParent.get(race.parentRace) ?? [];
    siblings.push(race);
    childrenByParent.set(race.parentRace, siblings);
  }

  const groups: RaceGroup[] = [];

  for (const race of races) {
    const subraces = childrenByParent.get(race.id);
    if (!subraces?.length) {
      continue;
    }

    groups.push({
      parentId: race.id,
      parent: race,
      subraces: [...subraces].sort((left, right) => left.min - right.min),
    });
  }

  groups.sort((left, right) => left.parent.min - right.parent.min);

  const groupedParentIds = new Set(groups.map((group) => group.parentId));
  const groupedChildIds = new Set(
    groups.flatMap((group) => group.subraces.map((subrace) => subrace.id)),
  );

  const standalone = races
    .filter(
      (race) =>
        !groupedParentIds.has(race.id) && !groupedChildIds.has(race.id),
    )
    .sort((left, right) => left.min - right.min);

  return { standalone, groups };
}

export function findRaceById(
  races: readonly RaceEntry[],
  raceId: string,
): RaceEntry | undefined {
  return races.find((race) => race.id === raceId);
}

export function getRaceSummary(entry: RaceEntry): string {
  return entry.general.trim() || entry.traits.trim();
}
