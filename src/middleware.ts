import { defineMiddleware, sequence } from "astro:middleware";
import { SECURITY_HEADERS } from "./utils/http-headers";

// Dev-only Security Headers & Link Headers for Astro-rendered routes
const devSecurityHeaders = defineMiddleware(async (_context, next) => {
  const response = await next();

  // Append security and discovery headers to the response
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
});

export const onRequest = sequence(
  ...(import.meta.env.DEV ? [devSecurityHeaders] : [])
);
