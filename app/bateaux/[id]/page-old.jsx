// app/bateaux/[id]/page.jsx
import Link from "next/link";
import FicheBateau from "../../../components/FicheBateau";
import { cookies } from "next/headers"; // Pour accéder au cookie de session côté serveur
import { redirect } from 'next/navigation'; // Pour rediriger en cas de non-authentification

async function getBateau(id) {
  const cookieStore = cookies();
  // CORRECTION CRUCIALE : Lire le cookie 'firebaseIdToken' que nous avons défini
  const firebaseIdToken = cookieStore.get("firebaseIdToken")?.value;

  console.log(`[Server Component] getBateau(${id}): Token firebaseIdToken trouvé: ${firebaseIdToken ? firebaseIdToken.substring(0, 10) + '...' : 'null'}`);

  const headers = {
    'Content-Type': 'application/json',
  };
  if (firebaseIdToken) {
    headers['Authorization'] = `Bearer ${firebaseIdToken}`;
  }

  // La requête vers l'API interne de Next.js
  try {
    const res = await fetch(`http://localhost:3000/api/bateaux/${id}`, {
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
  // Correction: Await params as suggested by the Next.js error
  const { id } = await params; 
  return {
    title: `Bateau ${id}`,
  };
}

export default async function Page({ params }) {
  // Correction: Await params as suggested by the Next.js error
  const { id } = await params; 
  let initialBateau = null;
  let loadingError = false;

  try {
    initialBateau = await getBateau(id);
  } catch (error) {
    console.error("Erreur majeure lors de la récupération du bateau dans Page:", error);
    loadingError = true;
  }

  if (loadingError || !initialBateau) {
    // Si getBateau retourne null, on affiche un message d'erreur.
    // La redirection vers /login est déjà gérée dans getBateau pour les cas d'accès non autorisé.
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h2>
          <p className="text-gray-700 mb-4">
            Impossible de charger les détails du bateau. Cela peut être dû à un ID incorrect,
            des permissions insuffisantes ou un problème de serveur.
          </p>
          <Link href="/bateaux" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Retour à la liste des bateaux
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* initialBateau est maintenant garanti non-null ici */}
      <FicheBateau initialBateau={initialBateau} isNewBateau={false} />
    </div>
  );
}
