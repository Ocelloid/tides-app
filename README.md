# Tides of Retribution — генератор персонажа

Веб-приложение на [T3 Stack](https://create.t3.gg/) (Next.js App Router, tRPC, Tailwind) для генерации героической хроники D&D 5e и экспорта заполняемого PDF-листа персонажа на русском языке.

Перенос из Lakebed-капсулы `heroic-chronicle` с client-side PDF export через `pdf-lib` и `@pdf-lib/fontkit`.

## Локальная разработка

Требования: Node.js 20+, [pnpm](https://pnpm.io/) 10.

```bash
cd tides-app
pnpm install
pnpm dev          # http://localhost:3000 — dev server (Turbopack)
pnpm lint         # ESLint
pnpm build        # production build
pnpm start        # production server (после build)
pnpm typecheck    # tsc --noEmit
```

### Smoke-тесты (без UI)

```bash
pnpm exec tsx scripts/chronicle-smoke.ts
pnpm exec tsx scripts/pdf-export-smoke.ts
pnpm exec tsx scripts/chronicle-pdf-export-smoke.ts
pnpm exec tsx scripts/ability-scores-smoke.ts
pnpm smoke:character-api
```

Артефакты PDF сохраняются в `tmp/` (не коммитятся).

## Character API

Серверный HTTP API для программного создания персонажей (без UI). Незаданные поля заполняются случайно по порядку wizard; ответ содержит share-ссылку, JSON snapshot и PDF.

### Переменные окружения

| Переменная | Обязательность | Описание |
| --- | --- | --- |
| `TIDES_API_KEY` | runtime для `/api/v1/*` | Секрет API (мин. 16 символов). Клиент: `Authorization: Bearer …`, `X-API-Key` или `TIDES-API-Key` |
| `APP_PUBLIC_URL` | runtime | Публичный origin для share-ссылки в ответе (напр. `https://your-app.vercel.app`) |

Переменные **optional at build** — без них `pnpm build` проходит; routes возвращают 503 «API not configured».

Скопируйте `.env.example` → `.env` для локальной разработки API.

### Endpoints

- `POST /api/v1/characters` — создать персонаж (body: `CharacterCreateRequest`, все поля optional)
- `GET /api/v1/catalog` — справочники id/nameRu (classes, races, backgrounds, …)

### Примеры curl

```bash
export TIDES_API_KEY="your-secret-min-16-chars"
export APP_PUBLIC_URL="http://localhost:3000"

curl -sS -X POST "$APP_PUBLIC_URL/api/v1/characters" \
  -H "Authorization: Bearer $TIDES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.url, .warnings'

curl -sS "$APP_PUBLIC_URL/api/v1/catalog" \
  -H "Authorization: Bearer $TIDES_API_KEY" | jq '.classes[:3]'

# Без PDF в ответе (быстрее, для Vercel Hobby / таймаутов):
curl -sS -X POST "$APP_PUBLIC_URL/api/v1/characters" \
  -H "Authorization: Bearer $TIDES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"options":{"includePdf":false}}' | jq '.pdf, .snapshot.wizardPhase'
```

### Формат ответа `POST /api/v1/characters`

```json
{
  "url": "https://…/?char=…",
  "urlTooLong": false,
  "snapshot": { "wizardPhase": "done", "characterBuild": { … }, "chronicle": { … } },
  "markdown": "…",
  "pdf": {
    "base64": "…",
    "filename": "…",
    "mimeType": "application/pdf"
  },
  "warnings": []
}
```

- `urlTooLong: true` — query param превышает ~2000 символов; используйте `snapshot` и `pdf` из ответа.
- `options.includePdf: false` — `pdf` будет `null` (рекомендуется на Vercel Hobby при таймаутах server-side PDF).
- `options.seed` — детерминированный random для тестов.

### Smoke-тесты API

```bash
# Pipeline без HTTP (import server module, ~1 min с PDF)
pnpm smoke:character-api

# HTTP против локального сервера (нужен TIDES_API_KEY и запущенный dev/start)
pnpm dev   # в отдельном терминале
pnpm smoke:character-api:http
```

Артефакты: `tmp/character-api-smoke.pdf`, `tmp/character-api-smoke.json`, `tmp/character-api-http-smoke.pdf`.

### Cursor integration

Агент Cursor может создавать персонажей через MCP (primary) или REST API (fallback).

**1. MCP server** — [packages/tides-mcp/README.md](packages/tides-mcp/README.md)

- Собрать: `pnpm --filter @tides/mcp build`
- Добавить в `~/.cursor/mcp.json` сервер `tides-character` (пример в README пакета)
- Tools: `tides_create_character`, `tides_list_catalog`

**2. Agent Skill** — [.cursor/skills/tides-character/SKILL.md](.cursor/skills/tides-character/SKILL.md)

- Подключить в чате: `@tides-character` или прикрепить skill вручную
- Триггеры: «создай персонажа», «tides character», «героическая хроника», «лист персонажа PDF»
- Workflow: map user intent → JSON → MCP/curl → share link + markdown + PDF

**3. REST fallback** (без MCP)

```bash
export TIDES_API_KEY="…"
export APP_PUBLIC_URL="http://localhost:3000"
curl -sS -X POST "$APP_PUBLIC_URL/api/v1/characters" \
  -H "Authorization: Bearer $TIDES_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Полностью случайный персонаж: body `{}`.

## Деплой на Vercel

Секреты и переменные окружения для v1 **не требуются** — генератор и PDF export полностью client-side.

1. Загрузите репозиторий на GitHub (git инициализирован в `tides-app/`).
2. В [Vercel Dashboard](https://vercel.com/new) → **Import Git Repository**.
3. **Root Directory:** `tides-app` (если репозиторий — монорепо/workspace root) или корень, если репозиторий только `tides-app`.
4. **Framework Preset:** Next.js (определяется автоматически).
5. **Build Command:** `pnpm build` (или `next build`).
6. **Install Command:** `pnpm install`.
7. Deploy.

После деплоя проверьте статические ассеты (HTTP 200):

- `/DnD5e_character_sheet_RUS.pdf` (~4.7 MB)
- `/background.jpg`
- `/fonts/NotoSans-Regular.ttf`

## Шрифты и лицензии

| Ассет | Путь | Лицензия |
| --- | --- | --- |
| Noto Sans Regular | `public/fonts/NotoSans-Regular.ttf` | [SIL Open Font License 1.1](https://scripts.sil.org/OFL) |
| PDF-шаблон листа персонажа | `public/DnD5e_character_sheet_RUS.pdf` | Пользовательский шаблон; не распространять без проверки прав |
| Фон UI | `public/background.jpg` | Из Lakebed prototype |

Noto Sans используется для видимой кириллицы в AcroForm полях PDF. Подробности — `src/lib/pdf/assets.ts`.

## Структура

- `src/lib/character/` — модель `CharacterBuild`, характеристики, снаряжение, мост в хронику
- `src/lib/chronicle/` — данные и генератор хроники
- `src/lib/pdf/` — экспорт PDF, маппинг полей, анализ формы
- `src/components/character-creation/` — пошаговый wizard создания персонажа
- `src/components/generator/` — React UI генератора (хроника после wizard)
- `public/` — PDF-шаблон, шрифт, фон

## Создание персонажа (wizard)

Перед генератором хроники отображается шестишаговый wizard:

1. **Класс** — выбор из 12 PHB-классов
2. **Раса** — полный `raceTable` (подрасы, варианты Wildemount)
3. **Происхождение** — 20 PHB/Wildemount предысторий
4. **Характеристики** — point buy (27), standard array или ручной ввод; расовые ASI и flex-бонусы (half-elf)
5. **Снаряжение** — пакет от предыстории или золото (где доступно)
6. **Обзор** — сводка выборов; кнопка **«Создать персонажа»** завершает wizard

После завершения wizard:

- Класс, раса и предыстория фиксируются в хронике (`applyCharacterBuildToChronicle`)
- Характеристики и снаряжение попадают в PDF-лист
- Кнопка **«Сгенерировать»** перебрасывает только narrative-секции, не сбрасывая билд
- Поля класса/расы/предыстории в настройках заблокированы (`SectionControl.locked`)

Состояние wizard хранится только в памяти клиента (перезагрузка страницы сбрасывает прогресс).

Маппинг полей PDF: `src/lib/pdf/pdf-field-analysis.md`.
