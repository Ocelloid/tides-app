import { classTable } from "~/lib/chronicle/chronicle";

export const PHB_CORE_CLASS_IDS: readonly string[] = classTable
  .filter((entry) => entry.category === "base" && entry.source === "core")
  .map((entry) => entry.id);

const PHB_CORE_CLASS_ID_SET = new Set<string>(PHB_CORE_CLASS_IDS);

export function isPhbCoreClass(id: string): boolean {
  return PHB_CORE_CLASS_ID_SET.has(id);
}
