// app/login/page.js
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { setCookie } from 'nookies'; // Importe setCookie de nookies

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken(); // Récupère le token d'ID

      // IMPORTANT : Définir le cookie de session qui sera lu par les Server Components
      setCookie(null, 'firebaseIdToken', idToken, {
        maxAge: 30 * 24 * 60 * 60, // Expire après 30 jours (ajustez selon votre politique de session)
        path: '/', // Le cookie est disponible sur tout le chemin du site
        secure: process.env.NODE_ENV === 'production', // 'true' en production (HTTPS), 'false' en développement (HTTP)
        httpOnly: false, // Doit être 'false' pour être défini par le JavaScript client
        sameSite: 'Lax', // Bonne pratique pour la sécurité et la compatibilité
      });

      console.log('Connexion réussie !');
      console.log('Tentative de définition du cookie firebaseIdToken avec les propriétés suivantes:');
      console.log('  Valeur (début):', idToken.substring(0, 20) + '...');
      console.log('  maxAge:', 30 * 24 * 60 * 60);
      console.log('  path:', '/');
      console.log('  secure:', process.env.NODE_ENV === 'production');
      console.log('  httpOnly:', false);
      console.log('  sameSite:', 'Lax');

      router.push('/'); // Redirige vers la page d'accueil après connexion
    } catch (e) {
      console.error('Erreur de connexion:', e.message);
      let errorMessage = "Erreur de connexion. Veuillez vérifier vos identifiants.";
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
        errorMessage = "Email ou mot de passe incorrect.";
      } else if (e.code === 'auth/invalid-email') {
        errorMessage = "Format d'email invalide.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Connexion</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
