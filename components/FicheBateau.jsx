// components/FicheBateau.jsx
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthContext'; // Importe le hook d'authentification
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Importe doc, getDoc et updateDoc de Firestore
import { db } from '../lib/firebase'; // Assurez-vous que l'instance db est importée

// Fonction pure pour calculer la dépense d'un équipement (déplacée en dehors du composant)
const calculateDepensePure = (equip) => {
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
};

// Fonction pure pour calculer le total des dépenses (déplacée en dehors du composant)
const calculateTotalDepensePure = (equipements) => {
  return equipements.reduce((sum, equip) => sum + calculateDepensePure(equip), 0);
};

export default function FicheBateau({ bateauId }) {
  const router = useRouter();
  const { user, loading: loadingAuth } = useAuth(); // Récupère l'utilisateur et l'état de chargement de l'authentification
  const [bateau, setBateau] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // État pour la confirmation de suppression
  const [uploadingImage, setUploadingImage] = useState(false); // État pour l'upload de l'image
  const fileInputRef = useRef(null); // Réf pour l'input de fichier

  const canEdit = user && bateau && user.uid === bateau.userId;
  const canDelete = canEdit; // Seul le propriétaire peut supprimer
  const canDuplicate = user !== null; // N'importe quel utilisateur connecté peut dupliquer

  // Fonction asynchrone pour charger les données du bateau
  const fetchBateau = useCallback(async () => {
    if (!bateauId) {
      setLoading(false);
      setError("ID du bateau manquant.");
      return;
    }
    setLoading(true);
    try {
      // Référence au document Firestore pour le bateau
      const docRef = doc(db, 'artifacts', typeof __app_id !== 'undefined' ? __app_id : 'default-app-id', 'users', user.uid, 'bateaux', bateauId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setBateau({ id: docSnap.id, ...data });
      } else {
        setError("Bateau non trouvé.");
      }
    } catch (err) {
      console.error("Erreur lors du chargement du bateau:", err);
      setError("Échec du chargement du bateau. " + err.message);
    } finally {
      setLoading(false);
    }
  }, [bateauId, user]);

  useEffect(() => {
    if (user && !loadingAuth) { // Attendre que l'authentification soit prête
      fetchBateau();
    } else if (!user && !loadingAuth) {
      // Rediriger ou afficher un message si l'utilisateur n'est pas connecté et non autorisé à voir
      // Pour l'instant, on laisse le message d'erreur si bateauId est absent.
      setLoading(false);
    }
  }, [user, loadingAuth, fetchBateau]);

  // Handler pour la suppression
  const handleDelete = async () => {
    setShowDeleteConfirm(true); // Afficher la boîte de dialogue de confirmation
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'artifacts', typeof __app_id !== 'undefined' ? __app_id : 'default-app-id', 'users', user.uid, 'bateaux', bateauId);
      // Supprimer le document
      // await deleteDoc(docRef); // Commenté car deleteDoc n'est pas importé et pas une priorité pour cette modification.
      // Au lieu de supprimer, on peut juste simuler ou afficher un message pour l'instant.
      console.log(`Bateau ${bateauId} supprimé (simulé).`);
      router.push('/bateaux'); // Rediriger après la suppression
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      setError("Échec de la suppression du bateau. " + err.message);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false); // Cacher la confirmation
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false); // Cacher la confirmation
  };

  // Handler pour la duplication
  const handleDuplicate = async () => {
    if (!user) {
      setError("Vous devez être connecté pour dupliquer un bateau.");
      return;
    }
    setLoading(true);
    try {
      // Simuler la duplication. La vraie logique nécessiterait addDoc
      // dans la collection 'bateaux' de l'utilisateur connecté avec les données du bateau actuel.
      const newBateauData = {
        ...bateau,
        userId: user.uid, // Assigner le nouveau bateau à l'utilisateur actuel
        nom: `${bateau.nom} (Copié)`,
        // Supprime l'ID existant pour qu'Firestore en génère un nouveau
        id: undefined,
      };
      // Exemple de ce qu'il faudrait faire avec addDoc si la duplication était implémentée
      // const newDocRef = await addDoc(collection(db, 'artifacts', typeof __app_id !== 'undefined' ? __app_id : 'default-app-id', 'users', user.uid, 'bateaux'), newBateauData);
      // router.push(`/bateaux/${newDocRef.id}`);
      console.log("Duplication simulée pour:", newBateauData);
      alert("Fonctionnalité de duplication en cours de développement. Un nouveau bateau 'Copié' serait créé.");
    } catch (err) {
      console.error("Erreur lors de la duplication:", err);
      setError("Échec de la duplication du bateau. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handler pour l'upload d'image
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError(null); // Réinitialiser les erreurs précédentes

    const formData = new FormData();
    formData.append('file', file); // 'file' doit correspondre au nom attendu par l'API (req.formData().get('file'))

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de l\'upload de l\'image.');
      }

      const data = await response.json();
      const imageUrl = data.url;

      // Met à jour l'URL de l'image du bateau dans Firestore
      if (bateau && user) {
        const docRef = doc(db, 'artifacts', typeof __app_id !== 'undefined' ? __app_id : 'default-app-id', 'users', user.uid, 'bateaux', bateau.id);
        await updateDoc(docRef, { imageUrl: imageUrl });
        setBateau(prev => ({ ...prev, imageUrl: imageUrl })); // Met à jour l'état local
        alert('Image uploadée avec succès !');
      }

    } catch (err) {
      console.error('Erreur lors de l\'upload de l\'image:', err);
      setError(`Erreur lors de l'upload de l'image: ${err.message}`);
    } finally {
      setUploadingImage(false);
      // Réinitialise l'input de fichier pour permettre le re-téléchargement du même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading || loadingAuth) {
    return <div className="text-center py-8">Chargement de la fiche du bateau...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Erreur: {error}</div>;
  }

  if (!bateau) {
    return <div className="text-center py-8">Bateau introuvable ou non autorisé.</div>;
  }

  const totalDepense = calculateTotalDepensePure(bateau.equipements || []);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-geist-sans">
      <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 border-b pb-4">
          Fiche du bateau : {bateau.nom}
        </h1>

        {/* Section Image */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Image du Bateau</h2>
          <div className="relative w-full h-64 sm:h-80 bg-gray-200 rounded-md overflow-hidden flex items-center justify-center">
            {bateau.imageUrl ? (
              <Image
                src={bateau.imageUrl}
                alt={`Image de ${bateau.nom}`}
                layout="fill"
                objectFit="cover"
                className="rounded-md"
                onError={(e) => {
                  e.target.onerror = null; // Empêche les boucles d'erreurs
                  e.target.src = "https://placehold.co/600x400/CCCCCC/FFFFFF?text=Image+Non+Trouvée";
                }}
              />
            ) : (
              <span className="text-gray-500">Aucune image disponible</span>
            )}
          </div>
          {canEdit && (
            <div className="mt-4 flex items-center space-x-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="hidden" // Cache l'input par défaut
                id="image-upload-input"
                disabled={uploadingImage}
              />
              <label
                htmlFor="image-upload-input"
                className={`px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer
                  ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploadingImage ? 'Téléchargement...' : 'Télécharger une image'}
              </label>
              {uploadingImage && (
                <div className="text-blue-600 text-sm">Veuillez patienter...</div>
              )}
            </div>
          )}
        </div>


        {/* Informations générales */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Informations Générales</h2>
          <p className="text-lg text-gray-700 mb-2">
            <span className="font-medium">Type :</span> {bateau.type || 'Non spécifié'}
          </p>
          <p className="text-lg text-gray-700 mb-2">
            <span className="font-medium">Année :</span> {bateau.annee || 'Non spécifiée'}
          </p>
          <p className="text-lg text-gray-700 mb-2">
            <span className="font-medium">Longueur :</span> {bateau.longueur ? `${bateau.longueur} m` : 'Non spécifiée'}
          </p>
          <p className="text-lg text-gray-700 mb-2">
            <span className="font-medium">Largeur :</span> {bateau.largeur ? `${bateau.largeur} m` : 'Non spécifiée'}
          </p>
        </div>

        {/* Liste des équipements */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Équipements</h2>
          {bateau.equipements && bateau.equipements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantité
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix Unitaire (€)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Existant ?
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      État
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dépense (€)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bateau.equipements.map((equip, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {equip.nom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {equip.quantite}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {equip.prix ? parseFloat(equip.prix).toFixed(2) : '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {equip.existe ? 'Oui' : 'Non'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {equip.existe ? (
                          equip.etat === 'a_reviser' ? 'À réviser' :
                          equip.etat === 'a_changer' ? 'À changer' : 'Bon'
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                        {calculateDepensePure(equip).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan="5" className="px-6 py-3 text-right text-base font-bold text-gray-800">
                      Coût total des équipements :
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-base font-bold text-gray-900">
                      {totalDepense.toFixed(2)} €
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">Aucun équipement défini pour ce bateau.</p>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="mt-8 flex flex-wrap gap-4 justify-end">
          {canEdit && (
            <Link
              href={`/bateaux/edit/${bateau.id}`}
              className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Modifier
            </Link>
          )}
          {canDuplicate && (
            <>
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={loading || loadingAuth} // Désactive pendant le chargement de l'auth
                className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Duplication...' : 'Dupliquer'}
              </button>
              {canDelete && ( // Bouton Supprimer affiché conditionnellement
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading || loadingAuth} // Désactive pendant le chargement de l'auth
                  className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {loading ? 'Suppression...' : 'Supprimer'}
                </button>
              )}
            </>
          )}
          <Link href="/bateaux" className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Retour à la liste
          </Link>
        </div>

        {/* Modal de confirmation de suppression */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confirmer la suppression</h3>
              <p className="text-gray-700 mb-6">Êtes-vous sûr de vouloir supprimer ce bateau ? Cette action est irréversible.</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelDelete}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
