import type { APIRoute } from "astro";
import { createLocalizedSiteOgResponse } from "@/utils/i18n-api";

export const GET: APIRoute = async () => {
  return createLocalizedSiteOgResponse("en");
};
