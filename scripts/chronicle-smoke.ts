import { formatChronicle, generateChronicle, setCount } from "../src/lib/chronicle";

const chronicle = generateChronicle();
const formatted = formatChronicle(chronicle);

if (!formatted.includes("# Внешность персонажа")) {
  throw new Error("Missing appearance section");
}

if (!formatted.includes("# Героическая хроника персонажа")) {
  throw new Error("Missing chronicle section");
}

if (!chronicle.race.entry.name || !chronicle.characterClass.entry.name) {
  throw new Error("Generated chronicle missing race or class");
}

const emptySecrets = setCount(chronicle, "secrets", 0);
const emptyBoth = setCount(emptySecrets, "prophecies", 0);
const emptyFormatted = formatChronicle(emptyBoth);

if (!emptyFormatted.includes("**Таинственные секреты:**\n- Нет.")) {
  throw new Error("Empty secrets should show - Нет.");
}

if (!emptyFormatted.includes("**Пророчества:**\n- Нет.")) {
  throw new Error("Empty prophecies should show - Нет.");
}

console.log("chronicle-smoke: OK");
console.log(`Race: ${chronicle.race.entry.name}, Class: ${chronicle.characterClass.entry.name}`);
