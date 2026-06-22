import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { characterCreateRequestSchema } from "~/server/api/character/schemas";

import type { TidesApiClient } from "../client.js";
import { TidesApiError } from "../client.js";

const SPELL_CATALOG_LIMIT = 50;

const createCharacterToolSchema = characterCreateRequestSchema.extend({
  savePdfToPath: z
    .string()
    .optional()
    .describe(
      "Optional absolute or relative path to save the generated PDF locally.",
    ),
  includePdfInline: z
    .boolean()
    .optional()
    .describe(
      "Include PDF base64 in the tool result (default false — PDF is saved to a file instead).",
    ),
});

type CreateCharacterToolInput = z.infer<typeof createCharacterToolSchema>;

function defaultPdfPath(filename: string): string {
  const stamp = Date.now();
  const safeName = filename.replace(/[^\w.-]+/g, "_");
  return join(tmpdir(), `tides-character-${stamp}-${safeName}`);
}

function ensureParentDir(filePath: string): void {
  mkdirSync(dirname(resolve(filePath)), { recursive: true });
}

function extractSummary(input: CreateCharacterToolInput, response: Awaited<
  ReturnType<TidesApiClient["createCharacter"]>
>): string {
  const build = response.snapshot.characterBuild as {
    classLevels?: Array<{ classId: string; level: number }>;
    raceId?: string;
  };

  const classLabel =
    build.classLevels?.map((entry) => `${entry.classId} ${entry.level}`).join(", ") ??
    "—";
  const raceLabel = build.raceId ?? "—";
  const name =
    input.characterName ??
    response.snapshot.characterName ??
    response.snapshot.characterNamePlaceholder;

  const lines = [
    "## Character created",
    "",
    `| Field | Value |`,
    `| --- | --- |`,
    `| Name | ${name} |`,
    `| Class | ${classLabel} |`,
    `| Race | ${raceLabel} |`,
    `| URL | ${response.url} |`,
  ];

  if (response.urlTooLong) {
    lines.push(
      "",
      "> **Note:** Share URL exceeds browser limits (`urlTooLong: true`). Use JSON snapshot or saved PDF instead.",
    );
  }

  if (response.warnings.length > 0) {
    lines.push("", "### Warnings", ...response.warnings.map((w) => `- ${w}`));
  }

  return lines.join("\n");
}

export function registerCreateCharacterTool(
  server: McpServer,
  client: TidesApiClient,
): void {
  server.registerTool(
    "tides_create_character",
    {
      title: "Create D&D character",
      description:
        "Create a Tides of Retribution character via the Character API. Omitted fields are filled randomly following the wizard order. PDF is saved to a temp file by default.",
      inputSchema: createCharacterToolSchema,
    },
    async (input) => {
      try {
        const { savePdfToPath, includePdfInline, ...request } = input;
        const response = await client.createCharacter(request);

        const lines = [extractSummary(input, response)];
        let savedPdfPath: string | undefined;

        if (response.pdf?.base64) {
          const pdfBytes = Buffer.from(response.pdf.base64, "base64");
          const targetPath = savePdfToPath
            ? resolve(savePdfToPath)
            : defaultPdfPath(response.pdf.filename);

          ensureParentDir(targetPath);
          writeFileSync(targetPath, pdfBytes);
          savedPdfPath = targetPath;

          lines.push("", `**PDF saved:** \`${savedPdfPath}\``);

          if (includePdfInline) {
            lines.push("", "**PDF base64:**", response.pdf.base64);
          }
        } else {
          lines.push(
            "",
            "_No PDF in API response. Set `options.includePdf: true` in the request or enable PDF on the server._",
          );
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (error) {
        const message =
          error instanceof TidesApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Unknown error while creating character";

        return {
          content: [{ type: "text" as const, text: message }],
          isError: true,
        };
      }
    },
  );
}

export { SPELL_CATALOG_LIMIT };
