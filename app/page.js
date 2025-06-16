// app/page.js
"use client"; // Ce composant est un Client Component

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image'; // Importez next/image

export default function HomePage() {
  const [bateaux, setBateaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchBateaux() {
      try {
        const res = await fetch('/api/bateaux');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setBateaux(data);
      } catch (e) {
        console.error("Erreur lors du chargement des bateaux :", e);
        setError("Impossible de charger les bateaux. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    }
    fetchBateaux();
  }, []);

  if (loading) return <div className="text-center py-10">Chargement des bateaux...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900 text-center">Liste des Bateaux</h1>

      <div className="flex justify-end mb-6">
        <Link href="/bateau/nouveau" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200">
          Ajouter un nouveau bateau
        </Link>
      </div>

      {bateaux.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">Aucun bateau enregistré pour le moment. Ajoutez-en un !</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bateaux.map((bateau) => (
            <div key={bateau.id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
              {bateau.imageUrl && (
                <div className="w-full h-48 relative">
                  <Image
                    src={bateau.imageUrl}
                    alt={bateau.nom_bateau || 'Image du bateau'}
                    layout="fill" // Permet à l'image de remplir le conteneur
                    objectFit="cover" // Recadre l'image pour couvrir la zone
                    className="rounded-t-lg"
                    unoptimized // Peut être retiré en production si vous avez configuré un loader d'image externe
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/default.jpg'; }} // Fallback en cas d'erreur
                  />
                </div>
              )}
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">{bateau.nom_bateau}</h2>
                  <p className="text-gray-600 text-lg mb-2">Prix : {bateau.prix_achat.toLocaleString('fr-FR')} €</p>
                  <p className="text-gray-500 text-sm line-clamp-3 mb-4">{bateau.description}</p>
                </div>
                <div className="mt-auto"> {/* Aligner le bouton en bas */}
                  <Link href={`/bateau/${bateau.id}`} className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200">
                    Voir / Modifier
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}