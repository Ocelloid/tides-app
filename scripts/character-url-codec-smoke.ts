import { computeAbilityScoreState, emptyCharacterBuild } from "../src/lib/character";
import type { CharacterSnapshotInput } from "../src/lib/generator/characterSnapshot";
import {
  CHARACTER_URL_GZIP_PREFIX,
  CHARACTER_URL_JSON_PREFIX,
  encodeCharacterUrl,
  hydrateCharacterUrl,
  isCharacterUrlTooLong,
  snapshotInputToPayload,
} from "../src/lib/generator/characterUrlCodec";

const snapshotInput: CharacterSnapshotInput = {
  characterBuild: {
    ...emptyCharacterBuild(),
    classLevels: [{ classId: "fighter", level: 1 }],
    raceId: "human",
    backgroundId: "acolyte",
    equipmentChoice: "gold" as const,
    coins: { cp: 2, sp: 3, ep: 0, gp: 11, pp: 0 },
    inventory: [{ catalogId: "dagger", nameRu: "Кинжал", quantity: 1, weightLb: 1, source: "shop" as const }],
    purchasedGearIds: ["dagger"],
    backgroundSkillChoices: ["Religion", "Insight"],
    classSkillChoices: ["Athletics", "Intimidation"],
    weaponAttacks: [{ weaponId: "dagger", name: "Кинжал", attackBonus: 5, damage: "1d4+3" }],
    selectedSpells: [],
    abilityScores: computeAbilityScoreState(
      "point-buy",
      { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      "human",
    ),
    wizardCompleted: true,
  },
  chronicle: null,
  characterName: "Тест",
  characterNamePlaceholder: "Безымянный",
  wizardPhase: "done" as const,
  wizardStep: "review" as const,
};
const payload = snapshotInputToPayload(snapshotInput);
const buildRefLength = JSON.stringify(payload.build).length;
if (buildRefLength >= 1000) {
  throw new Error(`BuildRef должен быть < 1KB, получено ${buildRefLength} байт`);
}

const encoded = encodeCharacterUrl(payload);

if (
  !encoded.startsWith(CHARACTER_URL_GZIP_PREFIX) &&
  !encoded.startsWith(CHARACTER_URL_JSON_PREFIX)
) {
  throw new Error(`Неожиданный префикс ссылки: ${encoded}`);
}

if (/[+/=]/.test(encoded)) {
  throw new Error("Строка содержит небезопасные символы base64");
}

if (encoded.length >= 600) {
  throw new Error(`Ожидали короткую ссылку (<600), получили ${encoded.length}`);
}

if (isCharacterUrlTooLong(encoded)) {
  throw new Error("Пустой payload не должен считаться слишком длинным");
}

const { snapshot, warnings } = hydrateCharacterUrl(encoded);
if (warnings.length > 0) {
  throw new Error(`Ожидали пустые warnings, получили: ${warnings.join("; ")}`);
}

if (snapshot.characterBuild.classLevels[0]?.classId !== "fighter") {
  throw new Error("Hydrate не восстановил classLevels");
}

if (snapshot.characterBuild.purchasedGearIds[0] !== "dagger") {
  throw new Error("Hydrate не восстановил purchasedGearIds из inventory");
}

if (!snapshot.characterBuild.abilityScores) {
  throw new Error("Hydrate не восстановил abilityScores");
}

if (
  snapshot.characterBuild.abilityScores.modifier.str !==
  snapshotInput.characterBuild.abilityScores?.modifier.str
) {
  throw new Error("Hydrate восстановил неверные ability modifiers");
}

console.log("character-url-codec-smoke: OK");
console.log(`Prefix: ${encoded.startsWith("c2.") ? "c2" : "c2j"}`);
console.log(`Length: ${encoded.length}`);
