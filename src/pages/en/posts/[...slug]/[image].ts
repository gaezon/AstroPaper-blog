import type { APIRoute } from "astro";
import { generateOgImageForPost } from "@/utils/generateOgImages";
import {
  createLocalizedPostOgResponse,
  getLocalizedPostOgStaticPaths,
} from "@/utils/i18n-api";

export async function getStaticPaths() {
  return getLocalizedPostOgStaticPaths("en");
}

export const GET: APIRoute = async ({ props, params }) => {
  return createLocalizedPostOgResponse(
    "en",
    params,
    props,
    generateOgImageForPost
  );
};
