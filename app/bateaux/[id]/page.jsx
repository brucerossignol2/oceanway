// app/bateaux/[id]/page.jsx
import Link from "next/link";
import FicheBateau from "../../../components/FicheBateau";
import { cookies } from "next/headers"; // Pour accéder au cookie de session côté serveur
import { redirect } from 'next/navigation'; // Pour rediriger en cas de non-authentification

// Fonction utilitaire pour obtenir l'URL de base de l'API en production
function getApiBaseUrl() {
  // En production sur Vercel, process.env.VERCEL_URL contient l'URL du déploiement.
  // En développement local, on utilise http://localhost:3000.
  // Assurez-vous que VERCEL_URL est configuré comme variable d'environnement sur Vercel.
  return process.env.NODE_ENV === 'production'
    ? `https://${process.env.VERCEL_URL}` // Pour Vercel, utilisez l'URL complète
    : 'http://localhost:3000'; // Pour le développement local
}

async function getBateau(id) {
  const cookieStore = await cookies();
  // CORRECTION CRUCIALE : Lire le cookie 'firebaseIdToken' que nous avons défini
  const firebaseIdToken = cookieStore.get("firebaseIdToken")?.value; 

  console.log(`[Server Component] getBateau(${id}): Token firebaseIdToken trouvé: ${firebaseIdToken ? firebaseIdToken.substring(0, 10) + '...' : 'null'}`);

  const headers = {
    'Content-Type': 'application/json',
  };
  if (firebaseIdToken) {
    headers['Authorization'] = `Bearer ${firebaseIdToken}`;
  }

  // Utilisation de l'URL de base dynamique pour l'API interne de Next.js
  const baseUrl = getApiBaseUrl();
  const apiUrl = `${baseUrl}/api/bateaux/${id}`; // Construction de l'URL complète de l'API

  // La requête vers l'API interne de Next.js
  try {
    const res = await fetch(apiUrl, { // Utilisation de l'apiUrl corrigée
      cache: "no-store", // S'assure que la requête n'est pas mise en cache
      headers: headers,
    });

  if (!res.ok) {
    console.error(`[Server Component] Erreur HTTP lors du chargement du bateau ${id}: ${res.status}`);
    // Si non autorisé (401/403) et que ce n'est PAS le bateau d'exemple public (ID '1'),
    // alors on redirige l'utilisateur vers la page de connexion.
    if ((res.status === 401 || res.status === 403) && id !== '1') {
      console.log(`[Server Component] Redirection vers /login pour le bateau ${id} (non-public et non-autorisé).`);
      redirect('/login');
    }
    return null; // Retourne null si la requête échoue ou l'accès est refusé
  }
  return res.json();
    } catch (error) {
    console.error(`[Server Component] Erreur de réseau ou inattendue lors du chargement du bateau ${id}:`, error);
    return null; // Retourne null en cas d'erreur réseau
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Bateau ${id}`,
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  // initialBateau sera null si getBateau a échoué (et potentiellement redirigé)
  const initialBateau = await getBateau(id);

  if (!initialBateau) {
    // Si getBateau retourne null, on affiche un message d'erreur.
    // La redirection vers /login est déjà gérée dans getBateau si nécessaire.
    return <p className="text-center text-lg mt-8 text-red-600">Bateau non trouvé ou accès refusé.</p>;
  }

  return (
    <div>
      {/* Passe l'initialBateau au Client Component FicheBateau */}
      <FicheBateau initialBateau={initialBateau} isNewBateau={false} />
    </div>
  );
}
