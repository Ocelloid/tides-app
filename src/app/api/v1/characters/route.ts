import { type NextRequest } from "next/server";

import { env } from "~/env";
import {
  characterCreateRequestSchema,
  createCharacterFromRequest,
} from "~/server/api/character";
import { verifyCharacterApiKey } from "~/server/api/character/auth";
import {
  CharacterApiError,
  formatZodValidationDetails,
  handleCharacterApiRoute,
} from "~/server/api/character/characterApiError";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return handleCharacterApiRoute(async () => {
    verifyCharacterApiKey(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new CharacterApiError("BAD_REQUEST", "Invalid JSON body", 400);
    }

    const parsed = characterCreateRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new CharacterApiError(
        "VALIDATION_ERROR",
        "Request validation failed",
        400,
        formatZodValidationDetails(parsed.error),
      );
    }

    if (!env.TIDES_API_KEY || !env.APP_PUBLIC_URL) {
      throw new CharacterApiError(
        "INTERNAL_ERROR",
        "API not configured",
        503,
      );
    }

    const result = await createCharacterFromRequest(parsed.data, {
      appPublicUrl: env.APP_PUBLIC_URL,
    });

    return Response.json(result, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
}
