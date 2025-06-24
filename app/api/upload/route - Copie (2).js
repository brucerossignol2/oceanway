// /app/api/upload/route.js

import { Storage } from '@google-cloud/storage';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';

// Chargement des identifiants depuis l'environnement
const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  : null;

const storage = credentials
  ? new Storage({
      projectId: credentials.project_id,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key.replace(/\\n/g, '\n'),
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
        contentType: file.type
        // ❌ Ne pas inclure predefinedAcl si Uniform access est activé
      };

      await new Promise((resolve, reject) => {
        stream.pipe(gcsFile.createWriteStream(options))
          .on('error', reject)
          .on('finish', resolve);
      });

      // URL publique si les objets sont accessibles (sinon créer une URL signée)
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

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
