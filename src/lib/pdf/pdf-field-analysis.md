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

## Сводка полей

- Всего полей: 334
- Page 1: 106 полей (named AcroForm ids: `CharacterName`, `PlayerName`, …)
- Page 2: 14 полей (технические ids `text_*` / `textarea_*`)
- Page 3: 214 полей (заклинания — не заполняются в v1)

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
| СОКРОВИЩА | `textarea_5wbeq` | 2 | overlay + coordinates Rect [216, 63, 563, 219]; v1 intentionally empty |
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

## Page 1 — поля релевантные v1 (named ids, без overlay gate)

| Label | Field id | Page | Источник |
| --- | --- | --- | --- |
| ИМЯ ПЕРСОНАЖА | `CharacterName` | 1 | `field_summary.json` + coordinates |
| ИМЯ ИГРОКА | `PlayerName` | 1 | `field_summary.json` |
| КЛАСС И УРОВЕНЬ | `ClassLevel` | 1 | `field_summary.json` |
| ПРЕДЫСТОРИЯ | `Background` | 1 | `field_summary.json` |
| РАСА | `Race ` | 1 | `field_summary.json` (trailing space) |
| ЧЕРТЫ ХАРАКТЕРА | `PersonalityTraits _25LZ` | 1 | `field_summary.json` |

## Ограничения v1

- Page 3 (заклинания) не заполняется.
- Stats, skills, HP, weapons, money, alignment, XP — не заполняются.
- Кириллица: TTF `public/fonts/NotoSans-Regular.ttf` + `@pdf-lib/fontkit` (Task 06).
