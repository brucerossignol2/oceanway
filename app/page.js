// app/page.js
"use client";

import AnimatedVideoText from '../components/AnimatedVideoText';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* 1. Section vidéo animée */}
      <section className="bg-white text-white">
        <AnimatedVideoText />
      </section>

      {/* 2. Votre contenu habituel */}
      <section className="container mx-auto p-7">
        <h1 className="text-4xl font-bold mb-4">
          OceanWay est un outil permettant d'enregistrer des voiliers de navigation hauturière, et de faire une prévision sur le budget à prévoir pour que le navire soit prêt pour une traversée au long cours.
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Visualisez facilement votre projet d'achat et anticipez vos dépenses d’équipements.
        </p>

        {/* Bouton vers la liste des navires */}
        <div className="text-center">
          <Link href="/bateaux">
            <button
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition"
            >
              Liste des navires 
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
