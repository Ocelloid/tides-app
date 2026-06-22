---
name: tides-character
description: Create D&D 5e characters via Tides of Retribution API. Use when user asks to create/generate a character, heroic chronicle, or character sheet PDF for Tides/Dikogorie.
---

# Tides Character — создание персонажа через API

## When to use

Apply this skill when the user asks to create or generate a Tides of Retribution / Dikogorie character, heroic chronicle, or character sheet PDF.

**Triggers (RU):** «создай персонажа», «сгенерируй персонажа», «героическая хроника», «лист персонажа PDF», «случайный персонаж Tides», «персонаж для Дикогорья».

**Triggers (EN):** «tides character», «create character», «generate character», «heroic chronicle», «character sheet PDF», «random D&D character».

## Prerequisites

One of:

1. **MCP (preferred):** server `tides-character` in `~/.cursor/mcp.json` — see [packages/tides-mcp/README.md](../../../packages/tides-mcp/README.md)
2. **REST fallback:** env `TIDES_API_KEY` + `APP_PUBLIC_URL` (or deployed URL) — see [README.md Character API](../../../README.md#character-api)

If catalog ids are unknown or validation fails, call `tides_list_catalog` (MCP) or `GET /api/v1/catalog` (curl) first.

## Workflow

```
- [ ] 1. Gather minimal inputs (class, race, level, name) — don't over-ask if user already specified
- [ ] 2. Map intent → CharacterCreateRequest JSON (see field mapping)
- [ ] 3. Call API (MCP first, curl fallback)
- [ ] 4. Present results to user
- [ ] 5. Show warnings if any
```

### Step 1 — Inputs

Ask only for missing essentials. Accept partial or empty requests.

- User gave class + level → use `build.classLevels`
- User gave nothing / «случайный» → send `{}`
- Multiclass → multiple entries in `build.classLevels` (e.g. fighter 5 + wizard 3)

### Step 2 — Map to request

Omit fields the user did not specify — the API random-fills in wizard order (class → race → background → abilities → equipment → weapons-magic → review).

Full schema: `src/server/api/character/schemas.ts` and README Character API section — do not duplicate the full schema here.

### Step 3 — Call API

**Primary — MCP tools:**

| Tool | Use |
| --- | --- |
| `tides_list_catalog` | Resolve valid ids before create; optional `section` filter |
| `tides_create_character` | Create character; accepts same JSON as REST body |

Example MCP call body for random character: `{}`

Example partial:

```json
{
  "build": {
    "classLevels": [{ "classId": "fighter", "level": 1 }],
    "raceId": "elf"
  },
  "characterName": "Аэлис"
}
```

**Fallback — curl** (when MCP is not configured):

```bash
export TIDES_API_KEY="your-secret-min-16-chars"
export APP_PUBLIC_URL="http://localhost:3000"

curl -sS -X POST "$APP_PUBLIC_URL/api/v1/characters" \
  -H "Authorization: Bearer $TIDES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' 
```

Auth also accepts `X-API-Key` or `TIDES-API-Key` headers.

For faster response or Vercel Hobby timeouts: `"options": { "includePdf": false }`.

### Step 4 — Present to user

Always deliver:

1. **Share link** — clickable markdown link from `url`
2. **Summary** — key facts from `markdown` or snapshot (name, class, race, level)
3. **PDF** — MCP: path from tool response; curl: decode `pdf.base64` to file and give path

Suggested output template:

```markdown
## [Character name]

**Share:** [Open in Tides](url)

**Class / race / level:** …

### Chronicle excerpt
…from markdown…

**PDF:** `/path/to/file.pdf`
```

### Step 5 — Warnings

If `warnings` is non-empty, list each item for the user.

## Field mapping

| User says | API field |
| --- | --- |
| класс / class / уровень / level | `build.classLevels` — `[{ "classId": "fighter", "level": 1 }]` |
| раса / race | `build.raceId` |
| происхождение / предыстория / background | `build.backgroundId` |
| характеристики / abilities / stats | `build.abilityScores` |
| снаряжение / equipment | `build.equipmentChoice`, `build.inventory` |
| оружие / weapons | `build.weaponAttacks` |
| заклинания / spells | `build.selectedSpells` |
| имя / name | `characterName` |
| пол / gender | `chronicle.gender` |
| возраст / age | `chronicle.age` |
| родина / homeland | `chronicle.homeland` |
| случайный / random / anything unspecified | omit field — API fills randomly |
| полностью случайный персонаж | `{}` |

**Random fill rule:** only include fields the user explicitly requested; everything else is filled by the API in wizard order.

## Examples

**Minimal (fighter 1):**

```json
{ "build": { "classLevels": [{ "classId": "fighter", "level": 1 }] } }
```

**Narrative overrides:**

```json
{
  "characterName": "Борис",
  "build": { "classLevels": [{ "classId": "cleric", "level": 3 }] },
  "chronicle": { "homeland": "…", "gender": "…" }
}
```

**Fully random:**

```json
{}
```

**Multiclass:**

```json
{
  "build": {
    "classLevels": [
      { "classId": "fighter", "level": 5 },
      { "classId": "wizard", "level": 3 }
    ]
  }
}
```

## Edge cases

### MCP not configured

Use curl with `TIDES_API_KEY` and `APP_PUBLIC_URL`. Tell the user MCP can be enabled via [packages/tides-mcp/README.md](../../../packages/tides-mcp/README.md).

### `urlTooLong: true`

Explain the share link may not work in all browsers or messengers. Offer:

- JSON snapshot from response (save to file if helpful)
- PDF file (from MCP path or decoded base64)

### API not configured (503)

Server missing `TIDES_API_KEY` / `APP_PUBLIC_URL`. User must set env vars and restart dev server or redeploy.

### Validation error (400)

Message includes valid ids — call catalog or fix the id and retry.

## References

- REST API & curl: [README.md — Character API](../../../README.md#character-api)
- MCP setup: [packages/tides-mcp/README.md](../../../packages/tides-mcp/README.md)
- Request schema: `src/server/api/character/schemas.ts`
