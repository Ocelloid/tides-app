import type { Chronicle } from "~/lib/chronicle";

import { formatClassLabel } from "./characterSheetFields";
import type { PdfPromptValues } from "./characterSheetFields";

/**
 * Безопасная часть имени файла: пробелы → `_`, запрещённые символы → `_`.
 */
export function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .replace(/\.+$/, "");
}

/** @deprecated используй sanitizeFilenamePart */
export function sanitizePdfFilename(characterName: string): string {
  return sanitizeFilenamePart(characterName);
}

/**
 * Имя_персонажа-класс-раса-Имя_игрока.pdf
 * Пустое имя игрока опускается (три сегмента).
 */
export function buildPdfDownloadFilename(
  chronicle: Chronicle,
  promptValues: Pick<PdfPromptValues, "characterName" | "playerName">,
): string {
  const parts = [
    sanitizeFilenamePart(promptValues.characterName),
    sanitizeFilenamePart(formatClassLabel(chronicle)),
    sanitizeFilenamePart(chronicle.race.entry.name),
    sanitizeFilenamePart(promptValues.playerName),
  ].filter((part) => part.length > 0);

  return `${parts.join("-")}.pdf`;
}

/**
 * Triggers a browser download for PDF bytes via a temporary object URL.
 */
export function downloadPdfBytes(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes.slice()], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
