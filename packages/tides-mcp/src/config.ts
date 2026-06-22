export type TidesMcpConfig = {
  apiUrl: string;
  apiKey: string;
};

function normalizeApiUrl(raw: string): string {
  return raw.replace(/\/+$/g, "");
}

export function loadConfig(): TidesMcpConfig {
  const apiUrl = process.env.TIDES_API_URL?.trim();
  const apiKey = process.env.TIDES_API_KEY?.trim();

  if (!apiUrl) {
    throw new Error(
      "TIDES_API_URL is not set. Add it to mcp.json env (e.g. https://your-app.vercel.app).",
    );
  }

  if (!apiKey) {
    throw new Error(
      "TIDES_API_KEY is not set. Add it to mcp.json env for Bearer authentication.",
    );
  }

  return {
    apiUrl: normalizeApiUrl(apiUrl),
    apiKey,
  };
}
