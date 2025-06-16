// app/voilier/[id]/page.js
import React from 'react';

// Fonction pour récupérer les données d'un voilier spécifique depuis l'API REST de WordPress
async function getVoilierData(id) {
  // Utilisez la variable d'environnement WORDPRESS_API_URL directement ici.
  // Elle doit être définie dans votre .env.local et accessible côté serveur.
  const res = await fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/voilier/${id}?_embed`);

  if (!res.ok) {
    console.error(`Erreur lors de la récupération des données du voilier (ID: ${id}): ${res.statusText}`);
    return null;
  }
  const voilier = await res.json();
  return voilier;
}

// Composant principal de la page
export default async function FicheVoilierPage({ params }) {
  // C'est le changement crucial : attendez les params avant de déstructurer
  const awaitedParams = await params; // Attendre la résolution de la promesse params
  const { id } = awaitedParams; // Maintenant, déstructurez en toute sécurité

  const voilierData = await getVoilierData(id);

  if (!voilierData) {
    return (
      <div className="container mx-auto p-8 bg-white shadow-lg rounded-xl mt-10">
        <h1 className="text-4xl font-bold mb-4 text-red-600">Voilier non trouvé ou erreur de chargement.</h1>
        <p className="text-lg text-gray-700">Vérifiez que l'ID du voilier dans l'URL est correct (par exemple : <span className="font-mono bg-gray-100 p-1 rounded">http://localhost:3000/voilier/339</span>) et que le serveur WordPress est bien lancé.</p>
      </div>
    );
  }

  const nomBateau = voilierData.nom_bateau;
  const prixAchat = parseFloat(voilierData.prix_achat || 0);
  const description = voilierData.description;

  const featuredImage = voilierData._embedded && voilierData._embedded['wp:featuredmedia'] && voilierData._embedded['wp:featuredmedia'][0]
    ? voilierData._embedded['wp:featuredmedia'][0].source_url
    : null;

  const equipements = [
    'Guindeau électrique', 'Batterie moteur', 'Batterie cabine', 'Moniteur de batterie', 'Régulateur de charge',
    'Convertisseur 12v/200v', 'Panneau solaire', 'Hydrogénérateur', 'éolienne', 'Cadène', 'Pompes a eau',
    'Moteur voilier', 'Moteur de l\'annexe', 'Winchs', 'Electronique de navigation', 'Anémomètre', 'Sondeur',
    'Ballon eau chaude', 'Chauffage', 'Dessalinisateur', 'Pilote automatique', 'Régulateur d\'allure', 'Radar',
    'VHF ASN', 'AIS', 'GPS', 'Capote de roof / bimini', 'Bouteilles de gaz', 'four à bascule', 'Couverts',
    'Matériel de pêche', 'Annexe', 'pagaie d\'annexe', 'Equipements obligatoires en hauturier', 'Balise de détresse.',
    'Gilets de sauvetage.', 'Cartes maritimes papiers', 'Radeau de survie', 'Routeur internet', 'Antenne Wifi',
    'Communication', 'Génois', 'Grand voile', 'foc', 'Trinquette', 'Code 0', 'Spi',
  ];

  let totalGeneralDepenseEquipements = 0;

  return (
    <div className="container mx-auto p-4 md:p-8 relative min-h-screen">
      <h1 className="text-4xl font-extrabold mb-6 text-gray-800 text-center md:text-left">Fiche du voilier : {nomBateau}</h1>

      <div className="flex flex-wrap gap-x-10 gap-y-6 mb-8">
        <div className="flex-1 min-w-[250px] bg-white p-6 rounded-lg shadow-md">
          <label className="block mb-4">
            <span className="font-semibold text-gray-700 block mb-1">Nom du bateau : </span>
            <input type="text" name="nom_bateau" value={nomBateau} readOnly
                   className="block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
          <label className="block mb-4">
            <span className="font-semibold text-gray-700 block mb-1">Prix d'achat (€): </span>
            <input type="number" name="prix_achat" value={prixAchat} readOnly
                   className="block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </label>
        </div>

        <div className="flex-1 min-w-[250px] bg-white p-6 rounded-lg shadow-md flex items-center justify-center">
          {featuredImage ? (
            <div className="w-full h-full flex flex-col items-center">
              <p className="font-semibold text-gray-700 mb-2 text-center">Photo actuelle :</p>
              <img src={featuredImage} alt={nomBateau}
                   className="max-w-full h-auto max-h-96 object-contain rounded-lg shadow-inner border border-gray-200" />
            </div>
          ) : (
            <p className="text-gray-500 italic text-center">Aucune photo mise en avant.</p>
          )}
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <label className="block mb-4">
          <span className="font-semibold text-gray-700 block mb-1">Description : </span>
          <textarea name="description" rows="4" value={description} readOnly
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
        </label>
      </div>

      <h2 className="text-3xl font-bold mt-12 mb-6 text-gray-800 text-center md:text-left">Équipements du voilier</h2>

      <div className="overflow-x-auto shadow-xl rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Équipement</th>
              <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[6%]">Existe</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/10">État</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/12">Qté</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/10">Prix (€)</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/10">Dépense (€)</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Remarque</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {equipements.map((equipement) => {
              const slug = equipement.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '_');

              const existe = voilierData[`${slug}_existe`] || false;
              const etat = voilierData[`${slug}_etat`] || 'bon';
              const quantite = parseFloat(voilierData[`${slug}_quantite`] || 0);
              const montant = parseFloat(voilierData[`${slug}_montant`] || 0);
              const remarque = voilierData[`${slug}_remarque`] || '';

              let totalEquipement = 0;
              if (!existe) {
                totalEquipement = quantite * montant;
              } else {
                let coef = 0;
                switch (etat) {
                  case 'a_reviser': coef = 0.5; break;
                  case 'a_changer': coef = 1; break;
                  default: coef = 0;
                }
                totalEquipement = coef * quantite * montant;
              }
              totalGeneralDepenseEquipements += totalEquipement;

              return (
                <tr key={slug} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-3 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{equipement}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-center text-sm text-gray-500">{existe ? 'Oui' : 'Non'}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                    {etat === 'a_reviser' ? 'À réviser' : etat === 'a_changer' ? 'À changer' : 'Bon'}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">{quantite}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">{montant.toLocaleString('fr-FR')}</td>
                  <td className="py-3 px-4 whitespace-nowrap text-sm font-semibold text-blue-700">{totalEquipement.toLocaleString('fr-FR')}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    <textarea value={remarque} readOnly
                              className="w-full h-16 min-h-[40px] resize-y border border-gray-200 rounded-md p-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300"></textarea>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-gray-100 font-bold text-gray-800">
              <td colSpan="5" className="py-3 px-4 text-right">Total des dépenses pour les équipements :</td>
              <td className="py-3 px-4 text-blue-800 text-lg">{totalGeneralDepenseEquipements.toLocaleString('fr-FR')} €</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-10 text-3xl font-extrabold text-gray-900 text-center md:text-left">
        Coût total à prévoir (navire + dépenses) : <span className="text-red-700">{(prixAchat + totalGeneralDepenseEquipements).toLocaleString('fr-FR')} €</span>
      </p>

      <div className="mt-12 pt-6 border-t border-gray-200 flex flex-wrap justify-center md:justify-start gap-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105" disabled>
          Enregistrer (désactivé)
        </button>
        <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105" disabled>
          Dupliquer (désactivé)
        </button>
        <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200 ease-in-out transform hover:scale-105" disabled>
          Supprimer (désactivé)
        </button>
        <p className="w-full text-sm text-gray-500 mt-4 text-center md:text-left">Note : Les fonctionnalités d'édition, de duplication et de suppression nécessitent une API REST personnalisée côté WordPress.</p>
      </div>
    </div>
  );
}