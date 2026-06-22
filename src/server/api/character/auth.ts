import { createHash, timingSafeEqual } from "crypto";

import { env } from "~/env";

import { CharacterApiError } from "./characterApiError";

function hashKey(key: string): Buffer {
  return createHash("sha256").update(key, "utf8").digest();
}

function keysMatch(provided: string, expected: string): boolean {
  return timingSafeEqual(hashKey(provided), hashKey(expected));
}

function extractApiKey(request: Request): string | null {
  const authorization = request.headers.get("Authorization");
  if (authorization?.startsWith("Bearer ")) {
    const bearerKey = authorization.slice("Bearer ".length).trim();
    if (bearerKey) {
      return bearerKey;
    }
  }

  const xApiKey = request.headers.get("X-API-Key")?.trim();
  if (xApiKey) {
    return xApiKey;
  }

  const tidesApiKey = request.headers.get("TIDES-API-Key")?.trim();
  if (tidesApiKey) {
    return tidesApiKey;
  }

  return null;
}

export function verifyCharacterApiKey(request: Request): void {
  const configuredKey = env.TIDES_API_KEY;
  if (!configuredKey) {
    throw new CharacterApiError(
      "INTERNAL_ERROR",
      "API not configured",
      503,
    );
  }

  const providedKey = extractApiKey(request);
  if (!providedKey || !keysMatch(providedKey, configuredKey)) {
    throw new CharacterApiError(
      "UNAUTHORIZED",
      "Invalid or missing API key",
      401,
    );
  }
}
