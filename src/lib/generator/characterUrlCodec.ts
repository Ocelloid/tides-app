import pako from "pako";

import {
  CHARACTER_BUILD_STEPS,
  type CharacterBuildStep,
} from "~/lib/character";
import {
  chronicleToRef,
  hydrateChronicleFromRef,
  type ChronicleRef,
} from "~/lib/chronicle";
import type {
  CharacterSnapshot,
  CharacterSnapshotInput,
} from "~/lib/generator/characterSnapshot";

import {
  buildToRef,
  hydrateBuildFromRef,
  parseBuildRef,
  type BuildRef,
} from "./characterBuildRef";

export const CHARACTER_URL_VERSION = 2 as const;
export const CHARACTER_URL_GZIP_PREFIX = "c2.";
export const CHARACTER_URL_JSON_PREFIX = "c2j.";
export const CHARACTER_URL_MAX_LENGTH = 2000;

const DECODE_ERROR_MESSAGE = "Некорректная или повреждённая ссылка персонажа";
const DECODE_TRUNCATED_MESSAGE =
  "Ссылка персонажа обрезана — скопируйте её полностью или используйте JSON";
const UNSUPPORTED_VERSION_MESSAGE = "Неподдерживаемая версия ссылки";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export type CharacterUrlPayload = {
  v: typeof CHARACTER_URL_VERSION;
  build: BuildRef;
  chronicle: ChronicleRef | null;
  name: string;
  namePh: string;
  phase: "active" | "done";
  step: CharacterBuildStep;
};

type CharacterUrlPayloadWire = {
  v: typeof CHARACTER_URL_VERSION;
  b: BuildRef;
  c: ChronicleRef | null;
  n: string;
  np: string;
  p: "active" | "done";
  s: CharacterBuildStep;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function bytesToBinaryString(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return binary;
}

function binaryStringToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function encodeBase64Url(bytes: Uint8Array): string {
  const base64 = btoa(bytesToBinaryString(bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9\-_]*$/.test(value)) {
    throw new Error(DECODE_ERROR_MESSAGE);
  }

  const paddingLength = (4 - (value.length % 4)) % 4;
  const normalized = `${value}${"=".repeat(paddingLength)}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  try {
    return binaryStringToBytes(atob(normalized));
  } catch {
    throw new Error(DECODE_ERROR_MESSAGE);
  }
}

function jsonToBytes(value: unknown): Uint8Array {
  return textEncoder.encode(JSON.stringify(value));
}

function bytesToJson(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(textDecoder.decode(bytes)) as unknown;
  } catch {
    throw new Error(DECODE_ERROR_MESSAGE);
  }
}

function parseCharacterUrlPayload(raw: unknown): CharacterUrlPayload {
  if (!isRecord(raw)) {
    throw new Error(DECODE_ERROR_MESSAGE);
  }

  if (raw.v !== CHARACTER_URL_VERSION) {
    throw new Error(UNSUPPORTED_VERSION_MESSAGE);
  }

  if (!("b" in raw) || !("n" in raw) || !("np" in raw) || !("p" in raw) || !("s" in raw)) {
    throw new Error(DECODE_ERROR_MESSAGE);
  }

  const phase = raw.p;
  if (phase !== "active" && phase !== "done") {
    throw new Error(DECODE_ERROR_MESSAGE);
  }

  const step = raw.s;
  if (
    typeof step !== "string" ||
    !CHARACTER_BUILD_STEPS.includes(step as CharacterBuildStep)
  ) {
    throw new Error(DECODE_ERROR_MESSAGE);
  }

  if (typeof raw.n !== "string" || typeof raw.np !== "string") {
    throw new Error(DECODE_ERROR_MESSAGE);
  }

  return {
    v: CHARACTER_URL_VERSION,
    build: parseBuildRef(raw.b),
    chronicle: ("c" in raw ? raw.c : null) as ChronicleRef | null,
    name: raw.n,
    namePh: raw.np,
    phase,
    step: step as CharacterBuildStep,
  };
}

function toWirePayload(payload: CharacterUrlPayload): CharacterUrlPayloadWire {
  return {
    v: payload.v,
    b: payload.build,
    c: payload.chronicle,
    n: payload.name,
    np: payload.namePh,
    p: payload.phase,
    s: payload.step,
  };
}

function encodeRawJsonPayload(payload: CharacterUrlPayload): string {
  return `${CHARACTER_URL_JSON_PREFIX}${encodeBase64Url(jsonToBytes(toWirePayload(payload)))}`;
}

export function encodeCharacterUrl(payload: CharacterUrlPayload): string {
  if (payload.v !== CHARACTER_URL_VERSION) {
    throw new Error(UNSUPPORTED_VERSION_MESSAGE);
  }

  const jsonBytes = jsonToBytes(toWirePayload(payload));

  try {
    return `${CHARACTER_URL_GZIP_PREFIX}${encodeBase64Url(pako.gzip(jsonBytes))}`;
  } catch {
    return encodeRawJsonPayload(payload);
  }
}

function decodeGzipPayload(encodedPayload: string): CharacterUrlPayload {
  try {
    const zippedBytes = decodeBase64Url(encodedPayload);
    const jsonBytes = pako.ungzip(zippedBytes);
    return parseCharacterUrlPayload(bytesToJson(jsonBytes));
  } catch (error) {
    if (error instanceof Error && error.message === UNSUPPORTED_VERSION_MESSAGE) {
      throw error;
    }

    if (
      error instanceof Error &&
      (error.message === DECODE_ERROR_MESSAGE ||
        error.message === DECODE_TRUNCATED_MESSAGE)
    ) {
      throw error;
    }

    // gzip magic bytes present but payload incomplete → truncated share link
    if (encodedPayload.length > 8) {
      try {
        decodeBase64Url(encodedPayload);
        throw new Error(DECODE_TRUNCATED_MESSAGE);
      } catch (inner) {
        if (
          inner instanceof Error &&
          inner.message === DECODE_TRUNCATED_MESSAGE
        ) {
          throw inner;
        }
      }
    }

    throw new Error(DECODE_ERROR_MESSAGE);
  }
}

function decodeRawPayload(encodedPayload: string): CharacterUrlPayload {
  const jsonBytes = decodeBase64Url(encodedPayload);
  return parseCharacterUrlPayload(bytesToJson(jsonBytes));
}

export function decodeCharacterUrl(char: string): CharacterUrlPayload {
  if (typeof char !== "string" || char.trim().length === 0) {
    throw new Error(DECODE_ERROR_MESSAGE);
  }

  if (char.startsWith(CHARACTER_URL_GZIP_PREFIX)) {
    return decodeGzipPayload(char.slice(CHARACTER_URL_GZIP_PREFIX.length));
  }

  if (char.startsWith(CHARACTER_URL_JSON_PREFIX)) {
    return decodeRawPayload(char.slice(CHARACTER_URL_JSON_PREFIX.length));
  }

  throw new Error(DECODE_ERROR_MESSAGE);
}

export function isCharacterUrlTooLong(char: string): boolean {
  return char.length > CHARACTER_URL_MAX_LENGTH;
}

export function payloadToSnapshotInput(payload: CharacterUrlPayload): {
  input: CharacterSnapshotInput;
  warnings: string[];
} {
  const warnings: string[] = [];
  const { build, warnings: buildWarnings } = hydrateBuildFromRef(payload.build);
  warnings.push(...buildWarnings);

  const chronicleResult = payload.chronicle
    ? hydrateChronicleFromRef(payload.chronicle)
    : null;
  if (chronicleResult) {
    warnings.push(...chronicleResult.warnings);
  }

  return {
    input: {
      characterBuild: build,
      chronicle: chronicleResult?.chronicle ?? null,
      characterName: payload.name,
      characterNamePlaceholder: payload.namePh,
      wizardPhase: payload.phase,
      wizardStep: payload.step,
    },
    warnings,
  };
}

export function snapshotInputToPayload(
  input: CharacterSnapshotInput,
): CharacterUrlPayload {
  return {
    v: CHARACTER_URL_VERSION,
    build: buildToRef(input.characterBuild),
    chronicle: input.chronicle ? chronicleToRef(input.chronicle) : null,
    name: input.characterName,
    namePh: input.characterNamePlaceholder,
    phase: input.wizardPhase,
    step: input.wizardStep,
  };
}

export function hydrateCharacterUrl(char: string): {
  snapshot: CharacterSnapshot;
  warnings: string[];
} {
  const payload = decodeCharacterUrl(char);
  const { input, warnings } = payloadToSnapshotInput(payload);

  return {
    snapshot: {
      version: 1,
      exportedAt: new Date().toISOString(),
      ...input,
    },
    warnings,
  };
}
