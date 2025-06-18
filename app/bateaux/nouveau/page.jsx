// app/bateaux/nouveau/page.jsx
"use client";

import FicheBateau from '../../../components/FicheBateau';

export default function NouveauBateauPage() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Créer un nouveau bateau
      </h1>
      {/* On passe isNewBateau à true et pas d'initialBateau */}
      <FicheBateau isNewBateau={true} initialBateau={null} />
    </div>
  );
}
