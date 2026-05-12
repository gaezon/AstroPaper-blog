import type { APIRoute } from "astro";
import { assertJsonSize, buildTagsIndex } from "@/utils/agent-api";

export const GET: APIRoute = async () => {
  const tags = await buildTagsIndex();
  const body = JSON.stringify(tags, null, 2);
  assertJsonSize("/api/tags.json", body);
  return new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
