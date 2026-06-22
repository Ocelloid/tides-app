import { PDF_FONT_PATH, PDF_TEMPLATE_PATH } from "./assets";

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
