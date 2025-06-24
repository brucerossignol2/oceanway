// app/bateaux/page.jsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // 🔄 Utilisation de onAuthStateChanged
import { getBaseUrl } from '@/lib/getBaseUrl';

export default function BateauxPage() {
  const [bateaux, setBateaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        let token = "";

        if (user) {
          token = await user.getIdToken(); // ✅ Récupération du token après que l'user est bien défini
        }

        const res = await fetch(`${getBaseUrl()}/api/bateaux/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          cache: 'no-store',
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        const bateauxAvecImage = data.map((bateau) => ({
          ...bateau,
          imageUrl: bateau.images?.[0] || "/images/default.jpg",
        }));

        setBateaux(bateauxAvecImage);
      } catch (e) {
        console.error("Erreur lors du chargement des bateaux :", e);
        setError("Impossible de charger les bateaux. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe(); // 🔁 Nettoyage du listener à la sortie
  }, []);

  if (loading)
    return <div className="text-center py-10">Chargement des bateaux...</div>;

  if (error)
    return (
      <div className="text-center py-10 text-red-500">
        {error}
      </div>
    );

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-extrabold mb-8 text-gray-900 text-center">
        Liste des navires
      </h1>
      <div className="flex justify-end mb-6"></div>

      {bateaux.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">
          Aucun bateau enregistré pour le moment. Ajoutez-en un !
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bateaux.map((bateau) => (
            <div
              key={bateau.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col"
            >
              {bateau.imageUrl && (
                <div className="w-full h-48 relative">
                  <Image
                    src={bateau.imageUrl}
                    alt={bateau.nom_bateau || "Image du bateau"}
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-t-lg"
                    unoptimized
                    onError={(e) => {
                      e.target.src = "/images/default.jpg";
                    }}
                  />
                </div>
              )}
              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {bateau.nom_bateau}
                  </h2>
                  <p className="text-gray-600 text-lg mb-2">
                    Prix : {bateau.prix_achat.toLocaleString("fr-FR")} €
                  </p>
                  <p className="text-gray-500 text-sm line-clamp-3 mb-4">
                    {bateau.description}
                  </p>
                </div>
                <div className="mt-auto">
                  <Link
                    href={`/bateaux/${bateau.id}`}
                    className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
                  >
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
