import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { CatalogEntry, CatalogResponse } from "~/server/api/character/types";

import type { TidesApiClient } from "../client.js";
import { TidesApiError } from "../client.js";
import { SPELL_CATALOG_LIMIT } from "./createCharacter.js";

const catalogSectionSchema = z
  .enum(["classes", "races", "backgrounds", "spells", "weapons", "all"])
  .optional()
  .describe(
    "Catalog section to return. Default `all` returns classes and races (compact). Use `spells` with optional classId.",
  );

const listCatalogToolSchema = z.object({
  section: catalogSectionSchema,
  classId: z
    .string()
    .optional()
    .describe("Filter spells to those available for this class id."),
});

type CatalogSection = z.infer<typeof catalogSectionSchema>;

function formatTable(title: string, entries: CatalogEntry[], limit?: number): string {
  const rows = limit ? entries.slice(0, limit) : entries;
  const lines = [
    `### ${title}`,
    "",
    "| id | nameRu |",
    "| --- | --- |",
    ...rows.map((entry) => `| ${entry.id} | ${entry.nameRu} |`),
  ];

  if (limit && entries.length > limit) {
    lines.push(
      "",
      `_Showing ${limit} of ${entries.length}. Narrow with section/classId or call again._`,
    );
  }

  return lines.join("\n");
}

function renderSection(
  section: CatalogSection,
  catalog: CatalogResponse,
): string {
  const selected = section ?? "all";

  switch (selected) {
    case "classes":
      return formatTable("Classes", catalog.classes);
    case "races":
      return formatTable("Races", catalog.races);
    case "backgrounds":
      return formatTable("Backgrounds", catalog.backgrounds);
    case "weapons":
      return formatTable("Weapons", catalog.weapons);
    case "spells":
      return formatTable("Spells", catalog.spells, SPELL_CATALOG_LIMIT);
    case "all":
    default:
      return [
        formatTable("Classes", catalog.classes),
        "",
        formatTable("Races", catalog.races),
      ].join("\n");
  }
}

export function registerListCatalogTool(
  server: McpServer,
  client: TidesApiClient,
): void {
  server.registerTool(
    "tides_list_catalog",
    {
      title: "List character catalog ids",
      description:
        "Fetch id → nameRu tables for classes, races, backgrounds, spells, and weapons from the Character API catalog endpoint.",
      inputSchema: listCatalogToolSchema,
    },
    async ({ section, classId }) => {
      try {
        const catalog = await client.listCatalog(
          section === "spells" || classId ? { classId } : undefined,
        );

        const text = [
          "## Tides catalog",
          "",
          renderSection(section, catalog),
        ].join("\n");

        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (error) {
        const message =
          error instanceof TidesApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Unknown error while fetching catalog";

        return {
          content: [{ type: "text" as const, text: message }],
          isError: true,
        };
      }
    },
  );
}
