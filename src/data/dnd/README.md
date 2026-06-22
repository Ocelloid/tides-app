# D&D 5e static data (dnd.su)

Статические JSON с умениями классов и заклинаниями для runtime приложения. HTTP-запросы к dnd.su **не выполняются** в runtime — только чтение локальных файлов через `src/lib/character/dndData.ts`.

## Файлы

| Файл | Содержимое |
| --- | --- |
| `classFeatures.json` | Умения PHB core-классов по уровням |
| `spells.json` | Каталог заклинаний (cantrips + уровни) |
| `classSpells.json` | `classId` → уровень заклинания → список id из `spells.json` |

В каждом файле есть `metadata.generatedAt` — дата последней генерации.

## Перегенерация

Из корня `tides-app`:

```bash
pnpm import:dnd-su
```

Скрипт `scripts/import-dnd-su.ts` загружает HTML с [dnd.su](https://dnd.su) для 12 PHB core-классов, парсит таблицу умений и списки заклинаний кастеров (заговоры и 1-й уровень), записывает JSON в эту папку.

Если сайт недоступен или изменилась вёрстка:

```bash
pnpm import:dnd-su -- --fallback
```

`--fallback` записывает минимальный валидный набор (fighter / wizard / cleric + заглушки для остальных классов). Для продакшена предпочтительнее закоммитить успешно сгенерированный JSON после live-импорта.

## Атрибуция

Тексты умений и заклинаний — пользовательский контент dnd.su. В JSON сохраняется `sourceUrl` для ссылок на исходные страницы.

## API (runtime)

```typescript
import {
  getClassFeatures,
  getSpellsForClass,
  getSpellById,
} from "~/lib/character/dndData";

getClassFeatures("fighter", 3);
getSpellsForClass("wizard", 1);
getSpellById("magic-missile");
```
