import type { APIRoute } from "astro";
import { generateOgImageForSite } from "@/utils/generateOgImages";

// Return the site OG image PNG response
export const GET: APIRoute = async () =>
  new Response(await generateOgImageForSite(), {
    headers: { "Content-Type": "image/png" },
  });
