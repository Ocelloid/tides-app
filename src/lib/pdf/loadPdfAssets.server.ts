import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import { PDF_FONT_PATH, PDF_TEMPLATE_PATH } from "./assets";
import { PdfFontLoadError, PdfTemplateLoadError } from "./pdfAssetErrors";
import type { LoadedPdfAssets } from "./loadPdfAssetsClient";

export type { LoadedPdfAssets };

let cachedAssets: LoadedPdfAssets | null = null;

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer;
}

function publicAssetPath(publicPath: string): string {
  return publicPath.startsWith("/") ? publicPath.slice(1) : publicPath;
}

/** Server-only PDF asset loader (reads from public/ via fs). */
export async function loadPdfAssets(): Promise<LoadedPdfAssets> {
  if (cachedAssets) {
    return cachedAssets;
  }

  const publicDir = resolve(process.cwd(), "public");
  const templatePath = join(publicDir, publicAssetPath(PDF_TEMPLATE_PATH));
  const fontPath = join(publicDir, publicAssetPath(PDF_FONT_PATH));

  let templateBuf: Buffer;
  try {
    templateBuf = await readFile(templatePath);
  } catch {
    throw new PdfTemplateLoadError(
      `Failed to load PDF template from ${templatePath}`,
    );
  }

  let fontBuf: Buffer;
  try {
    fontBuf = await readFile(fontPath);
  } catch {
    throw new PdfFontLoadError(`Failed to load PDF font from ${fontPath}`);
  }

  cachedAssets = {
    templateBytes: toArrayBuffer(templateBuf),
    fontBytes: toArrayBuffer(fontBuf),
  };

  return cachedAssets;
}
