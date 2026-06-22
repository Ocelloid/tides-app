import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { TidesApiClient } from "./client.js";
import { loadConfig } from "./config.js";
import { registerCreateCharacterTool } from "./tools/createCharacter.js";
import { registerListCatalogTool } from "./tools/listCatalog.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new TidesApiClient(config.apiUrl, config.apiKey);

  const server = new McpServer({
    name: "tides-character",
    version: "0.1.0",
  });

  registerCreateCharacterTool(server, client);
  registerListCatalogTool(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Fatal MCP server error";
  console.error(`[tides-mcp] ${message}`);
  process.exit(1);
});
