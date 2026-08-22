const previewUrl = process.env.PREVIEW_URL;
const articlePath =
  process.env.ARTICLE_PATH ?? "/posts/upgrade-astropaper-git/";

if (!previewUrl) {
  console.error("PREVIEW_URL is required");
  process.exit(1);
}

const baseUrl = previewUrl.endsWith("/") ? previewUrl : `${previewUrl}/`;
const endpoint = new URL("api/article-views/", baseUrl);
endpoint.searchParams.set("path", articlePath);

async function request(label) {
  const response = await fetch(endpoint);
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();

  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error(
      `${label}: response is not valid JSON (status ${response.status})`
    );
  }

  if (response.status !== 200) {
    throw new Error(`${label}: expected HTTP 200, got ${response.status}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(`${label}: expected JSON content type, got ${contentType}`);
  }

  if (typeof payload.views !== "number") {
    throw new Error(`${label}: expected numeric views in response`);
  }

  return {
    status: response.status,
    cache: response.headers.get("x-vercel-cache"),
    contentType,
    views: payload.views,
  };
}

const first = await request("first request");
const second = await request("second request");

if (second.cache !== "HIT") {
  throw new Error(
    `second request: expected x-vercel-cache: HIT, got ${second.cache ?? "<missing>"}`
  );
}

console.log(
  JSON.stringify(
    {
      endpoint: endpoint.toString(),
      first,
      second,
    },
    null,
    2
  )
);
