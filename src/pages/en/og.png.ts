import type { APIRoute } from "astro";
import { generateOgImageForSite } from "@/utils/generateOgImages";
import { createOgResponse } from "@/utils/og-response";

export const GET: APIRoute = async () => {
  const image = await generateOgImageForSite();
  return createOgResponse(image);
};
