// app/api/upload/route.js
// Cette route API gère l'upload de fichiers vers Google Cloud Storage.

import { Storage } from '@google-cloud/storage';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

// Il est crucial que le fichier JSON des identifiants du compte de service soit disponible
// via une variable d'environnement. Pour Vercel, vous collerez le contenu JSON
// dans une variable nommée GOOGLE_APPLICATION_CREDENTIALS_JSON.
// Pour le développement local, assurez-vous d'avoir cette variable dans .env.local.
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  : null;

// Initialise le client Google Cloud Storage avec les identifiants.
// Si les identifiants ne sont pas chargés, le client ne sera pas initialisé.
const storage = credentials
  ? new Storage({
      projectId: credentials.project_id,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    })
  : null;

// Nom de votre bucket GCS. Assurez-vous que cette variable est aussi configurée
// dans vos variables d'environnement Vercel et .env.local (ex: NEXT_PUBLIC_GCS_BUCKET_NAME).
const bucketName = process.env.NEXT_PUBLIC_GCS_BUCKET_NAME;

// Gère les requêtes POST pour l'upload de fichiers
export async function POST(request) {
  // Vérifie si les identifiants ou le nom du bucket sont manquants
  if (!storage || !bucketName) {
    console.error("GCS configuration missing: storage client or bucket name not initialized.");
    return NextResponse.json(
      { message: 'Erreur de configuration du serveur pour GCS.' },
      { status: 500 }
    );
  }

  try {
    // Parse les données du formulaire de la requête
    const formData = await request.formData();
    const file = formData.get('file'); // 'file' est le nom du champ dans le formulaire

    // Vérifie si un fichier a été envoyé
    if (!file) {
      return NextResponse.json({ message: 'Aucun fichier fourni.' }, { status: 400 });
    }

    // Convertit le fichier en un buffer et le nom du fichier
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`; // Crée un nom de fichier unique

    const gcsFile = storage.bucket(bucketName).file(fileName);

    // Crée un flux lisible à partir du buffer
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null); // Indique la fin du flux

    // Options pour l'upload, y compris le type de contenu
    const options = {
      contentType: file.type,
      predefinedAcl: 'publicRead', // Rend le fichier publiquement accessible après l'upload
                                   // Assurez-vous que votre bucket a les permissions 'allUsers: Storage Object Viewer'
    };

    // Upload le fichier vers GCS
    await new Promise((resolve, reject) => {
      stream.pipe(gcsFile.createWriteStream(options))
        .on('error', (err) => {
          console.error('Erreur lors de l\'upload vers GCS:', err);
          reject(err);
        })
        .on('finish', () => {
          resolve();
        });
    });

    // Construit l'URL publique de l'image.
    // Pour les buckets configurés en 'Uniform access' et 'allUsers: Storage Object Viewer',
    // l'URL est de la forme: https://storage.googleapis.com/your-bucket-name/your-file-name
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

    return NextResponse.json({ url: publicUrl }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { message: 'Échec de l\'upload du fichier.', error: error.message },
      { status: 500 }
    );
  }
}

// Exportez une fonction OPTIONS pour gérer les requêtes CORS si nécessaire,
// bien que Next.js le gère souvent automatiquement.
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

