// components/AuthContext.js
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase'; // Importe l'instance d'authentification Firebase
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Assurez-vous que setDoc est importé

const AuthContext = createContext();

export function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null); // L'objet utilisateur Firebase (ou null si déconnecté)
  const [loadingAuth, setLoadingAuth] = useState(true); // Indique si l'état d'authentification est en cours de chargement

  // Écoute les changements d'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // L'utilisateur est connecté, tente de récupérer son rôle depuis Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              // IMPORTANT: Stocke l'instance Firebase User originale
              firebaseUserInstance: currentUser, 
              role: userData.role || 'user' // Définit le rôle par défaut 'user'
            });
            console.log("Utilisateur connecté:", currentUser.email, "Rôle:", userData.role);
          } else {
            // L'utilisateur n'a pas encore de document de profil dans Firestore, le créer
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              role: 'user', // Rôle par défaut
              createdAt: new Date().toISOString(),
            }, { merge: true }); // Utilise merge pour ne pas écraser si d'autres champs existaient déjà (peu probable ici)
            
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              // IMPORTANT: Stocke l'instance Firebase User originale
              firebaseUserInstance: currentUser, 
              role: 'user' // Rôle par défaut après création
            });
            console.log("Nouvel utilisateur connecté, profil Firestore créé:", currentUser.email);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération/création du profil utilisateur Firestore:", error);
          // Fallback au rôle par défaut en cas d'erreur de Firestore, mais l'utilisateur est toujours authentifié par Firebase Auth
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            firebaseUserInstance: currentUser, // Important de conserver l'instance Firebase User
            role: 'user' 
          });
        }
      } else {
        setUser(null); // L'utilisateur est déconnecté
        console.log("Utilisateur déconnecté.");
      }
      setLoadingAuth(false); // L'état d'authentification est chargé
    });

    // Nettoyage de l'abonnement lors du démontage du composant
    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null); // Effacer l'utilisateur du contexte
      console.log("Déconnexion réussie.");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      throw error;
    }
  };

  // Les valeurs fournies par le contexte
  const contextValue = {
    user,
    loadingAuth,
    signOut,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthContextProvider');
  }
  return context;
};
