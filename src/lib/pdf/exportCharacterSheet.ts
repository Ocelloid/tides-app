"use client";

import fontkit from "@pdf-lib/fontkit";
import { PDFDocument } from "pdf-lib";

import { PDF_FONT_PATH, PDF_TEMPLATE_PATH } from "./assets";

export type PdfFieldValue = {
  fieldId: string;
  value: string;
};

export type ExportPdfOptions = {
  fields: PdfFieldValue[];
  /** Preloaded template bytes (Node smoke tests); otherwise fetched from public path. */
  templateBytes?: ArrayBuffer;
  /** Preloaded font bytes (Node smoke tests); otherwise fetched from public path. */
  fontBytes?: ArrayBuffer;
};

export class PdfTemplateLoadError extends Error {
  constructor(message?: string) {
    super(message ?? `Failed to load PDF template from ${PDF_TEMPLATE_PATH}`);
    this.name = "PdfTemplateLoadError";
  }
}

export class PdfFontLoadError extends Error {
  constructor(message?: string) {
    super(message ?? `Failed to load PDF font from ${PDF_FONT_PATH}`);
    this.name = "PdfFontLoadError";
  }
}

export class PdfUnknownFieldError extends Error {
  readonly fieldId: string;

  constructor(fieldId: string) {
    super(`Unknown PDF field id: "${fieldId}"`);
    this.name = "PdfUnknownFieldError";
    this.fieldId = fieldId;
  }
}

let cachedTemplateBytes: ArrayBuffer | null = null;

async function loadTemplateBytes(override?: ArrayBuffer): Promise<ArrayBuffer> {
  if (override) {
    return override;
  }

  if (cachedTemplateBytes) {
    return cachedTemplateBytes;
  }

  const response = await fetch(PDF_TEMPLATE_PATH);
  if (!response.ok) {
    throw new PdfTemplateLoadError(
      `Failed to load PDF template (${response.status} ${response.statusText})`,
    );
  }

  cachedTemplateBytes = await response.arrayBuffer();
  return cachedTemplateBytes;
}

async function loadFontBytes(override?: ArrayBuffer): Promise<ArrayBuffer> {
  if (override) {
    return override;
  }

  const response = await fetch(PDF_FONT_PATH);
  if (!response.ok) {
    throw new PdfFontLoadError(
      `Failed to load PDF font (${response.status} ${response.statusText})`,
    );
  }

  return response.arrayBuffer();
}

/**
 * Fills AcroForm text fields in the D&D 5e character sheet template.
 * Uses embedded Cyrillic font + updateFieldAppearances for visible rendering.
 */
export async function fillCharacterSheetPdf(
  options: ExportPdfOptions,
): Promise<Uint8Array> {
  const { fields, templateBytes, fontBytes } = options;

  const [resolvedTemplateBytes, resolvedFontBytes] = await Promise.all([
    loadTemplateBytes(templateBytes),
    loadFontBytes(fontBytes),
  ]);

  const pdfDoc = await PDFDocument.load(resolvedTemplateBytes);
  pdfDoc.registerFontkit(fontkit);
  const cyrillicFont = await pdfDoc.embedFont(resolvedFontBytes);
  const form = pdfDoc.getForm();

  for (const { fieldId, value } of fields) {
    if (value === "") {
      continue;
    }

    try {
      form.getTextField(fieldId).setText(value);
    } catch {
      throw new PdfUnknownFieldError(fieldId);
    }
  }

  form.updateFieldAppearances(cyrillicFont);

  return pdfDoc.save();
}
