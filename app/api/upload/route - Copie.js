// app/api/upload/route.js

import { Storage } from '@google-cloud/storage';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

// Chargement des identifiants Firebase depuis les variables d'environnement
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  : null;

const storage = credentials
  ? new Storage({
      projectId: credentials.project_id,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    })
  : null;

const bucketName = process.env.NEXT_PUBLIC_GCS_BUCKET_NAME;

export async function POST(request) {
  if (!storage || !bucketName) {
    console.error("GCS configuration missing.");
    return NextResponse.json(
      { message: 'Erreur de configuration GCS.' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'Aucun fichier reçu.' }, { status: 400 });
    }

    const urls = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const gcsFile = storage.bucket(bucketName).file(fileName);

      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);

      const options = {
        contentType: file.type,
        // Supprime le champ "predefinedAcl" car le bucket utilise uniform access
      };

      await new Promise((resolve, reject) => {
        stream.pipe(gcsFile.createWriteStream(options))
          .on('error', reject)
          .on('finish', resolve);
      });

      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      urls.push(publicUrl);
    }

    return NextResponse.json({ urls }, { status: 200 });

  } catch (error) {
    console.error('Erreur upload Firebase Storage :', error);
    return NextResponse.json(
      { message: 'Erreur upload', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  if (!storage || !bucketName) {
    console.error("GCS configuration missing.");
    return NextResponse.json(
      { message: 'Erreur de configuration GCS.' },
      { status: 500 }
    );
  }

  try {
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ message: 'imageUrl manquant' }, { status: 400 });
    }

    // Extrait le nom du fichier à partir de l'URL publique
    const fileName = decodeURIComponent(imageUrl.split(`/${bucketName}/`)[1]);
    if (!fileName) {
      return NextResponse.json({ message: 'Nom de fichier invalide.' }, { status: 400 });
    }

    const file = storage.bucket(bucketName).file(fileName);
    await file.delete();

    return NextResponse.json({ message: 'Image supprimée avec succès.' }, { status: 200 });

  } catch (error) {
    console.error('Erreur suppression image GCS :', error);
    return NextResponse.json(
      { message: 'Erreur suppression image', error: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
