import type { ZodError } from "zod";

export type CharacterApiErrorCode =
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export class CharacterApiError extends Error {
  readonly code: CharacterApiErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    code: CharacterApiErrorCode,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "CharacterApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function formatZodValidationDetails(error: ZodError): {
  fieldErrors: Record<string, string[]>;
  formErrors: string[];
} {
  const flattened = error.flatten();
  return {
    fieldErrors: flattened.fieldErrors as Record<string, string[]>,
    formErrors: flattened.formErrors,
  };
}

export function toCharacterApiErrorResponse(error: CharacterApiError): Response {
  const body: {
    error: {
      code: CharacterApiErrorCode;
      message: string;
      details?: unknown;
    };
  } = {
    error: {
      code: error.code,
      message: error.message,
    },
  };

  if (error.details !== undefined) {
    body.error.details = error.details;
  }

  return Response.json(body, {
    status: error.status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleCharacterApiRoute(
  handler: () => Promise<Response>,
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof CharacterApiError) {
      return toCharacterApiErrorResponse(error);
    }

    console.error("[character-api]", error);
    return toCharacterApiErrorResponse(
      new CharacterApiError("INTERNAL_ERROR", "Internal server error", 500),
    );
  }
}
