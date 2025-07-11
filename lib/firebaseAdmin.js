import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminDb;

if (!getApps().length) {
  const serviceAccountString = process.env.FIREBASE_ADMIN_SDK_CONFIG;

  if (!serviceAccountString) {
    throw new Error("Configuration Firebase Admin SDK manquante. Assurez-vous que FIREBASE_ADMIN_SDK_CONFIG est définie dans .env.local.");
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(Buffer.from(serviceAccountString, 'base64').toString('utf8'));
    // Corrige les \n en vraies sauts de ligne pour la clé privée
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  } catch (parseError) {
    console.error("Erreur de parsing de FIREBASE_ADMIN_SDK_CONFIG:", parseError);
    throw new Error("FIREBASE_ADMIN_SDK_CONFIG est mal formée. Vérifiez le format JSON et l'encodage Base64.");
  }

  try {
    initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (error) {
    throw new Error(`Échec de l'initialisation de Firebase Admin SDK: ${error.message}`);
  }
}

adminDb = getFirestore(getApp());

export { adminDb };
