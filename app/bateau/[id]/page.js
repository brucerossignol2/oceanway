// app/bateau/[id]/page.js
"use client"; // Ce composant est un Client Component - br-net.fr

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image'; // Importez next/image
import Link from 'next/link';

export default function BateauDetailPage({ params }) {
  const { id } = params;
  const router = useRouter();

  const [formData, setFormData] = useState({
    nom_bateau: '',
    prix_achat: '',
    description: '',
    imageUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewBateau, setIsNewBateau] = useState(id === 'nouveau'); // Vérifie si c'est un nouveau bateau

  useEffect(() => {
    if (!isNewBateau) {
      async function fetchBateau() {
        try {
          const res = await fetch(`/api/bateaux/${id}`);
          if (!res.ok) {
            if (res.status === 404) {
              setError("Bateau non trouvé.");
            } else {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
          } else {
            const data = await res.json();
            setFormData({
              nom_bateau: data.nom_bateau || '',
              prix_achat: data.prix_achat || '',
              description: data.description || '',
              imageUrl: data.imageUrl || '/images/default.jpg',
            });
          }
        } catch (e) {
          console.error("Erreur lors du chargement du bateau :", e);
          setError("Impossible de charger les données du bateau. Veuillez réessayer.");
        } finally {
          setLoading(false);
        }
      }
      fetchBateau();
    } else {
      setLoading(false); // Pas de chargement pour un nouveau bateau
    }
  }, [id, isNewBateau]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const method = isNewBateau ? 'POST' : 'PUT';
    const url = isNewBateau ? '/api/bateaux' : `/api/bateaux/${id}`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Erreur lors de l'opération: ${res.status}`);
      }

      const result = await res.json();
      if (isNewBateau) {
        alert('Bateau créé avec succès !');
        router.push(`/bateau/${result.id}`); // Redirige vers la nouvelle fiche
      } else {
        alert('Bateau enregistré avec succès !');
        router.refresh(); // Rafraîchit la page pour montrer les dernières données
      }
    } catch (e) {
      console.error("Erreur lors de l'envoi du formulaire :", e);
      setError(`Erreur: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!confirm('Êtes-vous sûr de vouloir dupliquer ce bateau ?')) return;
    setLoading(true);
    setError(null);

    try {
      // Préparer les données pour la duplication (sans l'ancien ID)
      const dataToDuplicate = { ...formData, nom_bateau: `${formData.nom_bateau} (Copie)` };
      delete dataToDuplicate.id; // L'ID sera généré par le serveur

      const res = await fetch('/api/bateaux', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToDuplicate),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Erreur lors de la duplication: ${res.status}`);
      }

      const newBateau = await res.json();
      alert('Bateau dupliqué avec succès !');
      router.push(`/bateau/${newBateau.id}`); // Redirige vers la nouvelle fiche dupliquée
    } catch (e) {
      console.error("Erreur lors de la duplication :", e);
      setError(`Erreur lors de la duplication: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce bateau ? Cette action est irréversible.')) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/bateaux/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Erreur lors de la suppression: ${res.status}`);
      }

      alert('Bateau supprimé avec succès !');
      router.push('/'); // Redirige vers la page d'accueil
    } catch (e) {
      console.error("Erreur lors de la suppression :", e);
      setError(`Erreur lors de la suppression: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Chargement de la fiche du bateau...</div>;
  if (error) return (
    <div className="container mx-auto p-8 bg-white shadow-lg rounded-xl mt-10 text-center">
      <h1 className="text-4xl font-bold mb-4 text-red-600">Erreur : {error}</h1>
      {error === "Bateau non trouvé." && (
        <p className="text-lg text-gray-700">Vérifiez que l'ID du voilier dans l'URL est correct.</p>
      )}
      <Link href="/" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
        Retour à la liste
      </Link>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-extrabold mb-6 text-gray-900 text-center">
        {isNewBateau ? 'Nouveau Bateau' : `Fiche de ${formData.nom_bateau}`}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="nom_bateau" className="block text-gray-700 text-lg font-semibold mb-2">Nom du bateau :</label>
            <input
              type="text"
              id="nom_bateau"
              name="nom_bateau"
              value={formData.nom_bateau}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="prix_achat" className="block text-gray-700 text-lg font-semibold mb-2">Prix d'achat (€) :</label>
            <input
              type="number"
              id="prix_achat"
              name="prix_achat"
              value={formData.prix_achat}
              onChange={handleChange}
              required
              min="0"
              step="any"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="description" className="block text-gray-700 text-lg font-semibold mb-2">Description :</label>
          <textarea
            id="description"
            name="description"
            rows="5"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
          ></textarea>
        </div>

        <div className="mb-6">
          <label htmlFor="imageUrl" className="block text-gray-700 text-lg font-semibold mb-2">URL de l'image (optionnel) :</label>
          <input
            type="text"
            id="imageUrl"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            placeholder="/images/bateau_perso.jpg ou une URL complète"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {formData.imageUrl && (
            <div className="mt-4 w-48 h-32 relative mx-auto border border-gray-200 rounded-md overflow-hidden">
              <Image
                src={formData.imageUrl}
                alt="Aperçu de l'image"
                layout="fill"
                objectFit="cover"
                className="rounded-md"
                unoptimized // Pour les URLs externes, vous voudrez peut-être configurer next.config.js
                onError={(e) => { e.target.onerror = null; e.target.src = '/images/default.jpg'; }}
              />
              <p className="text-center text-gray-500 text-sm mt-2">Aperçu</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-8">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {isNewBateau ? 'Créer le bateau' : 'Enregistrer les modifications'}
          </button>

          {!isNewBateau && ( // Ces boutons n'apparaissent que si ce n'est pas un nouveau bateau
            <>
              <button
                type="button"
                onClick={handleDuplicate}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Dupliquer
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                Supprimer
              </button>
            </>
          )}
          <Link href="/" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
            Annuler / Retour
          </Link>
        </div>
      </form>
    </div>
  );
}