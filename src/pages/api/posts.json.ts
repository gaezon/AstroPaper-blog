import type { APIRoute } from "astro";
import { assertJsonSize, buildAllPostSummaries } from "@/utils/agent-api";

export const GET: APIRoute = async () => {
  const summaries = await buildAllPostSummaries();
  const body = JSON.stringify(summaries, null, 2);
  assertJsonSize("/api/posts.json", body);
  return new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
