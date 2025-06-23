// lib/authMiddleware.js
// Ce fichier est destiné à être utilisé UNIQUEMENT CÔTÉ SERVEUR (dans les API Routes)

import { adminDb } from './firebaseAdmin'; // Importe l'instance Firestore du SDK Admin
import * as admin from 'firebase-admin'; // Importe le module Firebase Admin

/**
 * Vérifie l'authentification de l'utilisateur via le token d'autorisation présent dans la requête.
 * Retourne l'objet user { uid, email, role: 'user' | 'admin' } ou null.
 * @param {Request} request Le Next.js Request object qui contient les headers.
 * @returns {Promise<{ uid: string, email: string, role: string } | null>} L'objet utilisateur ou null.
 */
export async function authenticateServerSide(request) {
  // Extrait l'en-tête Authorization de l'objet Request
  const authorizationHeader = request.headers.get('Authorization');

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null; // Pas de token ou format incorrect
  }

  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Récupérer le rôle de l'utilisateur depuis Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get();
    let role = 'user'; // Rôle par défaut

    if (userDoc.exists) {
      const userData = userDoc.data();
      role = userData.role || 'user'; // Utilise le rôle défini ou 'user' par défaut
    }

    return { uid: uid, email: decodedToken.email, role: role };

  } catch (error) {
    console.error('Erreur lors de la vérification du token Firebase ID dans authenticateServerSide:', error);
    return null; // Token invalide ou expiré
  }
}
