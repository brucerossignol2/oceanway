// lib/getBaseUrl.js

// lib/getBaseUrl.js
export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // En client, on utilise le même domaine
    return '';
  }
  // En server, on utilise la variable d’environnement
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}