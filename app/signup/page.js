// app/signup/page.js
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Pour ajouter des données au profil
import { auth, db } from '../../lib/firebase'; // Assurez-vous que le chemin est correct

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Ajoute un document utilisateur dans Firestore avec un rôle par défaut
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        role: 'user', // Rôle par défaut
        createdAt: new Date().toISOString(),
      });

      console.log('Inscription réussie et profil créé !');
      router.push('/'); // Redirige vers la page d'accueil après inscription
    } catch (e) {
      console.error('Erreur d\'inscription:', e.message);
      let errorMessage = "Erreur lors de l'inscription. Veuillez réessayer.";
      if (e.code === 'auth/email-already-in-use') {
        errorMessage = "Cet email est déjà utilisé.";
      } else if (e.code === 'auth/weak-password') {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
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
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Inscription</h1>
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
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            {loading ? "Inscription en cours..." : "S'inscrire"}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600 text-sm">
          Déjà un compte ?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
