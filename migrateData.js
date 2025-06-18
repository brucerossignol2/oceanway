// migrateData.js
// Ce script migre les données de data/bateaux.json vers Firestore.
// Assurez-vous d'avoir votre fichier .env.local configuré avec FIREBASE_ADMIN_SDK_CONFIG.

// --- OPTION 1: Charger les variables d'environnement depuis .env.local (RECOMMANDÉ) ---
// Décommentez la ligne ci-dessous si vous utilisez .env.local
//require('dotenv').config(); 

// --- OPTION 2: Coller directement le JSON de votre clé de service ici (UNIQUEMENT POUR UN USAGE TEMPORAIRE/MIGRATION) ---
// Si vous choisissez cette option, N'OUBLIEZ PAS DE SUPPRIMER CES LIGNES APRÈS LA MIGRATION !
// NE JAMAIS FAIRE CELA POUR DU CODE DE PRODUCTION OU COMMETTRE CECI SUR GIT.

const RAW_SERVICE_ACCOUNT_JSON = 

{
  "type": "service_account",
  "project_id": "voilier-hauturier",
  "private_key_id": "9ac0f50dea6ceea842cdad190fd7432401c5133e",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCjsGE7ZLYrkKUD\nxtefUqwMJc40yRUWlLWDdeubXH1T7QlhgWzg7LK7f0xwxxKrCbqmP6QZ9+Y4FToK\nMna/UUNT5lirD6d3hpgfv0tI3l1SfjMzQPP80LF3m2J3Oe0lrh2IBcrRX17AlWA5\nqagz1RcEFIcOmqHthWSiq0r9Yz/q/1YU0V/ACSYgKfN5XOvXutINHVbyLmFu0cUU\notshAOoXailmRFLchsBFD0Ya0zLDVdgHJtH/oY4X6oxgMXvFroSZt/3EsPI1c16h\nPg72uvrb79MDKkN5XMAU1dhAzXtVAGcTxkVivieqzSxBEWZJmkX89Lj4nsEdzqrq\nk7rfhTAzAgMBAAECggEAAJZZtT7YsHtThWMXQT/x1F8K7O9GDPQefy1la99IOYyT\n48DQjlYLE9dt8VrKEhJ2AdayVORgz160IJuGUPn8PLbTuOcdwv4GotjPbul/nxPd\naXMYNihKrQCdb9QTYOSpCVJ5tmO+o5LTWLPnauFVtKnBnt5dc4NKJ7fVDDDWr98o\nnq6tZJ9W63U3E2IjL1rvBkyghB0TLkVF6aXo+AEMD5RJTm6z6MzJGvBcNhgl4m+c\nWH/dK4UOLALp6tub/hk7/KhIZku1sh2FnCItSYP02DqziMPt9eOLxl+isEUJO57e\nFy//PCz6Scj17x4d49U3oujE/cChq0TM+GO3XJfyQQKBgQDVQOIeNUsrpEWdek19\nzpEHbGS062hidP8bw7ubeNqXL0fIDMW2rUxla12Zy1zunxgNiCU0QqKFTd+GW5j+\nasMFnpW5HH9Sxh2YJTkcPsr7kt4W7KGdBsi3U05OlZazlWUu+F7g9MUgQOJbaQuA\np87ulWG9wjD/nnbSeU82vZxjkQKBgQDEgBecgspMC8O3U+b+6ywtciGBLmlyd+3V\nujvOhonKmp03gewKh28G2pZKxAc96CKACJOM/XNk8euvK66VAJ8xpUyqXWvMuoeI\nVk1u2qqM7N5bTsv7QLlqg/W9aFNRJJctyEGa/NPRtCT6cLJesCRCbQrYvTdUHSjt\nO1RXAMHtgwKBgQCueEEHGe8AK4vRBSi1DvVUr3fNFPP36WR14LNyxXOBUWtW3iw8\nApiIOUkA9IJ5r6vMFmDp2sKAcW+4yuPm8o3P4Sj5o7j/jZrUyU9qLm1/WW9eLgcj\nI1O/uOZOINCE6Gs5/HYTce59LtiClPSWM7R3ObwXtfLEj28DT8BhNsvmIQKBgQCe\nOVJJ2VrRfwuaO/odu/n3ohXuchPAc2dUGMB9nQGo3XTItFn/ZGx3RV2NWGlIZPoa\nxE0jUxYu60nO5EqQek61aBfiepUJ5gyqMGvrXjHEhhrJxRok90oVxaoDWNT12pPM\n7po9FWXuTrMT4dkOu6CGyEzalwnNNim1VHemEtsUxwKBgELbybUnhDOSX2yUzaAh\n17BmWPmOfbcG2NeUIl/YJXuiICsCQypQtA6mCmOeRMccxjJGZhDilaGN5iPWhZhs\nlR6ani8mJ8B0ueU9dyJSMoC9l+5HGQi3c+AJO4gv063YJ9qPFKEipG1Jo4OaRoWX\npOpF0ugankXzqVM5Q6r/PrxM\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@voilier-hauturier.iam.gserviceaccount.com",
  "client_id": "112794791190516656996",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40voilier-hauturier.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

// Si vous utilisez l'option 2, assurez-vous que `process.env.FIREBASE_ADMIN_SDK_CONFIG` est défini sur une chaîne vide ou non existante.
// Sinon, il aura priorité.

const fs = require('node:fs/promises');
const path = require('node:path');
const admin = require('firebase-admin');

const DATA_FILE_PATH = path.join(__dirname, 'data', 'bateaux.json');

// Assurez-vous que Firebase Admin SDK est initialisé
const serviceAccount = process.env.FIREBASE_ADMIN_SDK_CONFIG ?
  JSON.parse(Buffer.from(process.env.FIREBASE_ADMIN_SDK_CONFIG, 'base64').toString('utf8')) :
  // Si la variable d'environnement n'est pas définie, tente d'utiliser la constante directe (OPTION 2)
  (typeof RAW_SERVICE_ACCOUNT_JSON !== 'undefined' ? RAW_SERVICE_ACCOUNT_JSON : null);


// Ajout du console.log pour voir le contenu de serviceAccount
console.log('Contenu de serviceAccount (issu de FIREBASE_ADMIN_SDK_CONFIG ou constante directe):', serviceAccount);

if (!serviceAccount) {
  console.error("Erreur: La variable d'environnement FIREBASE_ADMIN_SDK_CONFIG n'est pas définie OU la constante directe n'est pas définie/valide.");
  process.exit(1);
}

// Vérifiez si l'application Admin est déjà initialisée pour éviter les erreurs de réinitialisation
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialisé pour la migration.');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de Firebase Admin SDK:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function migrateData() {
  try {
    const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
    const bateauxJson = JSON.parse(data);

    if (!Array.isArray(bateauxJson)) {
      console.error("Le fichier JSON n'est pas un tableau de bateaux.");
      return;
    }

    console.log(`Début de la migration de ${bateauxJson.length} bateaux vers Firestore...`);

    for (const bateau of bateauxJson) {
      // Déterminer l'ID utilisateur pour ce bateau
      let userIdForBoat;
      if (bateau.id === '1') {
        // Le bateau d'exemple (ID 1) aura un userId spécifique pour les règles de visibilité
        userIdForBoat = 'public-boat-owner'; // Cet ID n'a pas besoin d'être un UID réel d'utilisateur
      } else {
        // Pour les autres bateaux, on peut assigner un userId générique
        // Dans un cas réel, vous assigneriez à l'utilisateur qui a migré le bateau
        userIdForBoat = 'migrated-user';
      }

      // Préparer les données pour Firestore
      const bateauToFirestore = {
        nom_bateau: bateau.nom_bateau || '',
        prix_achat: parseFloat(bateau.prix_achat) || 0,
        description: bateau.description || '',
        // Si l'ancienne structure avait imageUrl, la convertir en tableau d'images
        images: Array.isArray(bateau.images) ? bateau.images : (bateau.imageUrl ? [bateau.imageUrl] : []),
        equipements: Array.isArray(bateau.equipements) ? bateau.equipements : [],
        userId: userIdForBoat, // Ajout du userId
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // Si le bateau a un ID spécifique (comme '1'), on l'utilise
      if (bateau.id) {
        await db.collection('bateaux').doc(bateau.id).set(bateauToFirestore, { merge: true });
        console.log(`Bateau ${bateau.id} (nom: ${bateau.nom_bateau}) migré avec succès.`);
      } else {
        // Pour les bateaux sans ID spécifique, Firestore générera un ID
        const docRef = await db.collection('bateaux').add(bateauToFirestore);
        console.log(`Nouveau bateau (nom: ${bateau.nom_bateau}) ajouté avec l'ID Firestore: ${docRef.id}`);
      }
    }

    console.log('Migration terminée avec succès !');
  } catch (error) {
    console.error('Erreur lors de la migration des données :', error);
  } finally {
    // La migration est un processus qui se termine. Pas besoin de garder l'application Firebase ouverte.
    // Cependant, pour un script simple, process.exit(0) est suffisant.
  }
}

migrateData();
