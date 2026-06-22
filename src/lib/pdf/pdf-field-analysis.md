# Анализ PDF-листа персонажа (tides-app)

Продолжение Lakebed analysis: `TMP/lakebed/2026-06-22-04-36-pdf-character-sheet-prefill/pdf-field-analysis.md`

## Исходный файл

`tides-app/public/DnD5e_character_sheet_RUS.pdf` (копия `TMP/DnD5e_character_sheet_RUS.pdf`)

## Артефакты анализа

| Артефакт | Путь |
| --- | --- |
| qpdf AcroForm JSON | `TMP/pdf-character-sheet-analysis/qpdf-acroform.json` |
| Сводка полей | `TMP/pdf-character-sheet-analysis/field_summary.json` |
| Текстовый layout | `TMP/pdf-character-sheet-analysis/sheet-layout.txt` |
| Скриншот page 2 | `TMP/pdf-character-sheet-analysis/pages/page-2.png` |
| Overlay (bounding boxes) | `TMP/pdf-character-sheet-analysis/page-2-overlay.png` |
| Координаты widgets | `TMP/pdf-character-sheet-analysis/page-2-coordinates.json` |
| Typed mapping (код) | `tides-app/src/lib/pdf/page2Mapping.ts` |
| Скриншот page 3 | `TMP/pdf-character-sheet-analysis/pages/page-3.png` |
| Overlay page 3 | `TMP/pdf-character-sheet-analysis/page-3-overlay.png` |
| Координаты page 3 | `TMP/pdf-character-sheet-analysis/page-3-coordinates.json` |
| Typed mapping page 3 | `tides-app/src/lib/pdf/page3Mapping.ts` |

## Сводка полей

- Всего полей: 334
- Page 1: 106 полей (named AcroForm ids: `CharacterName`, `PlayerName`, …)
- Page 2: 14 полей (технические ids `text_*` / `textarea_*`)
- Page 3: 214 полей (заклинания — mapping подтверждён Task 10; экспорт в Task 11)

## Подтверждённый mapping Page 2 (gate Task 05)

Метод: извлечение widget `Rect` через pypdf (low-level `/Annots` на page index 1), сортировка top-to-bottom / left-to-right, визуальная проверка overlay на `page-2.png`. PDF mediabox 612×792 pt; overlay масштабирован к PNG 1275×1650 px.

| Label на PDF | Field id | Page | Метод подтверждения |
| --- | --- | --- | --- |
| ИМЯ ПЕРСОНАЖА | `text_14uqfb` | 2 | overlay + coordinates Rect [45, 720, 247, 743] |
| ВОЗРАСТ | `text_8oymo` | 2 | overlay + coordinates Rect [259, 743, 364, 754] |
| РОСТ | `text_9edkz` | 2 | overlay + coordinates Rect [368, 743, 458, 754] |
| ВЕС | `text_10cjuj` | 2 | overlay + coordinates Rect [463, 743, 553, 754] |
| ГЛАЗА | `text_11lkkm` | 2 | overlay + coordinates Rect [259, 717, 363, 728] |
| КОЖА | `text_12kfvu` | 2 | overlay + coordinates Rect [369, 717, 460, 728] |
| ВОЛОСЫ | `text_13lzpo` | 2 | overlay + coordinates Rect [463, 717, 554, 728] |
| ВНЕШНИЙ ВИД ПЕРСОНАЖА | `textarea_1uxvl` | 2 | overlay + coordinates Rect [31, 466, 195, 681] |
| СОЮЗНИКИ И ОРГАНИЗАЦИИ | `textarea_2fzes` | 2 | overlay + coordinates Rect [215, 465, 396, 680] |
| ПРЕДЫСТОРИЯ ПЕРСОНАЖА | `textarea_3wrh` | 2 | overlay + coordinates Rect [32, 70, 196, 431] |
| ДОПОЛНИТЕЛЬНЫЕ ОСОБЕННОСТИ И УМЕНИЯ | `textarea_4hgfg` | 2 | overlay + coordinates Rect [217, 241, 563, 444] |
| СОКРОВИЩА | `textarea_5wbeq` | 2 | overlay + coordinates Rect [216, 63, 563, 219]; overflow для длинного снаряжения |
| НАЗВАНИЕ | `text_7mg` | 2 | overlay + coordinates Rect [412, 643, 546, 654]; v1 intentionally empty |
| СИМВОЛ | `textarea_6xjig` | 2 | overlay + coordinates Rect [410, 528, 547, 638]; v1 intentionally empty |

### Обязательные labels для v1 (11)

Заполняются в Task 07: имя, возраст, рост, вес, глаза, кожа, волосы, внешний вид, союзники и организации, предыстория, дополнительные особенности и умения.

Не заполняются в v1: СОКРОВИЩА, НАЗВАНИЕ, СИМВОЛ.

## Дублирование CharacterName (page 1 / page 2)

| Поле | Field id | Page | Rect (PDF pt) |
| --- | --- | --- | --- |
| Имя на page 1 | `CharacterName` | 1 | [46.26, 726.17, 214.71, 746.48] |
| Имя на page 2 | `text_14uqfb` | 2 | [45, 720, 247, 743] |

Оба поля визуально соответствуют баннеру «ИМЯ ПЕРСОНАЖА» в шапке соответствующей страницы (overlay + coordinates). Разные AcroForm ids, одна семантика.

**Решение для v1:** заполнять **оба** поля одним значением `promptValues.characterName` при экспорте PDF (см. Task 07).

Не заполняются в v1: НАЗВАНИЕ, СИМВОЛ. СОКРОВИЩА — только overflow снаряжения при превышении лимита `Equipment_VXRI`.

## Page 1 — характеристики и снаряжение (Task 11)

| Label | Field id | Источник |
| --- | --- | --- |
| STR … CHA | `STR`, `DEX`, `CON`, `INT`, `WIS`, `CHA` | `CharacterBuild.abilityScores.total` |
| Модификаторы | `STRmod`, `DEXmod ` (trailing space), `CONmod`, `INTmod`, `WISmod`, `CHamod` | `formatPdfAbilityModifier` (+3, +0, −1) |
| Класс и уровень | `ClassLevel` | `formatClassLevelForPdf(build)` при `wizardCompleted` |
| Умения и способности | `Features and Traits_3R4V` | `formatClassFeaturesForPdf(build)` |
| Снаряжение | `Equipment_VXRI` | `formatInventoryForPdf` |
| Монеты | `CP`, `SP`, `EP`, `GP`, `PP` | `formatCoinsForPdf(build.coins)` |
| Атаки (3 строки) | `Wpn Name`, `Wpn Name 2`, `Wpn Name 3` + bonus/damage | `build.weaponAttacks` |
| Заметки атак/заклинаний | `AttacksSpellcasting_XFCE` | overflow + `attacksSpellcastingNotes` |

## v2 scope — заполняемые поля (Task 12)

При завершённом wizard (`wizardCompleted`) экспорт заполняет:

**Page 1:** `CharacterName`, `PlayerName`, `ClassLevel` (multiclass), `Background`, `Race `, `Alignment`, STR–CHA + модификаторы, HP/AC/Initiative/Speed, навыки и saving throws (checkboxes + бонусы), `ProficienciesLang_OVQQ`, passive perception, `Features and Traits_3R4V`, `Equipment_VXRI`, `CP`–`PP`, 3 weapon rows, `AttacksSpellcasting_XFCE`.

**Page 2:** имя, возраст, рост, вес, глаза, кожа, волосы, внешний вид (с multiclass class label), союзники, предыстория, дополнительные особенности; `TREASURE` — overflow снаряжения.

**Page 3:** spellcasting header (primary caster), слоты 1–9, spell lines + prepared checkboxes; secondary caster stats → `AttacksSpellcasting_XFCE`.

**Не заполняются:** `PersonalityTraits _25LZ`, XP, deity/emblem blocks, page-2 `НАЗВАНИЕ` / `СИМВОЛ` (v1).

## Page 1 — поля релевантные v1 (named ids, без overlay gate)

| Label | Field id | Page | Источник |
| --- | --- | --- | --- |
| ИМЯ ПЕРСОНАЖА | `CharacterName` | 1 | `field_summary.json` + coordinates |
| ИМЯ ИГРОКА | `PlayerName` | 1 | `field_summary.json` |
| КЛАСС И УРОВЕНЬ | `ClassLevel` | 1 | `field_summary.json` |
| ПРЕДЫСТОРИЯ | `Background` | 1 | `field_summary.json` |
| РАСА | `Race ` | 1 | `field_summary.json` (trailing space) |
| ЧЕРТЫ ХАРАКТЕРА | `PersonalityTraits _25LZ` | 1 | `field_summary.json` |

## Подтверждённый mapping Page 3 (gate Task 10)

Метод: pypdf widget `Rect` на page index 2 (0-based), кластеризация по x-колонкам и y-секциям (уровни 0–9), сопоставление prepared checkbox по cx/cy; overlay на `page-3.png` (pdftoppm 150 dpi).

**Единственный spellcasting header** (второго header в PDF нет — secondary caster → spell columns + overflow в `AttacksSpellcasting_XFCE`):

| Семантика | Field id | Метод подтверждения |
| --- | --- | --- |
| Класс заклинателя (primary) | `Spellcasting Class 2` | overlay + Rect [46, 722, 249, 743] |
| Базовая характеристика | `SpellcastingAbility 2` | overlay + Rect [276, 728, 339, 751] |
| Сложность спасброска | `SpellSaveDC  2` | overlay + Rect [374, 728, 437, 751] (два пробела) |
| Бонус атаки заклинанием | `SpellAtkBonus 2` | overlay + Rect [475, 728, 538, 751] |

**Ячейки заклинаний (слоты) — уровни 1–9** (`SlotsTotal N` / `SlotsRemaining N`, N = 18 + level):

| Уровень | SlotsTotal | SlotsRemaining |
| --- | --- | --- |
| 1 | `SlotsTotal 19` | `SlotsRemaining 19` |
| 2 | `SlotsTotal 20` | `SlotsRemaining 20` |
| 3 | `SlotsTotal 21` | `SlotsRemaining 21` |
| 4 | `SlotsTotal 22` | `SlotsRemaining 22` |
| 5 | `SlotsTotal 23` | `SlotsRemaining 23` |
| 6 | `SlotsTotal 24` | `SlotsRemaining 24` |
| 7 | `SlotsTotal 25` | `SlotsRemaining 25` |
| 8 | `SlotsTotal 26` | `SlotsRemaining 26` |
| 9 | `SlotsTotal 27` | `SlotsRemaining 27` |

**Строки заклинаний по уровням** (100 полей `Spells …`, top-to-bottom внутри блока):

| Уровень | Строк | Пример field ids | Prepared checkbox |
| --- | --- | --- | --- |
| 0 (заговоры) | 8 | `Spells 1014`, `Spells 1016` … `Spells 1022` | нет |
| 1 | 12 | `Spells 1015`, `Spells 1023` … `Spells 1033` | `Check Box 251`, `Check Box 309` … |
| 2 | 7 | `Spells 1046`, `Spells 1034` … `Spells 1039` | `Check Box 313`, `Check Box 310` … |
| 3 | 6 | `Spells 1040` … `Spells 1045` | `Check Box 3025` … `Check Box 3030` |
| 4 | 13 | `Spells 1048` … `Spells 1059` | `Check Box 315` … `Check Box 3041` |
| 5 | 13 | `Spells 1061` … `Spells 1072` | `Check Box 317` … `Check Box 3052` |
| 6 | 9 | `Spells 1074` … `Spells 1081` | `Check Box 319` … `Check Box 3059` |
| 7 | 9 | `Spells 1083` … `Spells 1090` | `Check Box 321` … `Check Box 3066` |
| 8 | 9 | `Spells 1092` … `Spells 1099` | `Check Box 323` … `Check Box 3073` |
| 9 | 14 | `Spells 10101` … `Spells 101013` | `Check Box 325` … `Check Box 3083` |

Полные списки — в `page3Mapping.ts` (`PAGE3_SPELL_FIELDS_BY_LEVEL`, `PAGE3_PREPARED_CHECKBOX_BY_SPELL_FIELD`).

**Dual-caster split:** `allocateSpellFieldsPerLevel(primaryCount, secondaryCount, fieldIds)` — primary заполняет первые N строк уровня, secondary — оставшиеся (см. `_plan.md` Pass 1).

## Ограничения v1

- Skills, HP core stats, weapons, spells, coins — заполняются при `wizardCompleted` (Task 11–12).
- Alignment заполняется из prompt (Task 07).
- Кириллица: TTF `public/fonts/NotoSans-Regular.ttf` + `@pdf-lib/fontkit` (Task 06).
