// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebaseConfig'; // Votre configuration Firebase

// Initialise l'application Firebase
const app = initializeApp(firebaseConfig);

// Exporte les services Firebase que nous utiliserons
export const auth = getAuth(app);
export const db = getFirestore(app);

// Vous pouvez ajouter d'autres services ici si besoin, ex:
// export const storage = getStorage(app);
