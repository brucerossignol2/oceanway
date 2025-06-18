// app/bateau/[id]/page.js
"use client"; // Ce composant est un Client Component

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function BateauDetailPage({ params }) {
  const { id } = params;
  const router = useRouter();

  const isNewBateau = id === 'nouveau';

  const [bateau, setBateau] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null); // Nouveau state pour le message de statut

  const [totalEquipementDepense, setTotalEquipementDepense] = useState(0);
  const [selectedMainImage, setSelectedMainImage] = useState('');
  const fileInputRef = useRef(null);

  // Fonction utilitaire pour initialiser les équipements par défaut
  const getDefaultEquipements = useCallback(() => [
    { label: 'Guindeau', existe: false, etat: 'bon', quantite: 1, prix: 0, depense: 0, remarque: '' },
    { label: 'Batterie moteur', existe: false, etat: 'bon', quantite: 1, prix: 0, depense: 0, remarque: '' },
  ], []);

  // Fonction pour calculer la dépense d'un équipement
  const calculateDepense = useCallback((equip) => {
    let total = 0;
    const quantite = parseFloat(equip.quantite);
    const prix = parseFloat(equip.prix);

    if (isNaN(quantite) || quantite < 0 || isNaN(prix) || prix < 0) {
      return 0;
    }

    if (!equip.existe) {
      total = quantite * prix;
    } else {
      let coef = 0;
      switch (equip.etat) {
        case 'a_reviser': coef = 0.5; break;
        case 'a_changer': coef = 1; break;
        default: coef = 0;
      }
      total = coef * quantite * prix;
    }
    return total;
  }, []);

  // Fonction pour mettre à jour un équipement spécifique dans l'état local du bateau
  const handleEquipementChange = useCallback((index, field, value) => {
    setBateau(prevBateau => {
      if (!prevBateau) return null;

      const updatedEquipements = prevBateau.equipements.map((equip, i) => {
        if (i === index) {
          const newEquip = { ...equip, [field]: value };
          newEquip.depense = calculateDepense(newEquip);
          return newEquip;
        }
        return equip;
      });

      const newTotalDepense = updatedEquipements.reduce((sum, equip) => sum + equip.depense, 0);
      setTotalEquipementDepense(newTotalDepense);

      return { ...prevBateau, equipements: updatedEquipements };
    });
  }, [calculateDepense]);

  // useEffect pour charger les données ou initialiser pour un nouveau bateau
  useEffect(() => {
    if (isNewBateau) {
      setBateau({
        id: 'nouveau',
        nom_bateau: '',
        prix_achat: 0,
        description: '',
        images: [],
        equipements: getDefaultEquipements(),
      });
      setLoading(false);
    } else {
      async function fetchBateau() {
        try {
          const res = await fetch(`/api/bateaux/${id}`);
          if (!res.ok) {
            if (res.status === 404) { setError("Bateau non trouvé."); }
            else { throw new Error(`Erreur HTTP! statut: ${res.status}`); }
          }
          let data = await res.json();
          if (!data.equipements || !Array.isArray(data.equipements) || data.equipements.length === 0) {
            data.equipements = getDefaultEquipements();
          } else {
            data.equipements = data.equipements.map(equip => ({ ...equip, depense: calculateDepense(equip) }));
          }
          if (!data.images || !Array.isArray(data.images)) {
              data.images = data.imageUrl ? [data.imageUrl] : [];
          }
          setBateau(data);
          setTotalEquipementDepense(data.equipements.reduce((sum, equip) => sum + equip.depense, 0));
          if (data.images && data.images.length > 0) {
            setSelectedMainImage(data.images[0]);
          } else {
            setSelectedMainImage('/images/default.jpg');
          }

        } catch (e) {
          console.error("Erreur lors du chargement du bateau :", e);
          setError("Impossible de charger les données du bateau. Veuillez réessayer.");
        } finally {
          setLoading(false);
        }
      }
      fetchBateau();
    }
  }, [id, isNewBateau, calculateDepense, getDefaultEquipements]);

  // Gestionnaire de changement pour les champs de base (nom, prix, description)
  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setBateau(prev => ({ ...prev, [name]: value }));
  };

  // Gestionnaire de téléchargement d'images
  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);
    setStatusMessage(null); // Effacer les messages précédents

    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Erreur lors du téléchargement: ${res.status}`);
      }

      const { urls } = await res.json();
      setBateau(prev => {
        const updatedImages = [...(prev.images || []), ...urls];
        if (updatedImages.length > 0 && !selectedMainImage) {
            setSelectedMainImage(updatedImages[0]);
        }
        return { ...prev, images: updatedImages };
      });
      setStatusMessage({ type: 'success', text: 'Images téléchargées avec succès !' }); // Définir le message de succès

    } catch (e) {
      console.error("Erreur lors du téléchargement des images :", e);
      setStatusMessage({ type: 'error', text: `Erreur de téléchargement: ${e.message}` }); // Définir le message d'erreur
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Fonction pour supprimer une image de la galerie
  const handleRemoveImage = (urlToRemove) => {
    setBateau(prev => {
      if (!prev) return null;
      const updatedImages = prev.images.filter(url => url !== urlToRemove);

      if (selectedMainImage === urlToRemove) {
        setSelectedMainImage(updatedImages.length > 0 ? updatedImages[0] : '/images/default.jpg');
      }
      return { ...prev, images: updatedImages };
    });
  };

  // Soumission du formulaire (Création ou Mise à jour)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatusMessage(null); // Effacer les messages précédents

    const method = isNewBateau ? 'POST' : 'PUT';
    const url = isNewBateau ? '/api/bateaux' : `/api/bateaux/${id}`;

    const bateauToSend = {
        ...bateau,
        prix_achat: parseFloat(bateau.prix_achat) || 0,
        equipements: bateau.equipements.map(equip => ({
            ...equip,
            quantite: parseInt(equip.quantite) >= 0 ? parseInt(equip.quantite) : 0,
            prix: parseInt(equip.prix) >= 0 ? parseInt(equip.prix) : 0,
            depense: undefined
        })),
        images: bateau.images || []
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bateauToSend),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Erreur HTTP! statut: ${res.status}`);
      }

      const result = await res.json();
      if (isNewBateau) {
        setStatusMessage({ type: 'success', text: 'Bateau créé avec succès ! Redirection...' });
        setTimeout(() => router.push(`/bateau/${result.id}`), 2000); // Redirige après 2 secondes
      } else {
        setStatusMessage({ type: 'success', text: 'Bateau enregistré avec succès !' });
      }
    } catch (e) {
      console.error("Erreur lors de l'opération :", e);
      setStatusMessage({ type: 'error', text: `Erreur: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Dupliquer le bateau
  const handleDuplicate = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir dupliquer ce bateau ?')) return;
    setLoading(true);
    setError(null);
    setStatusMessage(null); // Effacer les messages précédents

    try {
      const dataToDuplicate = {
        ...bateau,
        nom_bateau: `${bateau.nom_bateau} (Copie)`,
        id: undefined,
      };

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
      setStatusMessage({ type: 'success', text: 'Bateau dupliqué avec succès ! Redirection...' });
      setTimeout(() => router.push(`/bateau/${newBateau.id}`), 2000);
    } catch (e) {
      console.error("Erreur lors de la duplication :", e);
      setStatusMessage({ type: 'error', text: `Erreur lors de la duplication: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  // Supprimer le bateau
  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bateau ? Cette action est irréversible.')) return;
    setLoading(true);
    setError(null);
    setStatusMessage(null); // Effacer les messages précédents

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
      }, 5000); // Message disparaît après 5 secondes
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
      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Retour à la liste</Link>
      {/* Zone de message de statut déplacée ici */}
      {statusMessage && (
        <div className={`mb-4 p-3 rounded-md text-center font-medium ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {statusMessage.text}
        </div>
      )}
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        {isNewBateau ? 'Ajouter un Nouveau Bateau' : `Fiche de ${bateau.nom_bateau}`}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grille principale pour les deux colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Colonne de gauche: Infos Générales */}
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex-grow">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                name="description"
                value={bateau.description || ''}
                onChange={handleGeneralChange}
                rows="5"
                className="mt-1 block w-full h-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              ></textarea>
            </div>
          </div>

          {/* Colonne de droite: Gestion des Images */}
          <div className="flex flex-col space-y-4">
            <div className="flex-shrink-0 mb-4 text-center">
              <label htmlFor="imageUrlInput" className="block text-sm font-medium text-gray-700 mb-2">Image Principale Actuelle</label>
              {selectedMainImage ? (
                <Image
                  src={selectedMainImage}
                  alt="Image principale du bateau"
                  width={600}
                  height={400}
                  style={{ objectFit: 'contain' }}
                  className="rounded-lg shadow-md mx-auto border border-gray-300 w-full h-auto max-h-96"
                  onError={(e) => { e.target.onerror = null; e.target.src = '/images/default.jpg'; setSelectedMainImage('/images/default.jpg'); }}
                  unoptimized
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg text-gray-500 border border-gray-300 mx-auto">
                  Aucune image principale sélectionnée.
                </div>
              )}
            </div>

            {bateau.images && bateau.images.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mt-4 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-md bg-white">
                {bateau.images.map((imgUrl, index) => (
                  <div key={index} className="relative group">
                    <Image
                      src={imgUrl}
                      alt={`Miniature ${index + 1}`}
                      width={80}
                      height={60}
                      objectFit="cover"
                      className={`rounded-md border-2 cursor-pointer ${selectedMainImage === imgUrl ? 'border-blue-500' : 'border-gray-300'} group-hover:border-blue-400 transition`}
                      onClick={() => setSelectedMainImage(imgUrl)}
                      onError={(e) => { e.target.onerror = null; e.target.src = '/images/default.jpg'; }}
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(imgUrl)}
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Supprimer cette image"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="hidden"
                id="image-upload-input"
              />
              <label
                htmlFor="image-upload-input"
                className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 cursor-pointer transition-colors duration-200 inline-flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                Sélectionner et Télécharger des Images
              </label>
              {loading && <p className="text-sm text-gray-600 mt-2">Téléchargement en cours...</p>}
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
               <p className="text-xs text-gray-500 mt-2">
                  Note : Les images seront stockées localement sur le serveur de développement. Pour la production, une solution de stockage cloud est recommandée.
              </p>
            </div>
          </div>
        </div>

        {/* Section Tableau des Équipements */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Équipements du Navire</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Équipement</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Existe</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">État</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantité</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix (€)</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dépense (€)</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarque</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bateau.equipements.map((equip, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{equip.label}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      <input
                        type="checkbox"
                        checked={equip.existe}
                        onChange={(e) => handleEquipementChange(index, 'existe', e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      <select
                        value={equip.etat}
                        onChange={(e) => handleEquipementChange(index, 'etat', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="bon">Bon</option>
                        <option value="a_reviser">À réviser</option>
                        <option value="a_changer">À changer</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      <input
                        type="number"
                        min="0"
                        value={equip.quantite}
                        onChange={(e) => handleEquipementChange(index, 'quantite', parseInt(e.target.value) || 0)}
                        className="block w-20 border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      <input
                        type="number"
                        min="0"
                        value={equip.prix}
                        onChange={(e) => handleEquipementChange(index, 'prix', parseInt(e.target.value) || 0)}
                        className="block w-24 border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 font-bold">
                      {new Intl.NumberFormat('fr-FR').format(equip.depense)} €
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      <input
                        type="text"
                        value={equip.remarque}
                        onChange={(e) => handleEquipementChange(index, 'remarque', e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-right text-lg font-bold text-gray-800">
            Total Dépenses Équipements : {new Intl.NumberFormat('fr-FR').format(totalEquipementDepense)} €
          </div>
        </div>

        {/* Total général (bateau + dépenses équipements) */}
        <div className="text-3xl font-extrabold text-gray-900 text-center md:text-left mt-8 pt-4 border-t border-gray-200">
            Coût Total Prévu : <span className="text-red-700">{new Intl.NumberFormat('fr-FR').format(coutTotalPrevu)} €</span>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-wrap justify-end space-x-4 mt-8">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isNewBateau ? (loading ? 'Création...' : 'Créer le Bateau') : (loading ? 'Enregistrement...' : 'Enregistrer les modifications')}
          </button>

          {!isNewBateau && ( // Boutons Dupliquer et Supprimer n'apparaissent que pour les bateaux existants
            <>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={loading}
                className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Duplication...' : 'Dupliquer'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? 'Suppression...' : 'Supprimer'}
              </button>
            </>
          )}
          <Link href="/" className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50">
            Annuler / Retour
          </Link>
        </div>
      </form>
    </div>
  );
}
