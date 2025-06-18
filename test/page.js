// test/page.js
// encode_service_account.js


// encode_service_account.js
const fs = require('fs');
const path = require('path');
// Remplacez par le chemin réel de votre fichier JSON de clé de service
const serviceAccountPath = path.resolve('serviceAccountKey.json'); 
try {
  const serviceAccount = fs.readFileSync(serviceAccountPath, 'utf8');
  const encoded = Buffer.from(serviceAccount).toString('base64');
  console.log(encoded);
} catch (error) {
  console.error("Erreur lors de la lecture ou de l'encodage du fichier de clé de service:", error);
}
