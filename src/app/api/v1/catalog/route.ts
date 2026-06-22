import { type NextRequest } from "next/server";

import {
  buildCatalogResponse,
  catalogQuerySchema,
} from "~/server/api/character";
import { verifyCharacterApiKey } from "~/server/api/character/auth";
import {
  CharacterApiError,
  formatZodValidationDetails,
  handleCharacterApiRoute,
} from "~/server/api/character/characterApiError";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return handleCharacterApiRoute(async () => {
    verifyCharacterApiKey(request);

    const classId = request.nextUrl.searchParams.get("classId") ?? undefined;
    const parsed = catalogQuerySchema.safeParse({ classId });
    if (!parsed.success) {
      throw new CharacterApiError(
        "VALIDATION_ERROR",
        "Invalid catalog query parameters",
        400,
        formatZodValidationDetails(parsed.error),
      );
    }

    const catalog = buildCatalogResponse(parsed.data);

    return Response.json(catalog, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, no-store",
      },
    });
  });
}
