/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // MCP package lives in packages/ but is not part of the Next.js app — keep it out of tracing.
  outputFileTracingExcludes: {
    "*": ["./packages/**/*"],
  },
};

export default config;
