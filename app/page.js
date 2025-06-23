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
          OceanWay, votre passeport pour le grand large.
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Enregistrez votre voilier de navigation hauturière sur lequel vous avez une intention d'achat, visualisez votre projet global de dépense et anticipez sereinement le budget nécessaire pour une traversée au long cours.
          Ceci est un outil gratuit d'aide à la décision pour l'achat d'un voilier avec une prévision transocéanique.
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
