// lib/data.js

// Ce tableau simule notre base de données.
// Les données seront perdues au redémarrage du serveur de développement.
let bateaux = [
  {
    id: '1',
    nom_bateau: 'Voilier Aventure',
    prix_achat: 85000,
    description: 'Un monocoque robuste, idéal pour les premières grandes traversées.',
    imageUrl: '/images/bateau1.jpg', // Chemin relatif à la racine /public
  },
  {
    id: '2',
    nom_bateau: 'Catamaran Liberté',
    prix_achat: 180000,
    description: 'Spacieux et stable, parfait pour la vie à bord en famille.',
    imageUrl: '/images/bateau2.jpg',
  },
];

// Pour générer des IDs uniques simples
let nextId = bateaux.length > 0 ? Math.max(...bateaux.map(b => parseInt(b.id))) + 1 : 1;

export function getAllBateaux() {
  return [...bateaux]; // Retourne une copie pour éviter les modifications directes
}

export function getBateauById(id) {
  return bateaux.find(b => b.id === id);
}

export function createBateau(newBateauData) {
  const newBateau = {
    id: (nextId++).toString(), // Incrémente l'ID
    ...newBateauData,
    imageUrl: newBateauData.imageUrl || '/images/default.jpg', // Image par défaut
  };
  bateaux.push(newBateau);
  return newBateau;
}

export function updateBateau(id, updatedBateauData) {
  const index = bateaux.findIndex(b => b.id === id);
  if (index !== -1) {
    // Garder l'ancien ID et fusionner les données
    bateaux[index] = { ...bateaux[index], ...updatedBateauData, id };
    return bateaux[index];
  }
  return null; // Bateau non trouvé
}

export function deleteBateau(id) {
  const initialLength = bateaux.length;
  bateaux = bateaux.filter(b => b.id !== id);
  return bateaux.length < initialLength; // Retourne true si un élément a été supprimé
}