// components/FicheBateau.jsx
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthContext'; // Importe le hook d'authentification
import { doc, getDoc } from 'firebase/firestore'; // Importe doc et getDoc de Firestore
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

// Fonction pure utilitaire pour initialiser les équipements par défaut (déplacée en dehors du composant)
const getDefaultEquipementsPure = () => [
  { label: 'Guindeau', existe: false, etat: 'bon', quantite: 1, prix: 0, depense: 0, remarque: '' },
  { label: 'Batterie moteur', existe: false, etat: 'bon', quantite: 1, prix: 0, depense: 0, remarque: '' },
];

// Fonction pour obtenir un nouvel équipement par défaut
const getNewDefaultEquipement = () => ({
    label: '',
    existe: true, // Par défaut, le nouvel équipement existe et est "bon"
    etat: 'bon',
    quantite: 1,
    prix: 0,
    depense: 0, // Sera recalculé
    remarque: '',
    isNew: true, // Indique que cette ligne est nouvelle et son label est éditable
});

export default function FicheBateau({ initialBateau, isNewBateau: propIsNewBateau }) {
  const router = useRouter();
  const { user, loadingAuth } = useAuth(); // Récupère l'utilisateur et l'état de chargement de l'authentification

  // isNewBateau peut venir de la prop ou être déterminé par l'ID du bateau (nouveau)
  const isNewBateau = propIsNewBateau || (initialBateau && initialBateau.id === 'nouveau');
  const isExampleBoat = initialBateau?.id === '1'; // Ajout pour le bateau d'exemple

  // L'état local du bateau est initialisé avec la prop initialBateau
  const [bateau, setBateau] = useState(initialBateau);
  // loading concerne les actions du formulaire (save, duplicate, delete), pas le chargement initial de la page
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [creatorEmail, setCreatorEmail] = useState(null); // Nouvel état pour stocker l'email du créateur

  const [totalEquipementDepense, setTotalEquipementDepense] = useState(0);
  // Changement ici : on utilise currentImageIndex au lieu de selectedMainImage
  const [currentImageIndex, setCurrentImageIndex] = useState(0); 
  const fileInputRef = useRef(null);

  // Nouvel état pour le prix d'achat affiché (avec formatage)
  const [displayPrixAchat, setDisplayPrixAchat] = useState('');

  // Mémoïser les fonctions pures pour les dépendances des hooks si nécessaire
  const calculateDepense = useCallback(calculateDepensePure, []);
  const getDefaultEquipements = useCallback(getDefaultEquipementsPure, []);

  // Synchronise l'état local du bateau avec la prop initialBateau si elle change
  // Et initialise les images et dépenses
  useEffect(() => {
    if (initialBateau) {
      // Assurez-vous que initialBateau.equipements est un tableau, même s'il est vide ou null
      const safeEquipements = Array.isArray(initialBateau.equipements) 
                              ? initialBateau.equipements 
                              : getDefaultEquipements();

      // Calculer la dépense pour chaque équipement lors de l'initialisation
      const equipementsWithCalculatedDepense = safeEquipements.map(equip => ({
        ...equip,
        depense: calculateDepense(equip),
        isNew: false, // Les équipements existants ne sont pas "nouveaux"
      }));

      // Mettre à jour l'objet bateau avec les équipements calculés
      setBateau({ ...initialBateau, equipements: equipementsWithCalculatedDepense });

      // Initialise l'index de l'image à 0 quand le bateau change
      setCurrentImageIndex(0);
      
      // Calculer le total des dépenses avec les valeurs mises à jour
      const currentTotalDepense = equipementsWithCalculatedDepense.reduce((sum, equip) => sum + (equip.depense || 0), 0);
      setTotalEquipementDepense(currentTotalDepense);

      // Récupérer l'email du créateur du bateau si userId existe
      if (initialBateau.userId && !isNewBateau) {
        const fetchCreatorEmail = async () => {
          try {
            const userDocRef = doc(db, 'users', initialBateau.userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setCreatorEmail(userDocSnap.data().email);
            } else {
              setCreatorEmail(null); // Ou 'Utilisateur inconnu'
            }
          } catch (err) {
            console.error("Erreur lors de la récupération de l'email du créateur:", err);
            setCreatorEmail(null);
          }
        };
        fetchCreatorEmail();
      } else {
        setCreatorEmail(null);
      }

    }
  }, [initialBateau, calculateDepense, getDefaultEquipements, isNewBateau]); // Ajout de isNewBateau aux dépendances

  // Mettre à jour le champ d'affichage du prix d'achat lorsque bateau.prix_achat change
  useEffect(() => {
    if (bateau && bateau.prix_achat !== undefined && bateau.prix_achat !== null) {
      // Formate le nombre pour l'affichage (ex: 100000 -> 100 000)
      setDisplayPrixAchat(new Intl.NumberFormat('fr-FR').format(bateau.prix_achat));
    } else {
      setDisplayPrixAchat(''); // Réinitialise si la valeur est absente
    }
  }, [bateau?.prix_achat]);

  // Fonction pour mettre à jour un équipement spécifique dans l'état local du bateau
  const handleEquipementChange = useCallback((index, field, value) => {
    setBateau(prevBateau => {
      if (!prevBateau) return null;

      const updatedEquipements = prevBateau.equipements.map((equip, i) => {
        if (i === index) {
          const newEquip = { ...equip, [field]: value };
          // Si on décoche 'existe', l'état redevient 'bon' et la dépense 0
          if (field === 'existe' && !value) {
            newEquip.etat = 'bon';
            newEquip.depense = 0; // Pas de dépense si l'équipement n'existe pas
          } else {
            newEquip.depense = calculateDepense(newEquip); // Recalcule la dépense
          }
          return newEquip;
        }
        return equip;
      });

      const newTotalDepense = updatedEquipements.reduce((sum, equip) => sum + equip.depense, 0);
      setTotalEquipementDepense(newTotalDepense);

      return { ...prevBateau, equipements: updatedEquipements };
    });
  }, [calculateDepense]);


    // Gérer l'ajout d'un nouvel équipement
    const handleAddEquipement = useCallback(() => {
        setBateau(prevBateau => {
            if (!prevBateau) return null;
            const newEquipement = getNewDefaultEquipement();
            // Calculer la dépense initiale pour le nouvel équipement
            newEquipement.depense = calculateDepense(newEquipement); 
            const updatedEquipements = [...prevBateau.equipements, newEquipement];
            
            const newTotalDepense = updatedEquipements.reduce((sum, equip) => sum + equip.depense, 0);
            setTotalEquipementDepense(newTotalDepense);

            return { ...prevBateau, equipements: updatedEquipements };
        });
    }, [calculateDepense]);

    // Gérer la suppression d'un équipement
    const handleRemoveEquipement = useCallback((indexToRemove) => {
        // Optionnel: Ajouter une confirmation
        if (bateau.equipements.length <= 1) {
            setStatusMessage({ type: 'error', text: 'Vous ne pouvez pas supprimer la dernière ligne d\'équipement.' });
            return;
        }

        setBateau(prevBateau => {
            if (!prevBateau) return null;
            const updatedEquipements = prevBateau.equipements.filter((_, i) => i !== indexToRemove);
            
            const newTotalDepense = updatedEquipements.reduce((sum, equip) => sum + equip.depense, 0);
            setTotalEquipementDepense(newTotalDepense);

            return { ...prevBateau, equipements: updatedEquipements };
        });
    }, [bateau?.equipements.length]); // Dépend de la longueur du tableau pour la condition

  // Gestionnaire de changement pour les champs de base (nom, prix, description)
  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setBateau(prev => ({ ...prev, [name]: value }));
  };

  // Nouveau gestionnaire de changement pour le prix d'achat avec formatage
  const handlePrixAchatChange = (e) => {
    const rawValue = e.target.value;
    // Supprime tous les caractères non numériques (sauf les chiffres) pour la conversion en nombre
    const numericValue = parseFloat(rawValue.replace(/[^0-9]/g, ''));

    setBateau(prev => ({
      ...prev,
      // Stocke la valeur numérique réelle dans l'état bateau
      prix_achat: isNaN(numericValue) ? 0 : numericValue,
    }));

    // Met à jour la valeur affichée avec le formatage, même si l'utilisateur n'a pas fini de taper
    if (!isNaN(numericValue) && rawValue !== '') {
      setDisplayPrixAchat(new Intl.NumberFormat('fr-FR').format(numericValue));
    } else {
      setDisplayPrixAchat(rawValue);
    }
  };

  // Gestionnaire de téléchargement d'images
  const handleImageUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);
    setStatusMessage(null);

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
        // Si c'était vide avant, on met l'index à 0 pour afficher la première nouvelle image
        if (prev.images?.length === 0 && updatedImages.length > 0) {
            setCurrentImageIndex(0);
        }
        return { ...prev, images: updatedImages };
      });
      setStatusMessage({ type: 'success', text: 'Images téléchargées avec succès !' });

    } catch (e) {
      console.error("Erreur lors du téléchargement des images :", e);
      setStatusMessage({ type: 'error', text: `Erreur de téléchargement: ${e.message}` });
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

      // Ajuste l'index si l'image courante est supprimée
      if (currentImageIndex >= updatedImages.length && updatedImages.length > 0) {
        setCurrentImageIndex(updatedImages.length - 1);
      } else if (updatedImages.length === 0) {
        setCurrentImageIndex(0); // Ou une valeur qui indique "pas d'image"
      }
      return { ...prev, images: updatedImages };
    });
  };

  // Fonctions pour naviguer dans le carrousel
  const handlePrevImage = useCallback(() => {
    if (!bateau || !bateau.images || bateau.images.length === 0) return;
    setCurrentImageIndex(prevIndex =>
      prevIndex === 0 ? bateau.images.length - 1 : prevIndex - 1
    );
  }, [bateau]);

  const handleNextImage = useCallback(() => {
    if (!bateau || !bateau.images || bateau.images.length === 0) return;
    setCurrentImageIndex(prevIndex =>
      prevIndex === bateau.images.length - 1 ? 0 : prevIndex + 1
    );
  }, [bateau]);

  // Fonction générique pour les actions (soumission, duplication, suppression)
  const performAuthenticatedAction = async (actionFn) => {
    setLoading(true);
    setError(null);
    setStatusMessage(null);

    // Attendre que l'authentification soit complètement chargée
    if (loadingAuth) {
      setStatusMessage({ type: 'info', text: 'Authentification en cours, veuillez patienter.' });
      setLoading(false);
      return;
    }

    // Vérifie si l'utilisateur est présent et si l'instance Firebase User est disponible
    if (!user || !user.firebaseUserInstance) {
        setStatusMessage({ type: 'error', text: 'Vous devez être connecté pour effectuer cette action.' });
        setLoading(false);
        router.push('/login'); // Redirige vers la page de connexion
        return;
    }

    try {
      // Accéder à getIdToken() via l'instance Firebase User
      const idToken = await user.firebaseUserInstance.getIdToken(true); 
      
      // Exécute la fonction d'action passée en argument, en lui donnant le token
      await actionFn(idToken);

    } catch (e) {
      console.error("Erreur lors de l'opération authentifiée :", e);
      // Inclure le code d'erreur si disponible pour plus de détails
      setStatusMessage({ type: 'error', text: `Erreur: ${e.message || "Une erreur inconnue est survenue."} ${e.code ? `(${e.code})` : ''}` });
    } finally {
      setLoading(false);
    }
  };


  // Soumission du formulaire (Création ou Mise à jour)
  const handleSubmit = (e) => {
    e.preventDefault();
    performAuthenticatedAction(async (idToken) => {
      const method = isNewBateau ? 'POST' : 'PUT';
      const url = isNewBateau ? '/api/bateaux' : `/api/bateaux/${bateau.id}`; // Utilise bateau.id pour PUT

      const bateauToSend = {
          ...bateau,
          prix_achat: parseFloat(bateau.prix_achat) || 0,
          equipements: bateau.equipements.map(equip => ({
              ...equip,
              quantite: parseInt(equip.quantite) >= 0 ? parseInt(equip.quantite) : 0,
              prix: parseFloat(equip.prix) >= 0 ? parseFloat(equip.prix) : 0, // Utilise parseFloat pour le prix
              depense: undefined // Ne pas envoyer la dépense calculée au serveur
          })),
          images: bateau.images || [],
          // userId sera l'UID de l'utilisateur authentifié côté serveur pour les POST
          userId: isNewBateau ? user.uid : undefined, 
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(bateauToSend),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Erreur inconnue de l\'API' }));
        throw new Error(errorData.message || `Erreur HTTP! statut: ${res.status}`);
      }

      const result = await res.json();
      if (isNewBateau) {
        setStatusMessage({ type: 'success', text: 'Bateau créé avec succès ! Redirection...' });
        // Marquer tous les équipements comme non-nouveaux après un succès de création
        setBateau(prev => ({
          ...prev,
          equipements: prev.equipements.map(e => ({ ...e, isNew: false })),
        }));
        setTimeout(() => router.push(`/bateaux/${result.id}`), 2000); // Mise à jour du chemin de redirection
      } else {
        setStatusMessage({ type: 'success', text: 'Bateau enregistré avec succès !' });
        // Marquer tous les équipements comme non-nouveaux après un succès de mise à jour
        setBateau(prev => ({
          ...prev,
          equipements: prev.equipements.map(e => ({ ...e, isNew: false })),
        }));
      }
    });
  };

  // Dupliquer le bateau
  const handleDuplicate = () => {
    if (!window.confirm('Êtes-vous sûr de vouloir dupliquer ce bateau ?')) return;
    performAuthenticatedAction(async (idToken) => {
      const dataToDuplicate = {
        ...bateau,
        nom_bateau: `${bateau.nom_bateau} (Copie pour ${user.email})`,
        id: undefined, // L'ID sera généré par le serveur
        userId: user.uid, // L'utilisateur actuel est le propriétaire de la copie
        // Les équipements dupliqués sont considérés comme non-nouveaux initialement
        equipements: bateau.equipements.map(e => ({ ...e, isNew: false })),
      };

      const res = await fetch('/api/bateaux', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(dataToDuplicate),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Erreur inconnue de l\'API' }));
        throw new Error(errorData.message || `Erreur lors de la duplication: ${res.status}`);
      }

      const newBateau = await res.json();
      setStatusMessage({ type: 'success', text: 'Bateau dupliqué avec succès ! Redirection...' });
      setTimeout(() => router.push(`/bateaux/${newBateau.id}`), 2000); // Mise à jour du chemin de redirection
    });
  };

  // Supprimer le bateau
  const handleDelete = () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce bateau ? Cette action est irréversible.')) return;
    performAuthenticatedAction(async (idToken) => {
      const res = await fetch(`/api/bateaux/${bateau.id}`, { // Utilise bateau.id pour DELETE
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Erreur inconnue de l\'API' }));
        throw new Error(errorData.message || `Erreur HTTP! statut: ${res.status}`);
      }

      setStatusMessage({ type: 'success', text: 'Bateau supprimé avec succès ! Redirection...' });
      setTimeout(() => router.push('/'), 2000);
    });
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


  // IMPORTANT: Si initialBateau est null, cela signifie que le Server Component
  // n'a pas pu charger le bateau (par ex. non trouvé, ou accès refusé).
  // On doit afficher un message d'erreur ou rediriger.
  if (!bateau) { 
    return <p className="text-center text-lg mt-8">Bateau non trouvé ou accès non autorisé.</p>;
  }

  // Affiche le chargement de l'authentification si AuthContext n'est pas encore prêt.
  // Cela empêchera le formulaire d'être interactif avant que l'état d'authentification ne soit résolu.
  if (loadingAuth) {
    return <p className="text-center text-lg mt-8">Chargement de l'authentification...</p>;
  }
  
  // Affiche le chargement des actions du formulaire (soumission, duplication, suppression)
  if (loading) return <p className="text-center text-lg mt-8">Traitement en cours...</p>;
  
  const prixAchat = parseFloat(bateau.prix_achat) || 0;
  const coutTotalPrevu = prixAchat + totalEquipementDepense;

  // Déterminer si le bouton "Enregistrer les modifications" doit être affiché
  // Il est affiché si c'est un nouveau bateau OU si ce n'est PAS le bateau d'exemple OU si l'utilisateur est admin
  const canSaveOrModify = isNewBateau || !isExampleBoat || (user?.role === 'admin');

  // Déterminer si le bouton Supprimer doit être affiché
  // Uniquement si l'utilisateur est connecté, ce n'est PAS le bateau d'exemple,
  // ET l'utilisateur est admin OU le propriétaire du bateau.
  const canDelete = user && !isExampleBoat && (user.role === 'admin' || bateau.userId === user.uid);

  // Détermine l'image à afficher dans le carrousel
  const displayedImageUrl = (bateau.images && bateau.images.length > 0) 
                            ? bateau.images[currentImageIndex] 
                            : '/images/default.jpg';
  const hasMultipleImages = bateau.images && bateau.images.length > 1;

  return (
    <div className="container mx-auto p-4 max-w-[1470px] bg-white shadow-lg rounded-lg my-8"> {/* Changed max-w-4xl to max-w-[1470px] */}
      <Link href="/bateaux" className="text-blue-600 hover:underline mb-4 inline-block">&larr; Retour à la liste</Link>
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
              <label htmlFor="nom_bateau" className="block text-sm font-medium text-gray-700">
                Nom du Bateau {' '}
                {/* Afficher l'email du créateur UNIQUEMENT si ce n'est pas un nouveau bateau,
                    l'email est disponible ET l'utilisateur connecté est un admin. */}
                {!isNewBateau && creatorEmail && user?.role === 'admin' && (
                  <span className="text-gray-500 text-xs">({creatorEmail})</span>
                )}
              </label>
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
                type="text" // Changé en type="text" pour permettre le formatage
                id="prix_achat"
                name="prix_achat"
                value={displayPrixAchat} // Utilise l'état formaté pour l'affichage
                onChange={handlePrixAchatChange} // Utilise le nouveau gestionnaire
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

          <div className="flex flex-col space-y-4">
            {/* Conteneur du carrousel de l'image principale */}
            <div className="flex-shrink-0 mb-4 text-center relative h-96 group"> 
              <label htmlFor="imageUrlInput" className="block text-sm font-medium text-gray-700 mb-2">Image Principale Actuelle</label>
              {displayedImageUrl ? (
                <>
                  <Image
                    key={displayedImageUrl} // Change la clé pour forcer le re-render et la transition
                    src={displayedImageUrl}
                    alt="Image principale du bateau"
                    fill // Utilisez 'fill' pour que l'image remplisse le conteneur parent
                    className="rounded-lg shadow-md border border-gray-300 object-contain transition-opacity duration-500 ease-in-out" // Transition de fondu
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/default.jpg'; }}
                    unoptimized
                  />

                  {hasMultipleImages && (
                    <>
                      {/* Bouton Précédent */}
                      <button
                        type="button"
                        onClick={handlePrevImage}
                        className="absolute left-0 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        aria-label="Image précédente"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      {/* Bouton Suivant */}
                      <button
                        type="button"
                        onClick={handleNextImage}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        aria-label="Image suivante"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                  </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg text-gray-500 border border-gray-300 mx-auto">
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
                      className={`rounded-md border-2 cursor-pointer ${currentImageIndex === index ? 'border-blue-500' : 'border-gray-300'} group-hover:border-blue-400 transition`}
                      onClick={() => setCurrentImageIndex(index)} // Met à jour l'index directement
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

              
<div className="grid grid-cols-[1.5fr_0.5fr_1.2fr_0.7fr_0.8fr_1fr_2fr_min-content] gap-x-2 text-xs font-medium text-gray-500 uppercase tracking-wider items-center py-2 border-b border-gray-200">
  <div className="px-1 text-left">
    Nom</div>
<div className="px-1 text-center">
  Existe
  <div className="relative group inline-block ml-1 cursor-pointer text-blue-600">
    <span className="font-bold text-lg select-none">?</span>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-sm rounded-md p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-10">
      Cochez si présent dans le navire, alors pas de dépense supplémentaire.
    </div>
  </div>
</div>
  <div className="px-1 text-left">
  État
  <div className="relative group inline-block ml-1 cursor-pointer text-blue-600">
    <span className="font-bold text-lg select-none">?</span>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-sm rounded-md p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-10">
      Si l'état est bon, pas de dépense. Si l'état est à réviser, 50% de la valeur sera mis en dépense.
    </div>
    </div>
</div>
<div className="px-1 text-center">
  Quantité
  <div className="relative group inline-block ml-1 cursor-pointer text-blue-600">
    <span className="font-bold text-lg select-none">?</span>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-sm rounded-md p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-10">
      Si vous ne souhaitez pas mettre cet équipement dans votre navire, mettez la quantité à 0.
    </div>
  </div>
</div>
<div className="px-1 text-left">
  Prix
  <div className="relative group inline-block ml-1 cursor-pointer text-blue-600">
    <span className="font-bold text-lg select-none">?</span>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-sm rounded-md p-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-10">
      Valeur estimée de l'équipement fournit ou à ajouter.
    </div>
  </div>
</div>
  <div className="px-1 text-left">Dépense</div>
  <div className="px-1 text-left">Remarque</div>
  <div className="px-1 text-center"></div> {/* Colonne vide pour le bouton de suppression */}
</div>
          <div className="overflow-x-auto">
            {/* Le corps du "tableau" maintenant en divs */}
            <div className="divide-y divide-gray-200">
              {bateau.equipements.map((equip, index) => (
                <div key={index} className="grid grid-cols-[1.5fr_0.5fr_1.2fr_0.7fr_0.8fr_1fr_2fr_min-content] gap-x-2 py-2 items-center">
                  <div className="px-1 text-sm font-medium text-gray-900">
                        {equip.isNew ? ( // Le champ 'label' est éditable si isNew est true
                            <input
                                type="text"
                                value={equip.label || ''}
                                onChange={(e) => handleEquipementChange(index, 'label', e.target.value)}
                                className="block w-full border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        ) : ( // Sinon, il est en lecture seule
                            <span className="block w-full p-1">{equip.label}</span>
                        )}
                    </div>
                  <div className="px-1 text-sm text-gray-500 text-center">
                      <input
                        type="checkbox"
                        checked={equip.existe}
                        onChange={(e) => handleEquipementChange(index, 'existe', e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                  </div>
                  <div className="px-1 text-sm text-gray-500">
                      <select
                        value={equip.etat}
                        onChange={(e) => handleEquipementChange(index, 'etat', e.target.value)}
                        disabled={!equip.existe}
                        className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm ${!equip.existe ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                      >
                        <option value="bon">Bon</option>
                        <option value="a_reviser">À réviser</option>
                        <option value="a_changer">À changer</option>
                      </select>
                  </div>
                  <div className="px-1 text-sm text-gray-500">
                      <input
                        type="number"
                        min="0"
                        value={equip.quantite}
                        onChange={(e) => handleEquipementChange(index, 'quantite', parseInt(e.target.value) || 0)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                  </div>
                  <div className="px-1 text-sm text-gray-500">
                      <input
                        type="number"
                        min="0"
                        step="10" 
                        value={equip.prix}
                        onChange={(e) => handleEquipementChange(index, 'prix', parseFloat(e.target.value) || 0)} // Utilise parseFloat
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                  </div>
                  <div className="px-1 text-sm text-gray-500 font-bold">
                      {new Intl.NumberFormat('fr-FR').format(equip.depense)} €
                  </div>
                  <div className="px-1 text-sm text-gray-500">
                      <input
                        type="text"
                        value={equip.remarque || ''}
                        onChange={(e) => handleEquipementChange(index, 'remarque', e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm p-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                  </div>
                    <div className="px-1 text-sm text-gray-500 text-center">
                        {bateau.equipements.length > 1 && ( // Permet de supprimer si plus d'une ligne
                            <button
                                type="button"
                                onClick={() => handleRemoveEquipement(index)}
                                className="text-red-500 hover:text-red-700 font-bold"
                                title="Supprimer cet équipement"
                            >
                                &times;
                            </button>
                        )}
                    </div>
                </div>
              ))}
            </div>
            {/* Bouton pour ajouter un équipement */}
            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={handleAddEquipement}
                    className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-600 transition-colors duration-200 inline-flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Ajouter un équipement
                </button>
            </div>
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
        <div className="flex flex-wrap justify-center md:justify-end space-x-4 mt-8"> {/* Added justify-center for smaller screens */}
          {canSaveOrModify && ( // Le bouton "Enregistrer les modifications" est affiché conditionnellement
            <button
              type="submit"
              disabled={loading || loadingAuth} // Désactive pendant le chargement de l'auth aussi
              className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isNewBateau ? (loading ? 'Création...' : 'Créer le Bateau') : (loading ? 'Enregistrement...' : 'Enregistrer les modifications')}
            </button>
          )}

          {!isNewBateau && (
            <>
              {/* Le bouton Dupliquer reste visible pour le bateau d'exemple, car la duplication d'un exemple est permise pour tous les utilisateurs authentifiés. */}
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
          <Link href="/bateaux" className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50">
            Annuler / Retour
          </Link>
        </div>
      </form>
    </div>
  );
}
