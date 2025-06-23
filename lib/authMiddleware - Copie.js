// lib/authMiddleware.js
import { adminDb } from './firebaseAdmin';
import * as admin from 'firebase-admin';

/**
 * Vérifie l'authentification de l'utilisateur via un token d'autorisation (string).
 * @param {string} authorizationHeader La chaîne du header 'Authorization' (ex: 'Bearer <token>')
 * @returns {Promise<{ uid: string, email: string, role: string } | null>}
 */
export async function authenticateServerSide(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return null; // Pas de token ou format incorrect
  }

  const idToken = authorizationHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    let role = 'user';

    if (userDoc.exists) {
      const userData = userDoc.data();
      role = userData.role || 'user';
    }

    return { uid, email: decodedToken.email || null, role };
  } catch (error) {
    console.error('Erreur lors de la vérification du token Firebase ID:', error);
    return null;
  }
}
