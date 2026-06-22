import type { RangeEntry } from "~/lib/chronicle";

export type SelectOption = RangeEntry & {
  name?: string;
  baseClass?: string;
  parentRace?: string;
  region?: string;
  text?: string;
  parents?: string;
  siblingsFormula?: string;
};

export function describeOption(option: SelectOption): string {
  if (option.parents && option.siblingsFormula) {
    return `${option.label} — родителей: ${option.parents}; братьев и сестер: ${option.siblingsFormula}`;
  }

  const title = option.region ?? option.name ?? option.text ?? option.id;
  if (option.name && option.baseClass) {
    return `${option.label} — ${title} (${option.baseClass.toLowerCase()})`;
  }

  return `${option.label} — ${title}`;
}
