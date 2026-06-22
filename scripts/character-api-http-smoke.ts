/**
 * HTTP smoke for Character API routes.
 *
 * Prerequisites:
 * - `pnpm dev` in a separate terminal, or `pnpm build && pnpm start`
 * - `TIDES_API_KEY` in `.env` (or exported in the shell)
 *
 * Usage:
 *   pnpm smoke:character-api:http
 *   BASE_URL=http://localhost:3000 TIDES_API_KEY=... pnpm exec tsx scripts/character-api-http-smoke.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(
  /\/+$/g,
  "",
);
const API_KEY = process.env.TIDES_API_KEY;
const outputDir = resolve(import.meta.dirname, "../tmp");
const pdfPath = resolve(outputDir, "character-api-http-smoke.pdf");

async function main(): Promise<void> {
  if (!API_KEY) {
    console.log(
      "character-api-http-smoke: SKIP — set TIDES_API_KEY (see .env.example)",
    );
    process.exit(0);
  }

  const postRes = await fetch(`${BASE_URL}/api/v1/characters`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (postRes.status !== 200) {
    const text = await postRes.text();
    throw new Error(
      `POST /api/v1/characters failed: ${postRes.status} ${text.slice(0, 500)}`,
    );
  }

  const body = (await postRes.json()) as {
    url?: string;
    snapshot?: { wizardPhase?: string };
    pdf?: { base64?: string } | null;
    warnings?: string[];
  };

  if (!body.url?.includes("?char=")) {
    throw new Error("POST response missing share url with ?char=");
  }

  if (body.snapshot?.wizardPhase !== "done") {
    throw new Error(
      `Expected snapshot.wizardPhase "done", got "${body.snapshot?.wizardPhase ?? "missing"}"`,
    );
  }

  if (!body.pdf?.base64) {
    throw new Error("POST response missing pdf.base64");
  }

  const pdfBytes = Buffer.from(body.pdf.base64, "base64");
  if (pdfBytes.length === 0) {
    throw new Error("Decoded pdf bytes length is 0");
  }

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(pdfPath, pdfBytes);

  const catalogRes = await fetch(`${BASE_URL}/api/v1/catalog`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  if (catalogRes.status !== 200) {
    const text = await catalogRes.text();
    throw new Error(
      `GET /api/v1/catalog failed: ${catalogRes.status} ${text.slice(0, 500)}`,
    );
  }

  const catalog = (await catalogRes.json()) as { classes?: unknown[] };
  if (!catalog.classes?.length) {
    throw new Error("Catalog response missing classes");
  }

  console.log(
    `POST: url ok, pdf=${pdfBytes.length} bytes, warnings=${body.warnings?.length ?? 0}`,
  );
  console.log(`GET catalog: ${catalog.classes.length} classes`);
  console.log(`artifact: ${pdfPath}`);
  console.log("character-api-http-smoke: OK");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
