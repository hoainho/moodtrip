import type { ItineraryPlan } from '../types';

/**
 * Compress itinerary to a shareable URL-safe string.
 * Uses JSON → deflate-raw → base64url encoding.
 */
export async function compressItinerary(itinerary: ItineraryPlan): Promise<string> {
  const json = JSON.stringify(itinerary);
  const encoder = new TextEncoder();
  const input = encoder.encode(json);

  // Use CompressionStream API (supported in all modern browsers)
  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(input);
  writer.close();

  const reader = cs.readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const compressed = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    compressed.set(chunk, offset);
    offset += chunk.length;
  }

  // Convert to base64url (URL-safe base64)
  const base64 = btoa(String.fromCharCode(...compressed))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return base64;
}

/**
 * Decompress a URL-safe string back to an ItineraryPlan.
 */
export async function decompressItinerary(encoded: string): Promise<ItineraryPlan> {
  // Restore standard base64 from base64url
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  // Decompress using DecompressionStream
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(bytes);
  writer.close();

  const reader = ds.readable.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);
  const decompressed = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    decompressed.set(chunk, offset);
    offset += chunk.length;
  }

  const decoder = new TextDecoder();
  const json = decoder.decode(decompressed);
  return JSON.parse(json) as ItineraryPlan;
}

/**
 * Generate a shareable URL for an itinerary.
 */
export async function generateShareUrl(itinerary: ItineraryPlan): Promise<string> {
  const compressed = await compressItinerary(itinerary);
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('trip', compressed);
  return url.toString();
}

/**
 * Check if the current URL contains a shared trip.
 */
export function getSharedTripParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('trip');
}
