import type {
  CatalogResponse,
  CharacterCreateRequest,
  CharacterCreateResponse,
} from "~/server/api/character/types";

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export class TidesApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, options?: { status?: number; code?: string }) {
    super(message);
    this.name = "TidesApiError";
    this.status = options?.status;
    this.code = options?.code;
  }
}

function formatApiErrorMessage(
  status: number,
  body: ApiErrorBody | null,
  fallback: string,
): string {
  const code = body?.error?.code;
  const message = body?.error?.message ?? fallback;

  if (status === 401 || code === "UNAUTHORIZED") {
    return "Invalid TIDES_API_KEY. Set in mcp.json env.";
  }

  if (status === 503) {
    return `${message} — verify TIDES_API_KEY and APP_PUBLIC_URL on the deployed app.`;
  }

  if (status === 400 || code === "VALIDATION_ERROR" || code === "BAD_REQUEST") {
    const details = body?.error?.details;
    if (details && typeof details === "object") {
      const flattened = details as {
        fieldErrors?: Record<string, string[]>;
        formErrors?: string[];
      };
      const fieldMessages = Object.entries(flattened.fieldErrors ?? {}).flatMap(
        ([field, errors]) => errors.map((err) => `${field}: ${err}`),
      );
      const formErrors = flattened.formErrors ?? [];
      const combined = [...formErrors, ...fieldMessages];
      if (combined.length > 0) {
        return `${message}\n\nDetails:\n- ${combined.join("\n- ")}`;
      }
    }
    return message;
  }

  return message;
}

async function parseJsonSafe(response: Response): Promise<ApiErrorBody | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as ApiErrorBody;
  } catch {
    return { error: { message: text.slice(0, 500) } };
  }
}

export class TidesApiClient {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
  ) {}

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async createCharacter(
    body: CharacterCreateRequest,
  ): Promise<CharacterCreateResponse> {
    let response: Response;

    try {
      response = await fetch(`${this.apiUrl}/api/v1/characters`, {
        method: "POST",
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      });
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unknown network error";
      throw new TidesApiError(
        `Cannot reach TIDES_API_URL. Check deploy and network.\n\n${detail}`,
      );
    }

    if (!response.ok) {
      const bodyJson = await parseJsonSafe(response);
      throw new TidesApiError(
        formatApiErrorMessage(
          response.status,
          bodyJson,
          `Character API returned ${response.status}`,
        ),
        { status: response.status, code: bodyJson?.error?.code },
      );
    }

    return (await response.json()) as CharacterCreateResponse;
  }

  async listCatalog(query?: {
    classId?: string;
  }): Promise<CatalogResponse> {
    const url = new URL(`${this.apiUrl}/api/v1/catalog`);
    if (query?.classId) {
      url.searchParams.set("classId", query.classId);
    }

    let response: Response;

    try {
      response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Unknown network error";
      throw new TidesApiError(
        `Cannot reach TIDES_API_URL. Check deploy and network.\n\n${detail}`,
      );
    }

    if (!response.ok) {
      const bodyJson = await parseJsonSafe(response);
      throw new TidesApiError(
        formatApiErrorMessage(
          response.status,
          bodyJson,
          `Catalog API returned ${response.status}`,
        ),
        { status: response.status, code: bodyJson?.error?.code },
      );
    }

    return (await response.json()) as CatalogResponse;
  }
}
