import {
  buildPdfFieldValues,
  type PdfExportInput,
} from "./characterSheetFields";
import { fillCharacterSheetPdf } from "./exportCharacterSheet";

export type { PdfExportInput, PdfPromptValues } from "./characterSheetFields";

/**
 * Builds Chronicle → PDF field values and returns a filled character sheet PDF.
 */
export type ExportChroniclePdfOptions = {
  templateBytes?: ArrayBuffer;
  fontBytes?: ArrayBuffer;
};

export async function exportChroniclePdf(
  input: PdfExportInput,
  assets?: ExportChroniclePdfOptions,
): Promise<Uint8Array> {
  const fields = buildPdfFieldValues(input);
  return fillCharacterSheetPdf({
    fields,
    templateBytes: assets?.templateBytes,
    fontBytes: assets?.fontBytes,
  });
}
