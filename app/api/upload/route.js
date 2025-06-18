// app/api/upload/route.js
import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid'; // Pour générer des noms de fichiers uniques

// Installez uuid si ce n'est pas déjà fait: npm install uuid

// Chemin où les images seront stockées dans le dossier public
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images');

export async function POST(request) {
  try {
    // Vérifier si le répertoire d'upload existe, sinon le créer
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const formData = await request.formData();
    const files = formData.getAll('files'); // Récupère tous les fichiers sous la clé 'files'

    if (!files || files.length === 0) {
      return NextResponse.json({ message: 'Aucun fichier fourni.' }, { status: 400 });
    }

    const uploadedFilePaths = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        console.warn('Un élément du formulaire n\'est pas un objet File :', file);
        continue; // Passer aux éléments non-fichier
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Générer un nom de fichier unique pour éviter les collisions
      const fileExtension = path.extname(file.name);
      const uniqueFileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join(UPLOAD_DIR, uniqueFileName);

      await fs.writeFile(filePath, buffer);
      uploadedFilePaths.push(`/images/${uniqueFileName}`); // URL publique de l'image
    }

    return NextResponse.json({
      message: 'Fichiers téléchargés avec succès',
      urls: uploadedFilePaths,
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors du téléchargement des fichiers :', error);
    return NextResponse.json({ message: 'Échec du téléchargement des fichiers', error: error.message }, { status: 500 });
  }
}
