'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { auth } from '../lib/firebase';  // ou le bon chemin relatif vers ton firebase.js

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

  const id = initialBateau?.id || null;

  const totalEquipementDepense = bateau.equipements
    ? bateau.equipements.reduce((sum, eq) => sum + (eq.depense || 0), 0)
    : 0;

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setBateau((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

const handleEquipementChange = (index, field, value) => {
  setBateau((prev) => {
    const newEquipements = [...prev.equipements];
    const eq = { ...newEquipements[index], [field]: value };

    // Convertir les valeurs en nombres
    const prix = Number(eq.prix || 0);
    const quantite = Number(eq.quantite || 0);
    const existe = eq.existe || false;
    const etat = eq.etat || '';

    let coef = 1;

    if (!existe) {
      // équipement absent → achat complet
      coef = 1;
    } else {
      // équipement existant → selon l'état
      switch (etat) {
        case 'a_reviser':
          coef = 0.5;
          break;
        case 'a_changer':
          coef = 1;
          break;
        default: // 'bon' ou autre
          coef = 0;
          break;
      }
    }

    eq.depense = prix * quantite * coef;

    newEquipements[index] = eq;

    return {
      ...prev,
      equipements: newEquipements,
    };
  });
};


  const handleRemoveImage = (imgUrl) => {
    setBateau((prev) => {
      const newImages = prev.images.filter((img) => img !== imgUrl);
      if (selectedMainImage === imgUrl) {
        setSelectedMainImage(newImages[0] || null);
      }
      return {
        ...prev,
        images: newImages,
      };
    });
  };

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

    const newImages = [];
    for (let i = 0; i < files.length; i++) {
      const url = URL.createObjectURL(files[i]);
      newImages.push(url);
    }

    setBateau((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages],
    }));

    if (!selectedMainImage && newImages.length > 0) {
      setSelectedMainImage(newImages[0]);
    }

    setLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);
  setStatusMessage(null);

  console.log('Données envoyées à l’API :', bateau);
  try {
    // Récupération du token Firebase (option 2 : header Authorization)
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Vous devez être connecté.");
    }
    const idToken = await currentUser.getIdToken();

    const method = isNewBateau ? 'POST' : 'PUT';
    const url = isNewBateau ? '/api/bateaux' : `/api/bateaux/${id}`;

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,   // <-- ton jeton ici
      },
      body: JSON.stringify(bateau),
    });

    if (!res.ok) {
      let errMsg;
      try {
        const errorData = await res.json();
        errMsg = errorData.message || JSON.stringify(errorData);
      } catch {
        errMsg = await res.text();
      }
      throw new Error(errMsg || `Erreur serveur ${res.status}`);
    }

    const data = await res.json();
    setStatusMessage({
      type: 'success',
      text: `Bateau ${isNewBateau ? 'créé' : 'mis à jour'} avec succès !`
    });

    if (isNewBateau) {
      setTimeout(() => router.push(`/bateaux/${data.id}`), 2000);
    }
  } catch (e) {
    console.error("Erreur lors de la sauvegarde :", e);
    setError(e.message);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="container mx-auto p-4">
      <Link href="/bateaux" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Retour à la liste</Link>

      <h1 className="text-3xl font-bold mb-4">{isNewBateau ? 'Créer un nouveau bateau' : `Fiche du bateau : ${bateau.nom_bateau}`}</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {statusMessage && <p className={`mb-4 ${statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{statusMessage.text}</p>}

<form onSubmit={handleSubmit}>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {/* Colonne gauche : Infos bateau */}
    <div>
      <div className="mb-4">
        <label htmlFor="nom_bateau" className="block font-semibold mb-1">Nom du bateau</label>
        <input
          type="text"
          id="nom_bateau"
          name="nom_bateau"
          value={bateau.nom_bateau}
          onChange={handleGeneralChange}
          className="border rounded px-2 py-1 w-full"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="prix_achat" className="block font-semibold mb-1">Prix d'achat</label>
        <input
          type="number"
          id="prix_achat"
          name="prix_achat"
          value={bateau.prix_achat}
          onChange={handleGeneralChange}
          className="border rounded px-2 py-1 w-full"
          required
        />
      </div>

      <div className="mb-4">
        <label htmlFor="description" className="block font-semibold mb-1">Description</label>
        <textarea
          id="description"
          name="description"
          value={bateau.description}
          onChange={handleGeneralChange}
          className="border rounded px-2 py-1 w-full"
          rows={4}
        />
      </div>
    </div>

    {/* Colonne droite : Images */}
    <div className="mb-4">
      <label className="block font-semibold mb-2">Images</label>

      {/* Image principale */}
      {selectedMainImage && (
        <div className="mb-4">
          <Image
            src={selectedMainImage}
            alt="Image principale du bateau"
            width={600}
            height={400}
            className="w-full rounded border object-contain"
            priority
          />
        </div>
      )}

      {/* Miniatures cliquables */}
      <div className="flex flex-wrap gap-4 justify-start mb-2">
        {bateau.images.map((imgUrl, i) => (
          <div key={i} className="relative group">
            <Image
              src={imgUrl}
              alt={`Miniature ${i + 1}`}
              width={100}
              height={100}
              className={`rounded border cursor-pointer object-cover w-24 h-24 ${
                selectedMainImage === imgUrl ? 'border-blue-600 ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedMainImage(imgUrl)}
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(imgUrl)}
              className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 text-xs hidden group-hover:block"
              title="Supprimer l'image"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      {/* Bouton ajout images */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        Ajouter des images
      </button>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageUpload}
        ref={fileInputRef}
        className="hidden"
        disabled={loading}
      />
    </div>
</div>

        <div className="mb-4">
          <label className="block font-semibold mb-2">Équipements</label>
{/* Titres des colonnes */}
<div className="grid grid-cols-13 gap-4 font-semibold mb-2">
  <div className="col-span-3 text-center">Nom</div>
<div className="text-center relative flex justify-center items-center">
  Existe
  <div className="ml-2 relative group cursor-pointer text-blue-600">
    <span className="font-bold text-lg select-none">?</span>
    <div className="absolute bottom-full mb-2 w-48 bg-gray-800 text-white text-sm rounded-md p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-10">
      Noter si présent dans le navire, alors pas de dépense supplémentaire.
    </div>
  </div>
</div>
  <div className="col-span-2 text-center relative flex justify-center items-center">
  État
  <div className="ml-2 relative group cursor-pointer text-blue-600">
    <span className="font-bold text-lg select-none">?</span>
    <div className="absolute bottom-full mb-2 w-48 bg-gray-800 text-white text-sm rounded-md p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-10">
      Si l'état est bon, pas de dépense. Si l'état est à réviser, 50% de la valeur sera mis en dépense.
    </div>
  </div>
</div>
  <div className="text-center">Quantité</div>
  <div className="text-center">Prix</div>
  <div className="text-center">Dépense</div>
  <div className="col-span-4 text-center">Remarque</div>
</div>

{/* Équipements */}
{bateau.equipements.map((eq, i) => (
  <div key={i} className="border p-4 rounded mb-4 grid grid-cols-13 gap-4">
    {/* Nom */}
    <input
      type="text"
      placeholder="Nom équipement"
      value={eq.label || ''}
      onChange={(e) => handleEquipementChange(i, 'label', e.target.value)}
      className="border rounded px-2 py-1 w-full col-span-3"
    />

    {/* Existe */}
    <div className="flex justify-center items-center">
      <input
        type="checkbox"
        checked={eq.existe || false}
        onChange={(e) => handleEquipementChange(i, 'existe', e.target.checked)}
        className="form-checkbox h-5 w-5 text-blue-600"
      />
    </div>

    {/* État */}
    <select
      value={eq.etat || ''}
      onChange={(e) => handleEquipementChange(i, 'etat', e.target.value)}
      className={`col-span-2 border rounded px-2 py-1 mb-1 w-full ${
            !eq.existe ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''
      }`}
  disabled={!eq.existe}
    >
      <option value="">--</option>
      <option value="bon">Bon état</option>
      <option value="a_reviser">A réviser</option>
      <option value="a_changer">A changer</option>
    </select>

    {/* Quantité */}
    <input
      type="number"
      placeholder="Qté"
      value={eq.quantite || ''}
      onChange={(e) => handleEquipementChange(i, 'quantite', e.target.value)}
      className="border rounded px-2 py-1 w-full"
    />

    {/* Prix */}
    <input
      type="number"
      placeholder="Prix"
      value={eq.prix || ''}
      onChange={(e) => handleEquipementChange(i, 'prix', e.target.value)}
      className="border rounded px-2 py-1 w-full"
    />

    {/* Dépense */}
    <div className="flex items-center font-medium">{eq.depense || 0} €</div>

    {/* Remarque (sur toute la largeur en dessous) */}
    <input
      type="text"
      placeholder="Remarque"
      value={eq.remarque || ''}
      onChange={(e) => handleEquipementChange(i, 'remarque', e.target.value)}
      className="border rounded px-2 py-1 w-full col-span-4 mt-2"
    />
  </div>
))}



          <button
            type="button"
            onClick={() =>
              setBateau((prev) => ({
                ...prev,
                equipements: [...(prev.equipements || []), { nom: '', prix: 0, quantite: 0, depense: 0 }],
              }))
            }
            className="mt-2 px-3 py-1 bg-green-600 text-white rounded"
          >
            Ajouter un équipement
          </button>
        </div>

        <p className="font-semibold">Total dépenses équipements : {totalEquipementDepense} €</p>

        <button
          type="submit"
          disabled={loading}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {loading ? 'Chargement...' : isNewBateau ? 'Créer' : 'Mettre à jour'}
        </button>
      </form>
    </div>
  );
}
