// lib/getBaseUrl.js

export const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Côté client : on utilise une URL relative
    return '';
  }

  // Côté serveur
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    //return `https://oceanway-bruces-projects-a9d83328.vercel.app`;
  }

  return 'http://localhost:3000';
};
