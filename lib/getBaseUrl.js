// lib/getBaseUrl.js
export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return ''; // Navigateur => chemins relatifs
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
}
