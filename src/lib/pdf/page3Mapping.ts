/**
 * Confirmed Page 3 AcroForm field mapping for DnD5e_character_sheet_RUS.pdf.
 * Gate artifact from Task 10 — do not change field ids without re-running overlay verification.
 *
 * Evidence: TMP/pdf-character-sheet-analysis/page-3-overlay.png
 * Coordinates: TMP/pdf-character-sheet-analysis/page-3-coordinates.json
 *
 * Layout: single spellcasting header (`Spellcasting Class 2` naming template = primary caster).
 * Dual-caster: primary fills header + first N spell rows per level; secondary uses remainder
 * columns + DC/ability/atk overflow in `AttacksSpellcasting_XFCE` (page 1).
 * Cantrips (level 0) have no prepared checkbox; levels 1–9 have paired Check Box fields.
 */

export const PAGE3_SPELLCASTING_HEADER = {
  className: "Spellcasting Class 2",
  ability: "SpellcastingAbility 2",
  saveDc: "SpellSaveDC  2",
  atkBonus: "SpellAtkBonus 2",
} as const;

/** Spell slot totals/remaining keyed by spell level 1–9. Field suffix 19…27 = 18 + level. */
export const PAGE3_SLOTS_BY_LEVEL: Record<
  number,
  { total: string; remaining: string }
> = {
  1: { total: "SlotsTotal 19", remaining: "SlotsRemaining 19" },
  2: { total: "SlotsTotal 20", remaining: "SlotsRemaining 20" },
  3: { total: "SlotsTotal 21", remaining: "SlotsRemaining 21" },
  4: { total: "SlotsTotal 22", remaining: "SlotsRemaining 22" },
  5: { total: "SlotsTotal 23", remaining: "SlotsRemaining 23" },
  6: { total: "SlotsTotal 24", remaining: "SlotsRemaining 24" },
  7: { total: "SlotsTotal 25", remaining: "SlotsRemaining 25" },
  8: { total: "SlotsTotal 26", remaining: "SlotsRemaining 26" },
  9: { total: "SlotsTotal 27", remaining: "SlotsRemaining 27" },
};

/** Spell name text fields keyed by spell level 0–9, top-to-bottom within each level block. */
export const PAGE3_SPELL_FIELDS_BY_LEVEL: Record<number, string[]> = {
  0: [
  "Spells 1014",
  "Spells 1016",
  "Spells 1017",
  "Spells 1018",
  "Spells 1019",
  "Spells 1020",
  "Spells 1021",
  "Spells 1022"
],
  1: [
  "Spells 1015",
  "Spells 1023",
  "Spells 1024",
  "Spells 1025",
  "Spells 1026",
  "Spells 1027",
  "Spells 1028",
  "Spells 1029",
  "Spells 1030",
  "Spells 1031",
  "Spells 1032",
  "Spells 1033"
],
  2: [
  "Spells 1046",
  "Spells 1034",
  "Spells 1035",
  "Spells 1036",
  "Spells 1037",
  "Spells 1038",
  "Spells 1039"
],
  3: [
  "Spells 1040",
  "Spells 1041",
  "Spells 1042",
  "Spells 1043",
  "Spells 1044",
  "Spells 1045"
],
  4: [
  "Spells 1048",
  "Spells 1047",
  "Spells 1049",
  "Spells 1050",
  "Spells 1051",
  "Spells 1052",
  "Spells 1053",
  "Spells 1054",
  "Spells 1055",
  "Spells 1056",
  "Spells 1057",
  "Spells 1058",
  "Spells 1059"
],
  5: [
  "Spells 1061",
  "Spells 1060",
  "Spells 1062",
  "Spells 1063",
  "Spells 1064",
  "Spells 1065",
  "Spells 1066",
  "Spells 1067",
  "Spells 1068",
  "Spells 1069",
  "Spells 1070",
  "Spells 1071",
  "Spells 1072"
],
  6: [
  "Spells 1074",
  "Spells 1073",
  "Spells 1075",
  "Spells 1076",
  "Spells 1077",
  "Spells 1078",
  "Spells 1079",
  "Spells 1080",
  "Spells 1081"
],
  7: [
  "Spells 1083",
  "Spells 1082",
  "Spells 1084",
  "Spells 1085",
  "Spells 1086",
  "Spells 1087",
  "Spells 1088",
  "Spells 1089",
  "Spells 1090"
],
  8: [
  "Spells 1092",
  "Spells 1091",
  "Spells 1093",
  "Spells 1094",
  "Spells 1095",
  "Spells 1096",
  "Spells 1097",
  "Spells 1098",
  "Spells 1099"
],
  9: [
  "Spells 10101",
  "Spells 10100",
  "Spells 10102",
  "Spells 10103",
  "Spells 10104",
  "Spells 10105",
  "Spells 10106",
  "Spells 10108",
  "Spells 10107",
  "Spells 10109",
  "Spells 101010",
  "Spells 101011",
  "Spells 101012",
  "Spells 101013"
],
};

/** Prepared-spell checkbox for each spell line (levels 1–9 only; cantrips omitted). */
export const PAGE3_PREPARED_CHECKBOX_BY_SPELL_FIELD: Record<string, string> = {
  "Spells 10100": "Check Box 324",
  "Spells 10101": "Check Box 325",
  "Spells 101010": "Check Box 3080",
  "Spells 101011": "Check Box 3081",
  "Spells 101012": "Check Box 3082",
  "Spells 101013": "Check Box 3083",
  "Spells 10102": "Check Box 3074",
  "Spells 10103": "Check Box 3075",
  "Spells 10104": "Check Box 3076",
  "Spells 10105": "Check Box 3077",
  "Spells 10106": "Check Box 3078",
  "Spells 10107": "Check Box 326",
  "Spells 10108": "Check Box 327",
  "Spells 10109": "Check Box 3079",
  "Spells 1015": "Check Box 251",
  "Spells 1023": "Check Box 309",
  "Spells 1024": "Check Box 3010",
  "Spells 1025": "Check Box 3011",
  "Spells 1026": "Check Box 3012",
  "Spells 1027": "Check Box 3013",
  "Spells 1028": "Check Box 3014",
  "Spells 1029": "Check Box 3015",
  "Spells 1030": "Check Box 3016",
  "Spells 1031": "Check Box 3017",
  "Spells 1032": "Check Box 3018",
  "Spells 1033": "Check Box 3019",
  "Spells 1034": "Check Box 310",
  "Spells 1035": "Check Box 3020",
  "Spells 1036": "Check Box 3021",
  "Spells 1037": "Check Box 3022",
  "Spells 1038": "Check Box 3023",
  "Spells 1039": "Check Box 3024",
  "Spells 1040": "Check Box 3025",
  "Spells 1041": "Check Box 3026",
  "Spells 1042": "Check Box 3027",
  "Spells 1043": "Check Box 3028",
  "Spells 1044": "Check Box 3029",
  "Spells 1045": "Check Box 3030",
  "Spells 1046": "Check Box 313",
  "Spells 1047": "Check Box 314",
  "Spells 1048": "Check Box 315",
  "Spells 1049": "Check Box 3031",
  "Spells 1050": "Check Box 3032",
  "Spells 1051": "Check Box 3033",
  "Spells 1052": "Check Box 3034",
  "Spells 1053": "Check Box 3035",
  "Spells 1054": "Check Box 3036",
  "Spells 1055": "Check Box 3037",
  "Spells 1056": "Check Box 3038",
  "Spells 1057": "Check Box 3039",
  "Spells 1058": "Check Box 3040",
  "Spells 1059": "Check Box 3041",
  "Spells 1060": "Check Box 316",
  "Spells 1061": "Check Box 317",
  "Spells 1062": "Check Box 3042",
  "Spells 1063": "Check Box 3043",
  "Spells 1064": "Check Box 3044",
  "Spells 1065": "Check Box 3045",
  "Spells 1066": "Check Box 3046",
  "Spells 1067": "Check Box 3047",
  "Spells 1068": "Check Box 3048",
  "Spells 1069": "Check Box 3049",
  "Spells 1070": "Check Box 3050",
  "Spells 1071": "Check Box 3051",
  "Spells 1072": "Check Box 3052",
  "Spells 1073": "Check Box 318",
  "Spells 1074": "Check Box 319",
  "Spells 1075": "Check Box 3053",
  "Spells 1076": "Check Box 3054",
  "Spells 1077": "Check Box 3055",
  "Spells 1078": "Check Box 3056",
  "Spells 1079": "Check Box 3057",
  "Spells 1080": "Check Box 3058",
  "Spells 1081": "Check Box 3059",
  "Spells 1082": "Check Box 320",
  "Spells 1083": "Check Box 321",
  "Spells 1084": "Check Box 3060",
  "Spells 1085": "Check Box 3061",
  "Spells 1086": "Check Box 3062",
  "Spells 1087": "Check Box 3063",
  "Spells 1088": "Check Box 3064",
  "Spells 1089": "Check Box 3065",
  "Spells 1090": "Check Box 3066",
  "Spells 1091": "Check Box 322",
  "Spells 1092": "Check Box 323",
  "Spells 1093": "Check Box 3067",
  "Spells 1094": "Check Box 3068",
  "Spells 1095": "Check Box 3069",
  "Spells 1096": "Check Box 3070",
  "Spells 1097": "Check Box 3071",
  "Spells 1098": "Check Box 3072",
  "Spells 1099": "Check Box 3073",
};

/** Primary spells fill fields first per level; secondary uses remainder. */
export function allocateSpellFieldsPerLevel(
  primaryCount: number,
  secondaryCount: number,
  fieldIds: string[],
): { primary: string[]; secondary: string[] } {
  const primary = fieldIds.slice(0, primaryCount);
  const secondary = fieldIds.slice(primaryCount, primaryCount + secondaryCount);
  return { primary, secondary };
}

/** All page-3 spell line field ids (100), levels 0–9. */
export const PAGE3_ALL_SPELL_FIELD_IDS = Object.values(
  PAGE3_SPELL_FIELDS_BY_LEVEL,
).flat();
