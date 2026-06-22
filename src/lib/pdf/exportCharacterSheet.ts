import fontkit from "@pdf-lib/fontkit";
import { PDFDocument } from "pdf-lib";

import { loadPdfAssetsClient } from "./loadPdfAssetsClient";

export { PdfFontLoadError, PdfTemplateLoadError } from "./pdfAssetErrors";

export type PdfTextFieldValue = {
  kind?: "text";
  fieldId: string;
  value: string;
};

export type PdfCheckboxFieldValue = {
  kind: "checkbox";
  fieldId: string;
  checked: boolean;
};

export type PdfFieldValue = PdfTextFieldValue | PdfCheckboxFieldValue;

export type ExportPdfOptions = {
  fields: PdfFieldValue[];
  /** Preloaded template bytes (Node smoke tests); otherwise loaded via loadPdfAssets. */
  templateBytes?: ArrayBuffer;
  /** Preloaded font bytes (Node smoke tests); otherwise loaded via loadPdfAssets. */
  fontBytes?: ArrayBuffer;
};

export class PdfUnknownFieldError extends Error {
  readonly fieldId: string;

  constructor(fieldId: string) {
    super(`Unknown PDF field id: "${fieldId}"`);
    this.name = "PdfUnknownFieldError";
    this.fieldId = fieldId;
  }
}

function fillField(form: ReturnType<PDFDocument["getForm"]>, field: PdfFieldValue): void {
  if (field.kind === "checkbox") {
    if (!field.checked) {
      return;
    }

    try {
      form.getCheckBox(field.fieldId).check();
    } catch {
      throw new PdfUnknownFieldError(field.fieldId);
    }

    return;
  }

  if (field.value === "") {
    return;
  }

  try {
    form.getTextField(field.fieldId).setText(field.value);
  } catch {
    throw new PdfUnknownFieldError(field.fieldId);
  }
}

/**
 * Fills AcroForm fields in the D&D 5e character sheet template.
 * Uses embedded Cyrillic font + updateFieldAppearances for visible rendering.
 */
export async function fillCharacterSheetPdf(
  options: ExportPdfOptions,
): Promise<Uint8Array> {
  const { fields, templateBytes, fontBytes } = options;

  let resolvedTemplateBytes = templateBytes;
  let resolvedFontBytes = fontBytes;

  if (!resolvedTemplateBytes || !resolvedFontBytes) {
    const loaded = await loadPdfAssetsClient();
    resolvedTemplateBytes = resolvedTemplateBytes ?? loaded.templateBytes;
    resolvedFontBytes = resolvedFontBytes ?? loaded.fontBytes;
  }

  const pdfDoc = await PDFDocument.load(resolvedTemplateBytes);
  pdfDoc.registerFontkit(fontkit);
  const cyrillicFont = await pdfDoc.embedFont(resolvedFontBytes);
  const form = pdfDoc.getForm();

  for (const field of fields) {
    fillField(form, field);
  }

  form.updateFieldAppearances(cyrillicFont);

  return pdfDoc.save();
}
