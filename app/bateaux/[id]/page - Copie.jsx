'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function FicheBateau({ initialBateau, isNewBateau }) {
  const router = useRouter();
  const [bateau, setBateau] = useState(initialBateau || {
    nom_bateau: '',
    prix_achat: '',
    description: '',
    images: [],
    equipements: [],
  });
  const [selectedMainImage, setSelectedMainImage] = useState(
    initialBateau?.images?.[0] || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Id du bateau dans l'URL ou initialBateau.id
  const id = initialBateau?.id || null;

  // Calcul des dépenses totales équipements
  const totalEquipementDepense = bateau.equipements
    ? bateau.equipements.reduce((sum, eq) => sum + (eq.depense || 0), 0)
    : 0;

  // Gestion des changements généraux (nom, prix, description)
  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setBateau((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gestion des changements d'un équipement
  const handleEquipementChange = (index, field, value) => {
    setBateau((prev) => {
      const newEquipements = [...prev.equipements];
      newEquipements[index] = {
        ...newEquipements[index],
        [field]: value,
      };
      // Recalcul de la dépense (prix * quantité)
      if (field === 'prix' || field === 'quantite') {
        const prix = field === 'prix' ? value : newEquipements[index].prix || 0;
        const quantite = field === 'quantite' ? value : newEquipements[index].quantite || 0;
        newEquipements[index].depense = prix * quantite;
      }
      return {
        ...prev,
        equipements: newEquipements,
      };
    });
  };

  // Suppression d'une image
  const handleRemoveImage = (imgUrl) => {
    setBateau((prev) => {
      const newImages = prev.images.filter((img) => img !== imgUrl);
      // Si l'image supprimée était l'image principale, remettre la première image dispo ou null
      if (selectedMainImage === imgUrl) {
        setSelectedMainImage(newImages[0] || null);
      }
      return {
        ...prev,
        images: newImages,
      };
    });
  };

  // Upload des images (simulation locale)
  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

    // Ici on simule l'upload, on crée des URL locales (à remplacer par vrai upload)
    const newImages = [];
    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      newImages.push(url);
    }

    setBateau((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));

    // Si aucune image principale, on en choisit une
    if (!selectedMainImage && newImages.length > 0) {
      setSelectedMainImage(newImages[0]);
    }

    setLoading(false);
    // Réinitialiser le champ input file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Soumission du formulaire (création ou modification)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      const method = isNewBateau ? 'POST' : 'PUT';
      const url = isNewBateau ? '/api/bateaux' : `/api/bateaux/${id}`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bateau),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Erreur serveur ${res.status}`);
      }

      const data = await res.json();
      setStatusMessage({ type: 'success', text: `Bateau ${isNewBateau ? 'créé' : 'mis à jour'} avec succès !` });

      if (isNewBateau) {
        setTimeout(() => {
          router.push(`/bateaux/${data.id}`);
        }, 2000);
      }
    } catch (e) {
      console.error("Erreur lors de la sauvegarde :", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Supprimer le bateau
  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bateau ? Cette action est irréversible.')) return;
    setLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/bateaux/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Erreur lors de la suppression: ${res.status}`);
      }

      setStatusMessage({ type: 'success', text: 'Bateau supprimé avec succès ! Redirection...' });
      setTimeout(() => router.push('/'), 2000);
    } catch (e) {
      console.error("Erreur lors de la suppression :", e);
      setStatusMessage({ type: 'error', text: `Erreur lors de la suppression: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Effacer le message de statut après un certain temps
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  if (loading) return <p className="text-center text-lg mt-8">Chargement...</p>;
  if (error) return (
    <div className="container mx-auto p-8 bg-white shadow-lg rounded-xl mt-10 text-center">
      <h1 className="text-4xl font-bold mb-4 text-red-600">Erreur : {error}</h1>
      <Link href="/" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
          Retour à la liste
      </Link>
    </div>
  );
  if (!bateau) return null;

  const prixAchat = parseFloat(bateau.prix_achat) || 0;
  const coutTotalPrevu = prixAchat + totalEquipementDepense;

  return (
    <div className="container mx-auto p-4 max-w-4xl bg-white shadow-lg rounded-lg my-8">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            &larr; Retour à la liste
        </Link>

      {statusMessage && (
        <div className={`mb-4 p-3 rounded-md text-center font-medium ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {statusMessage.text}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        {isNewBateau ? 'Ajouter un Nouveau Bateau' : `Fiche de ${bateau.nom_bateau}`}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex flex-col space-y-4">
            <div>
              <label htmlFor="nom_bateau" className="block text-sm font-medium text-gray-700">Nom du Bateau</label>
              <input
                type="text"
                id="nom_bateau"
                name="nom_bateau"
                value={bateau.nom_bateau || ''}
                onChange={handleGeneralChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="prix_achat" className="block text-sm font-medium text-gray-700">Prix d'Achat (€)</label>
              <input
                type="number"
                id="prix_achat"
                name="prix_achat"
                value={bateau.prix_achat || ''}
                onChange={handleGeneralChange}
                step="0.01"
                min="0"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                name="description"
                value={bateau.description || ''}
                onChange={handleGeneralChange}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>

            {selectedMainImage ? (
              <div className="mb-4 relative w-full h-64 rounded-md overflow-hidden border border-gray-300">
                <Image
                  src={selectedMainImage}
                  alt="Image principale du bateau"
                  layout="fill"
                  objectFit="cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(selectedMainImage)}
                  className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                  title="Supprimer l'image"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <p className="italic text-gray-500 mb-4">Aucune image principale sélectionnée</p>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {bateau.images.map((imgUrl, i) => (
                <div
                  key={i}
                  className={`w-20 h-20 rounded overflow-hidden border cursor-pointer relative ${imgUrl === selectedMainImage ? 'border-blue-600 border-4' : 'border-gray-300'}`}
                  onClick={() => setSelectedMainImage(imgUrl)}
                >
                  <Image src={imgUrl} alt={`Image ${i + 1}`} layout="fill" objectFit="cover" />
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.stopPropagation();
                      handleRemoveImage(imgUrl);
                    }}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-bl px-1 text-xs hover:bg-red-700"
                    title="Supprimer cette image"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-600"
            />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 border-b border-gray-300 pb-1">Équipements</h2>

          {bateau.equipements && bateau.equipements.length > 0 ? (
            bateau.equipements.map((eq, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center gap-4 mb-4 p-3 border rounded-md bg-gray-50"
              >
                <input
                  type="text"
                  placeholder="Nom équipement"
                  value={eq.nom || ''}
                  onChange={(e) => handleEquipementChange(idx, 'nom', e.target.value)}
                  className="flex-grow border border-gray-300 rounded p-2"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Prix (€)"
                  value={eq.prix || ''}
                  onChange={(e) => handleEquipementChange(idx, 'prix', parseFloat(e.target.value) || 0)}
                  className="w-24 border border-gray-300 rounded p-2 text-right"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Quantité"
                  value={eq.quantite || ''}
                  onChange={(e) => handleEquipementChange(idx, 'quantite', parseInt(e.target.value) || 0)}
                  className="w-20 border border-gray-300 rounded p-2 text-right"
                />
                <div className="w-32 text-right font-semibold text-gray-700">
                  {eq.depense ? eq.depense.toFixed(2) : '0.00'} €
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Supprimer cet équipement
                    setBateau((prev) => {
                      const newEq = [...prev.equipements];
                      newEq.splice(idx, 1);
                      return { ...prev, equipements: newEq };
                    });
                  }}
                  className="text-red-600 hover:text-red-800 font-bold px-2"
                  title="Supprimer cet équipement"
                >
                  &times;
                </button>
              </div>
            ))
          ) : (
            <p className="italic text-gray-500 mb-4">Aucun équipement ajouté.</p>
          )}

          <button
            type="button"
            onClick={() => {
              setBateau((prev) => ({
                ...prev,
                equipements: [...(prev.equipements || []), { nom: '', prix: 0, quantite: 0, depense: 0 }],
              }));
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Ajouter un équipement
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded text-right font-semibold text-lg">
          <p>Prix d'achat du bateau : {prixAchat.toFixed(2)} €</p>
          <p>Dépenses équipements : {totalEquipementDepense.toFixed(2)} €</p>
          <p className="text-xl border-t border-gray-300 mt-2 pt-2">
            Coût total prévu : {coutTotalPrevu.toFixed(2)} €
          </p>
        </div>

        <div className="flex justify-between mt-8">
          {!isNewBateau && (
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded"
            >
              Supprimer le bateau
            </button>
          )}
          <button
            type="submit"
            className="ml-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
          >
            {isNewBateau ? 'Créer le bateau' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}
