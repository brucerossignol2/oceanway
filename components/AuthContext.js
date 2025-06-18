// components/AuthContext.js
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Initialiser le contexte avec une valeur par défaut
const AuthContext = createContext({
  user: null,
  loadingAuth: true,
  signOut: async () => {}, // fonction vide par défaut
});

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              role: userData.role || 'user',
            });
            console.log("Utilisateur connecté:", currentUser.email, "Rôle:", userData.role);
          } else {
            // Créer un profil utilisateur par défaut dans Firestore
            await setDoc(
              doc(db, 'users', currentUser.uid),
              {
                email: currentUser.email,
                role: 'user',
                createdAt: new Date().toISOString(),
              },
              { merge: true }
            );
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              role: 'user',
            });
            console.log("Nouvel utilisateur connecté, profil Firestore créé:", currentUser.email);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération/création du profil utilisateur Firestore:", error);
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            role: 'user',
          });
        }
      } else {
        setUser(null);
        console.log("Utilisateur déconnecté.");
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []); // <-- IMPORTANT : tableau de dépendance vide

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      console.log("Déconnexion réussie.");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      throw error;
    }
  };

  const contextValue = {
    user,
    loadingAuth,
    signOut,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthContextProvider');
  }
  return context;
};
