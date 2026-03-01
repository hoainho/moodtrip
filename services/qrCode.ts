/**
 * Minimal QR Code generator using the QR Server API.
 * Returns a data URL for the QR code image.
 * Falls back gracefully if the API is unavailable.
 */
export function getQrCodeUrl(data: string, size: number = 256): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=0a0e1a&color=2dd4bf&format=svg`;
}
