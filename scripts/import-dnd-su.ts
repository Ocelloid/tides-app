#!/usr/bin/env tsx
/**
 * Dev-time importer: fetches PHB class features and spells from dnd.su
 * and writes static JSON under src/data/dnd/.
 *
 * Usage: pnpm import:dnd-su [--fallback]
 *   --fallback  Write bundled minimal sample data instead of live fetch.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "src/data/dnd");

const PHB_CORE_CLASS_IDS = [
  "barbarian",
  "bard",
  "cleric",
  "druid",
  "fighter",
  "monk",
  "paladin",
  "ranger",
  "rogue",
  "sorcerer",
  "warlock",
  "wizard",
] as const;

type PhbClassId = (typeof PHB_CORE_CLASS_IDS)[number];

const DND_SU_CLASS_PATH: Record<PhbClassId, string> = {
  barbarian: "87-barbarian",
  bard: "88-bard",
  cleric: "89-cleric",
  druid: "90-druid",
  fighter: "91-fighter",
  monk: "93-monk",
  paladin: "94-paladin",
  ranger: "97-ranger",
  rogue: "99-rogue",
  sorcerer: "101-sorcerer",
  warlock: "104-warlock",
  wizard: "105-wizard",
};

/** dnd.su spell filter `class=` query values for casters. */
const DND_SU_SPELL_CLASS_ID: Partial<Record<PhbClassId, number>> = {
  bard: 12,
  cleric: 13,
  druid: 22,
  paladin: 16,
  ranger: 17,
  sorcerer: 19,
  warlock: 20,
  wizard: 21,
};

const CLASS_NAME_RU_TO_ID: Record<string, PhbClassId> = {
  варвар: "barbarian",
  бард: "bard",
  жрец: "cleric",
  друид: "druid",
  воин: "fighter",
  монах: "monk",
  паладин: "paladin",
  следопыт: "ranger",
  плут: "rogue",
  чародей: "sorcerer",
  колдун: "warlock",
  волшебник: "wizard",
};

const METADATA_VERSION = "1.0.0";
const FETCH_DELAY_MS = 400;
const MAX_RETRIES = 3;

type ClassFeatureEntry = {
  classId: string;
  level: number;
  nameRu: string;
  descriptionRu: string;
  sourceUrl?: string;
};

type SpellEntry = {
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html: string): string {
  return decodeHtml(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchText(url: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "tides-app-import/1.0 (+dev script)",
          Accept: "text/html",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await sleep(FETCH_DELAY_MS * attempt);
      }
    }
  }
  throw lastError;
}

function parseFeatureDescriptions(html: string): Map<string, string> {
  const descriptions = new Map<string, string>();
  const sectionMatch = html.match(
    /<span id=['"]class-features['"][\s\S]*$/i,
  ) ?? [html];
  const section = sectionMatch[0] ?? html;

  const headingRegex =
    /<h3[^>]*underlined[^>]*>[\s\S]*?<span id=['"]feature\.([^'"]+)['"][^>]*>([\s\S]*?)<\/span>[\s\S]*?<\/h3>([\s\S]*?)(?=<br><h3|$)/gi;

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(section)) !== null) {
    const featureId = match[1];
    const name = stripTags(match[2] ?? "");
    const body = stripTags(match[3] ?? "");
    if (featureId) {
      descriptions.set(featureId, body || name);
    }
  }

  return descriptions;
}

function parseClassFeatures(
  classId: PhbClassId,
  html: string,
  sourceUrl: string,
): ClassFeatureEntry[] {
  const tableMatch = html.match(
    /<table[^>]*class_table[^>]*>([\s\S]*?)<\/table>/i,
  );
  if (!tableMatch?.[1]) {
    throw new Error(`class_table not found for ${classId}`);
  }

  const descriptions = parseFeatureDescriptions(html);
  const features: ClassFeatureEntry[] = [];
  const rowRegex =
    /<tr(?![^>]*table_header)[^>]*>\s*<td>\s*(\d+)\s*<\/td>([\s\S]*?)<\/tr>/gi;

  let row: RegExpExecArray | null;
  while ((row = rowRegex.exec(tableMatch[1])) !== null) {
    const level = Number(row[1]);
    const rowHtml = row[2] ?? "";
    const linkRegex =
      /<a href="#feature\.([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let link: RegExpExecArray | null;
    while ((link = linkRegex.exec(rowHtml)) !== null) {
      const featureId = link[1];
      const nameRu = stripTags(link[2] ?? "");
      if (!featureId || !nameRu) continue;
      if (nameRu.toLowerCase().includes("увеличение характеристик")) {
        continue;
      }
      const descriptionRu =
        descriptions.get(featureId) ??
        `${nameRu} (описание не найдено при импорте)`;
      features.push({
        classId,
        level,
        nameRu,
        descriptionRu,
        sourceUrl: `${sourceUrl}#feature.${featureId}`,
      });
    }
  }

  if (features.length === 0) {
    throw new Error(`No features parsed for ${classId}`);
  }

  return features;
}

function spellSlugFromPath(path: string): string {
  const match = path.match(/\/spells\/\d+-([^/]+)\/?$/i);
  if (!match?.[1]) {
    throw new Error(`Invalid spell path: ${path}`);
  }
  return match[1].replace(/_/g, "-").toLowerCase();
}

function parseSpellParams(
  paramsBlock: string,
  descriptionHtml: string,
  path: string,
  fallbackName: string,
): Omit<SpellEntry, "classes"> & { classes: PhbClassId[] } {
  const sourceUrl = `https://dnd.su${path}`;
  const id = spellSlugFromPath(path);

  const levelSchoolMatch = paramsBlock.match(
    /<li class="size-type-alignment">([^<]+)<\/li>/i,
  );
  const levelSchool = stripTags(levelSchoolMatch?.[1] ?? "0, ");
  const [levelPart, ...schoolParts] = levelSchool.split(",");
  const levelText = (levelPart ?? "").trim().toLowerCase();
  const level = levelText.includes("заговор")
    ? 0
    : Number(levelText.match(/\d+/)?.[0] ?? 0);
  const schoolRu = schoolParts.join(",").trim() || "—";

  const pickParam = (label: string): string => {
    const regex = new RegExp(
      `<strong>${label}:<\\/strong>\\s*([^<]+)`,
      "i",
    );
    const m = paramsBlock.match(regex);
    return stripTags(m?.[1] ?? "—");
  };

  const classesLine = pickParam("Классы");
  const classes = classesLine
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .map((name) => CLASS_NAME_RU_TO_ID[name])
    .filter((classId): classId is PhbClassId => classId !== undefined);

  const descriptionRu = stripTags(descriptionHtml);

  return {
    id,
    nameRu:
      fallbackName.replace(/\s*\[[^\]]+\]\s*$/, "").trim() || fallbackName,
    level,
    schoolRu,
    castingTimeRu: pickParam("Время накладывания"),
    rangeRu: pickParam("Дистанция"),
    componentsRu: pickParam("Компоненты"),
    durationRu: pickParam("Длительность"),
    descriptionRu,
    classes,
    sourceUrl,
  };
}

function parseSpellCard(cardHtml: string, path: string): SpellEntry | null {
  const nameMatch = cardHtml.match(/class="item-link">([\s\S]*?)<\/a>/i);
  const paramsMatch = cardHtml.match(
    /<ul class="params card__article-body">([\s\S]*?)<\/ul>/i,
  );
  const descMatch = cardHtml.match(
    /<div itemprop="description">([\s\S]*?)<\/div>/i,
  );
  if (!paramsMatch?.[1]) {
    return null;
  }

  const fallbackName = stripTags(nameMatch?.[1] ?? spellSlugFromPath(path));
  return parseSpellParams(
    paramsMatch[1],
    descMatch?.[1] ?? "",
    path,
    fallbackName,
  );
}

function parseSpellListPage(
  html: string,
  classId: PhbClassId,
): SpellEntry[] {
  const spells: SpellEntry[] = [];
  const cardPathRegex = /data-cardlink=['"](\/spells\/\d+-[^'"]+)['"]/gi;
  const paths = new Set<string>();
  let pathMatch: RegExpExecArray | null;
  while ((pathMatch = cardPathRegex.exec(html)) !== null) {
    if (pathMatch[1]) {
      paths.add(pathMatch[1]);
    }
  }

  for (const path of paths) {
    const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const cardMatch = html.match(
      new RegExp(
        `data-cardlink=['"]${escapedPath}['"][\\s\\S]*?(?=data-cardlink=['"]\\/spells\\/\\d+-|$)`,
        "i",
      ),
    );
    if (!cardMatch?.[0]) continue;

    const spell = parseSpellCard(cardMatch[0], path);
    if (!spell || spell.level > 1) continue;
    if (!spell.classes.includes(classId)) {
      spell.classes.push(classId);
    }
    spells.push(spell);
  }

  return spells;
}

function parseSpellPage(path: string, html: string, fallbackName: string): SpellEntry {
  const paramsMatch = html.match(
    /<ul class="params card__article-body">([\s\S]*?)<\/ul>/i,
  );
  const descMatch = html.match(
    /<div itemprop="description">([\s\S]*?)<\/div>/i,
  );
  const nameMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const nameRu =
    stripTags(nameMatch?.[1] ?? fallbackName).replace(/\s*\[[^\]]+\]\s*$/, "").trim() ||
    fallbackName;

  return parseSpellParams(
    paramsMatch?.[1] ?? "",
    descMatch?.[1] ?? "",
    path,
    nameRu,
  );
}

async function importLive(): Promise<{
  features: ClassFeatureEntry[];
  spells: SpellEntry[];
  classSpells: Record<string, Record<string, string[]>>;
}> {
  const features: ClassFeatureEntry[] = [];
  const spellMap = new Map<string, SpellEntry>();
  const classSpells: Record<string, Record<string, string[]>> = {};

  for (const classId of PHB_CORE_CLASS_IDS) {
    const slug = DND_SU_CLASS_PATH[classId];
    const url = `https://dnd.su/class/${slug}/`;
    console.log(`Fetching class ${classId}…`);
    const html = await fetchText(url);
    features.push(...parseClassFeatures(classId, html, url));
    await sleep(FETCH_DELAY_MS);
  }

  const levelsToFetch = [0, 1];
  for (const classId of PHB_CORE_CLASS_IDS) {
    const filterClassId = DND_SU_SPELL_CLASS_ID[classId];
    if (!filterClassId) continue;

    classSpells[classId] = {};
    for (const level of levelsToFetch) {
      const listUrl = `https://dnd.su/spells/?search=&class=${filterClassId}&level=${level}`;
      console.log(`Fetching spells ${classId} level ${level}…`);
      const listHtml = await fetchText(listUrl);
      const listed = parseSpellListPage(listHtml, classId);
      classSpells[classId][String(level)] = listed.map((entry) => entry.id);

      for (const spell of listed) {
        const existing = spellMap.get(spell.id);
        if (existing) {
          if (!existing.classes.includes(classId)) {
            existing.classes.push(classId);
          }
          continue;
        }
        spellMap.set(spell.id, spell);
      }

      await sleep(FETCH_DELAY_MS);
    }
  }

  return {
    features,
    spells: [...spellMap.values()],
    classSpells,
  };
}

function buildFallbackData(): {
  features: ClassFeatureEntry[];
  spells: SpellEntry[];
  classSpells: Record<string, Record<string, string[]>>;
} {
  const generatedAt = new Date().toISOString();
  const sourceUrl = (classId: string, feature: string) =>
    `https://dnd.su/class/${DND_SU_CLASS_PATH[classId as PhbClassId]}/#feature.${feature}`;

  const features: ClassFeatureEntry[] = [
    {
      classId: "fighter",
      level: 1,
      nameRu: "Боевой стиль",
      descriptionRu:
        "Вы выбираете боевой стиль, соответствующий вашей специализации.",
      sourceUrl: sourceUrl("fighter", "fighting-style"),
    },
    {
      classId: "fighter",
      level: 1,
      nameRu: "Второе дыхание",
      descriptionRu:
        "Бонусным действием вы можете восстановить хиты, равные 1к10 + ваш уровень воина.",
      sourceUrl: sourceUrl("fighter", "second-wind"),
    },
    {
      classId: "fighter",
      level: 2,
      nameRu: "Всплеск действий",
      descriptionRu: "Один раз за короткий или продолжительный отдых вы получаете дополнительное действие.",
      sourceUrl: sourceUrl("fighter", "action-surge"),
    },
    {
      classId: "fighter",
      level: 3,
      nameRu: "Воинский архетип",
      descriptionRu: "Вы выбираете архетип, определяющий ваш боевой стиль.",
      sourceUrl: sourceUrl("fighter", "martial-archetype"),
    },
    {
      classId: "wizard",
      level: 1,
      nameRu: "Использование заклинаний",
      descriptionRu:
        "Вы знаете заговоры и записываете заклинания в книгу заклинаний.",
      sourceUrl: sourceUrl("wizard", "spellcasting"),
    },
    {
      classId: "wizard",
      level: 1,
      nameRu: "Магическое восстановление",
      descriptionRu:
        "Раз в день после короткого отдыха вы восстанавливаете ячейки заклинаний суммарным уровнем не более половины уровня волшебника.",
      sourceUrl: sourceUrl("wizard", "arcane-recovery"),
    },
    {
      classId: "wizard",
      level: 2,
      nameRu: "Тайное искусство",
      descriptionRu: "Вы выбираете традицию магии, определяющую ваш путь.",
      sourceUrl: sourceUrl("wizard", "arcane-tradition"),
    },
    {
      classId: "cleric",
      level: 1,
      nameRu: "Божественный домен",
      descriptionRu: "Вы выбираете домен, связанный с вашим божеством.",
      sourceUrl: sourceUrl("cleric", "domain"),
    },
    {
      classId: "cleric",
      level: 1,
      nameRu: "Использование заклинаний",
      descriptionRu: "Вы подготавливаете и накладываете заклинания жреца.",
      sourceUrl: sourceUrl("cleric", "spellcasting"),
    },
    {
      classId: "cleric",
      level: 2,
      nameRu: "Божественный канал",
      descriptionRu: "Вы получаете способность направлять божественную энергию.",
      sourceUrl: sourceUrl("cleric", "channel-divinity"),
    },
  ];

  for (const classId of PHB_CORE_CLASS_IDS) {
    if (features.some((f) => f.classId === classId)) continue;
    for (let level = 1; level <= 3; level++) {
      features.push({
        classId,
        level,
        nameRu: `Умение ${classId} ${level} ур.`,
        descriptionRu: `Заглушка умения для ${classId}, уровень ${level}. Перегенерируйте через pnpm import:dnd-su.`,
        sourceUrl: `https://dnd.su/class/${DND_SU_CLASS_PATH[classId]}/`,
      });
    }
  }

  const spells: SpellEntry[] = [
    {
      id: "mage-hand",
      nameRu: "Волшебная рука",
      level: 0,
      schoolRu: "вызов",
      castingTimeRu: "1 действие",
      rangeRu: "30 футов",
      componentsRu: "В, С",
      durationRu: "1 минута",
      descriptionRu:
        "Призрачная рука появляется в точке в пределах дистанции.",
      classes: ["wizard", "sorcerer", "warlock"],
      sourceUrl: "https://dnd.su/spells/26-mage-hand/",
    },
    {
      id: "fire-bolt",
      nameRu: "Огненный снаряд",
      level: 0,
      schoolRu: "воплощение",
      castingTimeRu: "1 действие",
      rangeRu: "120 футов",
      componentsRu: "В, С",
      durationRu: "Мгновенная",
      descriptionRu: "Вы метаете комок огня в существо в пределах дистанции.",
      classes: ["wizard", "sorcerer"],
      sourceUrl: "https://dnd.su/spells/204-fire-bolt/",
    },
    {
      id: "magic-missile",
      nameRu: "Волшебная стрела",
      level: 1,
      schoolRu: "воплощение",
      castingTimeRu: "1 действие",
      rangeRu: "120 футов",
      componentsRu: "В, С",
      durationRu: "Мгновенная",
      descriptionRu:
        "Вы создаёте три светящихся дротика из магической силы.",
      classes: ["wizard", "sorcerer"],
      sourceUrl: "https://dnd.su/spells/27-magic-missile/",
    },
    {
      id: "shield",
      nameRu: "Щит",
      level: 1,
      schoolRu: "ограждение",
      castingTimeRu: "1 реакция",
      rangeRu: "На себя",
      componentsRu: "В, С",
      durationRu: "1 раунд",
      descriptionRu: "Невидимый барьер магической силы защищает вас.",
      classes: ["wizard", "sorcerer"],
      sourceUrl: "https://dnd.su/spells/285-shield/",
    },
    {
      id: "sacred-flame",
      nameRu: "Священное пламя",
      level: 0,
      schoolRu: "воплощение",
      castingTimeRu: "1 действие",
      rangeRu: "60 футов",
      componentsRu: "В, С",
      durationRu: "Мгновенная",
      descriptionRu:
        "Пламя, похожее на радиance, обрушивается на существо в пределах дистанции.",
      classes: ["cleric"],
      sourceUrl: "https://dnd.su/spells/250-sacred-flame/",
    },
    {
      id: "guidance",
      nameRu: "Наставление",
      level: 0,
      schoolRu: "прорицание",
      castingTimeRu: "1 действие",
      rangeRu: "Касание",
      componentsRu: "В, С",
      durationRu: "Концентрация, до 1 минуты",
      descriptionRu: "Вы касаетесь согласного существа и даруете божественное наставление.",
      classes: ["cleric", "druid"],
      sourceUrl: "https://dnd.su/spells/115-guidance/",
    },
    {
      id: "cure-wounds",
      nameRu: "Лечение ран",
      level: 1,
      schoolRu: "воплощение",
      castingTimeRu: "1 действие",
      rangeRu: "Касание",
      componentsRu: "В, С",
      durationRu: "Мгновенная",
      descriptionRu: "Существо восстанавливает хиты.",
      classes: ["cleric", "druid", "bard", "paladin", "ranger"],
      sourceUrl: "https://dnd.su/spells/67-cure-wounds/",
    },
    {
      id: "bless",
      nameRu: "Благословение",
      level: 1,
      schoolRu: "очарование",
      castingTimeRu: "1 действие",
      rangeRu: "30 футов",
      componentsRu: "В, С, М",
      durationRu: "Концентрация, до 1 минуты",
      descriptionRu: "Вы благословляете до трёх существ.",
      classes: ["cleric", "paladin"],
      sourceUrl: "https://dnd.su/spells/34-bless/",
    },
  ];

  const classSpells: Record<string, Record<string, string[]>> = {
    wizard: {
      "0": ["mage-hand", "fire-bolt"],
      "1": ["magic-missile", "shield"],
    },
    sorcerer: {
      "0": ["fire-bolt"],
      "1": ["magic-missile", "shield"],
    },
    warlock: {
      "0": ["mage-hand"],
      "1": [],
    },
    cleric: {
      "0": ["sacred-flame", "guidance"],
      "1": ["cure-wounds", "bless"],
    },
    druid: {
      "0": ["guidance"],
      "1": ["cure-wounds"],
    },
    bard: {
      "0": [],
      "1": ["cure-wounds"],
    },
    paladin: {
      "0": [],
      "1": ["cure-wounds", "bless"],
    },
    ranger: {
      "0": [],
      "1": ["cure-wounds"],
    },
  };

  console.warn(
    `Using fallback sample data (generatedAt=${generatedAt}). Run without --fallback for live import.`,
  );

  return { features, spells, classSpells };
}

function writeJsonFiles(data: {
  features: ClassFeatureEntry[];
  spells: SpellEntry[];
  classSpells: Record<string, Record<string, string[]>>;
}) {
  const generatedAt = new Date().toISOString();
  const metadata = {
    generatedAt,
    source: "dnd.su" as const,
    version: METADATA_VERSION,
  };

  mkdirSync(OUT_DIR, { recursive: true });

  writeFileSync(
    join(OUT_DIR, "classFeatures.json"),
    `${JSON.stringify({ metadata, features: data.features }, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(
    join(OUT_DIR, "spells.json"),
    `${JSON.stringify({ metadata, spells: data.spells }, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(
    join(OUT_DIR, "classSpells.json"),
    `${JSON.stringify({ metadata, classSpells: data.classSpells }, null, 2)}\n`,
    "utf8",
  );

  const classCounts = PHB_CORE_CLASS_IDS.map(
    (id) =>
      `${id}: ${data.features.filter((f) => f.classId === id && f.level <= 3).length} features (lvl 1–3)`,
  );
  console.log("Wrote JSON to src/data/dnd/");
  console.log(classCounts.join("\n"));
  console.log(
    `Spells: ${data.spells.filter((s) => s.level <= 1).length} (cantrips + level 1)`,
  );
}

async function main() {
  const useFallback = process.argv.includes("--fallback");

  try {
    const data = useFallback ? buildFallbackData() : await importLive();
    writeJsonFiles(data);
  } catch (error) {
    console.error("Import failed:", error);
    console.error(
      "dnd.su may be unavailable or HTML layout changed. Use committed JSON or run with --fallback.",
    );
    process.exit(1);
  }
}

main();
