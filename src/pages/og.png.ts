import type { APIRoute } from "astro";
import { generateOgImageForSite } from "@/utils/generateOgImages";
import { toArrayBuffer } from "@/utils/toArrayBuffer";

// Return the site OG image PNG response
export const GET: APIRoute = async () => {
  const image = await generateOgImageForSite();
  const body: Uint8Array =
    image instanceof Uint8Array ? image : new Uint8Array(image);
  const arrayBuffer = toArrayBuffer(body);
  return new Response(arrayBuffer, {
    headers: { "Content-Type": "image/png" },
  });
};
