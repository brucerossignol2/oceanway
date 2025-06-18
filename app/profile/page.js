// app/profile/page.js
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/AuthContext';
import Link from 'next/link';
import { updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

export default function ProfilePage() {
  const { user, loadingAuth } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState(''); // Pour la réauthentification
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/login'); // Redirige si non connecté
    } else if (user) {
      // Pré-remplir les champs avec les données actuelles de l'utilisateur
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user, loadingAuth, router]);

  const clearMessages = () => {
    setError(null);
    setMessage(null);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    try {
      await updateProfile(auth.currentUser, { displayName });
      // Mettre à jour l'email si différent et non vide
      if (email !== auth.currentUser.email && email) {
        // La mise à jour de l'email nécessite une réauthentification récente
        // Pour simplifier, nous n'incluons pas de logique de réauthentification ici.
        // Dans une vraie application, vous demanderiez le mot de passe actuel.
        await updateEmail(auth.currentUser, email);
      }

      // Mettre à jour le document Firestore pour le rôle (si vous avez des champs de profil supplémentaires)
      // Pour l'email, il est automatiquement mis à jour dans user.email par Firebase Auth.
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName, // Sauvegarde le displayName dans Firestore aussi
        // Ne mettez PAS le rôle à jour ici, c'est potentiellement sensible
      });

      setMessage("Profil mis à jour avec succès !");
    } catch (e) {
      console.error("Erreur lors de la mise à jour du profil:", e.message);
      let errorMessage = "Erreur lors de la mise à jour du profil. Réessayez.";
      if (e.code === 'auth/requires-recent-login') {
        errorMessage = "Veuillez vous reconnecter pour mettre à jour votre email. Pour des raisons de sécurité, cette opération nécessite une authentification récente.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    clearMessages();

    if (newPassword !== confirmNewPassword) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      setLoading(false);
      return;
    }
    if (!oldPassword) {
      setError("Veuillez entrer votre mot de passe actuel.");
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) {
        setError("Le nouveau mot de passe doit contenir au moins 6 caractères.");
        setLoading(false);
        return;
    }

    try {
      // Réauthentification avec le mot de passe actuel
      const credential = EmailAuthProvider.credential(auth.currentUser.email, oldPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Changement de mot de passe
      await updatePassword(auth.currentUser, newPassword);
      setMessage("Mot de passe mis à jour avec succès !");
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (e) {
      console.error("Erreur lors du changement de mot de passe:", e.message);
      let errorMessage = "Erreur lors du changement de mot de passe. Vérifiez l'ancien mot de passe ou réessayez.";
      if (e.code === 'auth/wrong-password') {
        errorMessage = "L'ancien mot de passe est incorrect.";
      } else if (e.code === 'auth/requires-recent-login') {
        errorMessage = "Veuillez vous reconnecter récemment pour changer de mot de passe.";
      } else if (e.code === 'auth/weak-password') {
        errorMessage = "Le nouveau mot de passe est trop faible (minimum 6 caractères).";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingAuth || !user) {
    return <p className="text-center text-lg mt-8">Chargement du profil...</p>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl bg-white shadow-lg rounded-lg my-8">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Mon Profil</h1>

      {message && <p className="text-green-600 text-center mb-4">{message}</p>}
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      <form onSubmit={handleProfileUpdate} className="space-y-6 border-b pb-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Informations Générales</h2>
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">Nom / Pseudo</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Mise à jour...' : 'Mettre à jour le profil'}
        </button>
      </form>

      <form onSubmit={handlePasswordChange} className="space-y-6 pt-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Changer de Mot de Passe</h2>
        <div>
          <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700">Mot de passe actuel</label>
          <input
            type="password"
            id="oldPassword"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <div>
          <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            id="confirmNewPassword"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
        </button>
      </form>
    </div>
  );
}
