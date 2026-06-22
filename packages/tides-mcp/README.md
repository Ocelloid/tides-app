# @tides/mcp — Tides Character MCP Server

Stdio MCP server for [Tides of Retribution](https://github.com/) Character API. Exposes tools for Cursor Agent to create D&D 5e characters and browse catalog ids.

## Tools

| Tool | Description |
| --- | --- |
| `tides_create_character` | `POST /api/v1/characters` — random-fill wizard, returns share URL + saves PDF to disk |
| `tides_list_catalog` | `GET /api/v1/catalog` — markdown tables `id \| nameRu` |

## Environment

| Variable | Required | Description |
| --- | --- | --- |
| `TIDES_API_URL` | yes | Deployed app base URL (no trailing slash), e.g. `https://your-app.vercel.app` or `http://localhost:3000` |
| `TIDES_API_KEY` | yes | Same key as server `TIDES_API_KEY`; sent as `Authorization: Bearer …` |

## Build

MCP is **not** part of the Vercel deploy (see root `.vercelignore`). Build locally from this directory:

```bash
cd packages/tides-mcp
pnpm install
pnpm build
```

Output: `dist/index.js` (ESM, Node 20+).

## Cursor MCP config

Add to `~/.cursor/mcp.json` (adjust absolute path):

```json
{
  "mcpServers": {
    "tides-character": {
      "command": "node",
      "args": ["/absolute/path/tides-app/packages/tides-mcp/dist/index.js"],
      "env": {
        "TIDES_API_URL": "https://your-app.vercel.app",
        "TIDES_API_KEY": "your-key"
      }
    }
  }
}
```

For local dev with `pnpm dev`:

```json
{
  "mcpServers": {
    "tides-character": {
      "command": "node",
      "args": ["/absolute/path/tides-app/packages/tides-mcp/dist/index.js"],
      "env": {
        "TIDES_API_URL": "http://localhost:3000",
        "TIDES_API_KEY": "your-local-key-from-.env"
      }
    }
  }
}
```

Restart Cursor after editing `mcp.json`.

## Behavior notes

- **PDF:** By default the tool writes the PDF to `/tmp/tides-character-<timestamp>-<filename>.pdf` (or `savePdfToPath` if provided). Base64 is **not** inlined in the MCP text response unless you need the file path.
- **Empty body `{}`:** Fully random character (same as API).
- **Errors:** Actionable messages for network failures, `401` (bad API key), and validation errors from the API.

## Manual smoke

```bash
# Build first
pnpm build

# Server should stay alive on stdio (no immediate crash)
timeout 2 node dist/index.js || test $? -eq 124
```

With API running and env set, invoke tools from Cursor Agent after registering the server.
