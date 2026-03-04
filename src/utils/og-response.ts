import { toArrayBuffer } from "@/utils/toArrayBuffer";

export function createOgResponse(png: Uint8Array | ArrayBuffer) {
  const body: Uint8Array =
    png instanceof Uint8Array ? png : new Uint8Array(png);
  const arrayBuffer = toArrayBuffer(body);
  return new Response(arrayBuffer, {
    headers: { "Content-Type": "image/png" },
  });
}
