import { PDF_FONT_PATH, PDF_TEMPLATE_PATH } from "./assets";
import { PdfFontLoadError, PdfTemplateLoadError } from "./pdfAssetErrors";

export type LoadedPdfAssets = {
  templateBytes: ArrayBuffer;
  fontBytes: ArrayBuffer;
};

let cachedAssets: LoadedPdfAssets | null = null;

async function loadFromFetch(): Promise<LoadedPdfAssets> {
  const [templateResponse, fontResponse] = await Promise.all([
    fetch(PDF_TEMPLATE_PATH),
    fetch(PDF_FONT_PATH),
  ]);

  if (!templateResponse.ok) {
    throw new PdfTemplateLoadError(
      `Failed to load PDF template (${templateResponse.status} ${templateResponse.statusText})`,
    );
  }

  if (!fontResponse.ok) {
    throw new PdfFontLoadError(
      `Failed to load PDF font (${fontResponse.status} ${fontResponse.statusText})`,
    );
  }

  const [templateBytes, fontBytes] = await Promise.all([
    templateResponse.arrayBuffer(),
    fontResponse.arrayBuffer(),
  ]);

  return { templateBytes, fontBytes };
}

/** Browser-only PDF asset loader (fetch from public paths). */
export async function loadPdfAssetsClient(): Promise<LoadedPdfAssets> {
  if (cachedAssets) {
    return cachedAssets;
  }

  cachedAssets = await loadFromFetch();
  return cachedAssets;
}
