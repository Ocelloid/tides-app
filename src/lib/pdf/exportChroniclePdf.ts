"use client";

import {
  buildPdfFieldValues,
  type PdfExportInput,
} from "./characterSheetFields";
import { fillCharacterSheetPdf } from "./exportCharacterSheet";

export type { PdfExportInput, PdfPromptValues } from "./characterSheetFields";

/**
 * Builds Chronicle → PDF field values and returns a filled character sheet PDF.
 */
export async function exportChroniclePdf(
  input: PdfExportInput,
): Promise<Uint8Array> {
  const fields = buildPdfFieldValues(input);
  return fillCharacterSheetPdf({ fields });
}
