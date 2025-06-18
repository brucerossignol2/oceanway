import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Stocke l'instance Firestore à exporter
let adminDb;

if (!getApps().length) {
  const serviceAccountString = process.env.FIREBASE_ADMIN_SDK_CONFIG;

  if (!serviceAccountString) {
    throw new Error("Configuration Firebase Admin SDK manquante. Assurez-vous que FIREBASE_ADMIN_SDK_CONFIG est définie dans .env.local.");
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(Buffer.from(serviceAccountString, 'base64').toString('utf8'));
  } catch (parseError) {
    throw new Error("FIREBASE_ADMIN_SDK_CONFIG est mal formée. Vérifiez le format JSON et l'encodage Base64.");
  }

  try {
    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key,
      }),
    });
  } catch (error) {
    throw new Error(`Échec de l'initialisation de Firebase Admin SDK: ${error.message}`);
  }
}

adminDb = getFirestore(getApp());

export { adminDb };
