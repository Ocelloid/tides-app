/**
 * Confirmed Page 2 AcroForm field mapping for DnD5e_character_sheet_RUS.pdf.
 * Gate artifact from Task 05 — do not change field ids without re-running overlay verification.
 *
 * Evidence: TMP/pdf-character-sheet-analysis/page-2-overlay.png
 * Coordinates: TMP/pdf-character-sheet-analysis/page-2-coordinates.json
 */

export type PdfFieldMapping = {
  label: string;
  fieldId: string;
  page: number;
  confirmationMethod: string;
  /** PDF user-space Rect [x0, y0, x1, y1] from widget annotation */
  rectPdf?: [number, number, number, number];
};

/** Semantic keys for Chronicle → PDF mapping (Task 07). */
export const PAGE2_FIELD_MAP = {
  CHARACTER_NAME: {
    label: "ИМЯ ПЕРСОНАЖА",
    fieldId: "text_14uqfb",
    page: 2,
    confirmationMethod:
      "overlay + pypdf widget Rect; top-left name banner under header art",
    rectPdf: [45, 720, 247, 743],
  },
  AGE: {
    label: "ВОЗРАСТ",
    fieldId: "text_8oymo",
    page: 2,
    confirmationMethod:
      "overlay + coordinates; physical traits box row 1 col 1 (top-right header)",
    rectPdf: [259, 743, 364, 754],
  },
  HEIGHT: {
    label: "РОСТ",
    fieldId: "text_9edkz",
    page: 2,
    confirmationMethod:
      "overlay + coordinates; physical traits box row 1 col 2",
    rectPdf: [368, 743, 458, 754],
  },
  WEIGHT: {
    label: "ВЕС",
    fieldId: "text_10cjuj",
    page: 2,
    confirmationMethod:
      "overlay + coordinates; physical traits box row 1 col 3",
    rectPdf: [463, 743, 553, 754],
  },
  EYES: {
    label: "ГЛАЗА",
    fieldId: "text_11lkkm",
    page: 2,
    confirmationMethod:
      "overlay + coordinates; physical traits box row 2 col 1",
    rectPdf: [259, 717, 363, 728],
  },
  SKIN: {
    label: "КОЖА",
    fieldId: "text_12kfvu",
    page: 2,
    confirmationMethod:
      "overlay + coordinates; physical traits box row 2 col 2",
    rectPdf: [369, 717, 460, 728],
  },
  HAIR: {
    label: "ВОЛОСЫ",
    fieldId: "text_13lzpo",
    page: 2,
    confirmationMethod:
      "overlay + coordinates; physical traits box row 2 col 3",
    rectPdf: [463, 717, 554, 728],
  },
  APPEARANCE: {
    label: "ВНЕШНИЙ ВИД ПЕРСОНАЖА",
    fieldId: "textarea_1uxvl",
    page: 2,
    confirmationMethod:
      "overlay + coordinates; large left column box above backstory",
    rectPdf: [31, 466, 195, 681],
  },
  ALLIES_AND_ORGANIZATIONS: {
    label: "СОЮЗНИКИ И ОРГАНИЗАЦИИ",
    fieldId: "textarea_2fzes",
    page: 2,
    confirmationMethod:
      "overlay + coordinates; center column allies text area (distinct from treasure box)",
    rectPdf: [215, 465, 396, 680],
  },
  BACKSTORY: {
    label: "ПРЕДЫСТОРИЯ ПЕРСОНАЖА",
    fieldId: "textarea_3wrh",
    page: 2,
    confirmationMethod:
      "overlay + coordinates; tall left column box below appearance",
    rectPdf: [32, 70, 196, 431],
  },
  ADDITIONAL_FEATURES: {
    label: "ДОПОЛНИТЕЛЬНЫЕ ОСОБЕННОСТИ И УМЕНИЯ",
    fieldId: "textarea_4hgfg",
    page: 2,
    confirmationMethod:
      "overlay + coordinates; right column middle box",
    rectPdf: [217, 241, 563, 444],
  },
  TREASURE: {
    label: "СОКРОВИЩА",
    fieldId: "textarea_5wbeq",
    page: 2,
    confirmationMethod:
      "overlay + coordinates; bottom-right box (v1 intentionally empty)",
    rectPdf: [216, 63, 563, 219],
  },
  ORGANIZATION_NAME: {
    label: "НАЗВАНИЕ",
    fieldId: "text_7mg",
    page: 2,
    confirmationMethod:
      "overlay + coordinates; small field inside allies header (v1 intentionally empty)",
    rectPdf: [412, 643, 546, 654],
  },
  SYMBOL: {
    label: "СИМВОЛ",
    fieldId: "textarea_6xjig",
    page: 2,
    confirmationMethod:
      "overlay + coordinates; symbol square inside allies area (v1 intentionally empty)",
    rectPdf: [410, 528, 547, 638],
  },
} as const satisfies Record<string, PdfFieldMapping>;

/** Page 2 fields present on the sheet but not filled in v1 export (except TREASURE overflow). */
export const PAGE2_V1_EMPTY_FIELD_IDS = [
  PAGE2_FIELD_MAP.ORGANIZATION_NAME.fieldId,
  PAGE2_FIELD_MAP.SYMBOL.fieldId,
] as const;

/** All 14 page-2 widget field ids in confirmed mapping order. */
export const PAGE2_ALL_FIELD_IDS = Object.values(PAGE2_FIELD_MAP).map(
  (m) => m.fieldId,
);
