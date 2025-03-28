import type { APIRoute } from "astro";
import { generateOgImageForSite } from "@/utils/generateOgImages";

// 返回一个简单的响应，显示图像已禁用
export const GET: APIRoute = async () =>
  new Response(await generateOgImageForSite(), {
    headers: { "Content-Type": "image/png" },
  });
