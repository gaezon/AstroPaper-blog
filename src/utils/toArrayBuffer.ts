/**
 * Convert a Uint8Array (or Buffer) view to a standalone ArrayBuffer.
 * Ensures compatibility with Web Response / Blob constructors in SSR.
 */
export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const { buffer, byteOffset, byteLength } = bytes;

  if (buffer instanceof ArrayBuffer) {
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }

  const arrayBuffer = new ArrayBuffer(byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  return arrayBuffer;
}
