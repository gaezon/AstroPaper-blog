import type { APIRoute } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { getPath } from "@/utils/getPath";
import { generateOgImageForPost } from "@/utils/generateOgImages";
import { SITE } from "@/config";

export async function getStaticPaths() {
  if (!SITE.dynamicOgImage) {
    return [];
  }

  const posts = await getCollection("blog").then(p =>
    p.filter(({ data }) => !data.draft && !data.ogImage)
  );

  return posts.map(post => ({
    // For catch-all [...slug], Astro expects a string param during build
    params: { slug: getPath(post.id, post.filePath, false) },
    props: post,
  }));
}

export const GET: APIRoute = async ({ props, params }) => {
  if (!SITE.dynamicOgImage) {
    return new Response(null, {
      status: 404,
      statusText: "Not found",
    });
  }

  try {
    let entry: CollectionEntry<"blog"> | undefined = props as
      | CollectionEntry<"blog">
      | undefined;

    // If props not provided (e.g., dev SSR for non-prelisted path), resolve by slug
    if (!entry) {
      const slugStr = Array.isArray(params?.slug)
        ? (params!.slug as string[]).join("/")
        : ((params?.slug as string) ?? "");

      const posts = await getCollection("blog");
      entry = posts.find(p => {
        const path = getPath(p.id, p.filePath, false);
        return !p.data.draft && !p.data.ogImage && path === slugStr;
      }) as CollectionEntry<"blog"> | undefined;
    }

    if (!entry) {
      return new Response(null, { status: 404, statusText: "Not found" });
    }

    const png = await generateOgImageForPost(entry);
    return new Response(png, { headers: { "Content-Type": "image/png" } });
  } catch (e) {
    console.error("OG image route error:", e);
    return new Response(null, {
      status: 500,
      statusText: "OG generation error",
    });
  }
};
