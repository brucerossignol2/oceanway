// app/api/bateaux/[id]/route.js
import { NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebaseAdmin'; // Firestore Admin instance
import { authenticateServerSide } from '../../../../lib/authMiddleware'; // Notre utilitaire d'authentification
import * as admin from 'firebase-admin'; // Pour FieldValue.serverTimestamp

// Fonction utilitaire pour récupérer les données du bateau et vérifier les permissions
async function getBateauWithPermissions(bateauId, user) {
  const docRef = adminDb.collection('bateaux').doc(bateauId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return { bateau: null, message: 'Bateau non trouvé1', status: 404 };
  }

  const bateau = { id: docSnap.id, ...docSnap.data() };

  // Règles de lecture
  const isOwner = user && bateau.userId === user.uid;
  const isAdmin = user && user.role === 'admin';
  const isPublic = bateau.userId === 'public-boat-owner';

  if (isPublic || isOwner || isAdmin) {
    return { bateau: bateau, message: null, status: 200 };
  } else {
    return { bateau: null, message: 'Accès non autorisé', status: 403 };
  }
}

// GET /api/bateaux/[id] - Récupère un bateau spécifique
export async function GET(request, { params }) {
  const { id } = await params; 
  const user = await authenticateServerSide(request);
  //const user = await authenticateServerSide(request) || { uid: 'debugUser', role: 'admin' };

  const { bateau, message, status } = await getBateauWithPermissions(id, user);

  if (status !== 200) {
    return NextResponse.json({ message }, { status });
  }
  return NextResponse.json(bateau);
}

// PUT /api/bateaux/[id] - Met à jour un bateau spécifique
export async function PUT(request, { params }) {
  const { id } = await params;  // <-- await obligatoire

  const user = await authenticateServerSide(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  // Interdire la modification du bateau d'exemple (ID '1') sauf si l'utilisateur est admin
  if (id === '1' && user.role !== 'admin') {
    return NextResponse.json({ message: 'Non autorisé à modifier ce bateau.' }, { status: 403 });
  }

  try {
    const data = await request.json();
    const docRef = adminDb.collection('bateaux').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ message: 'Bateau non trouvé2' }, { status: 404 });
    }

    const currentBateau = docSnap.data();

    // Vérifier les permissions de modification (propriétaire ou admin)
    if (currentBateau.userId !== user.uid && user.role !== 'admin') {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 });
    }

    const updatedData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(), // Mettre à jour l'horodatage
      // S'assurer que userId ne peut pas être modifié via PUT par l'utilisateur
      userId: currentBateau.userId,
      // S'assurer que 'images' est un tableau
      images: Array.isArray(data.images) ? data.images : (currentBateau.images || []),
      // S'assurer que 'equipements' est un tableau
      equipements: Array.isArray(data.equipements) ? data.equipements : (currentBateau.equipements || []),
    };

    await docRef.update(updatedData);

    return NextResponse.json({ id: id, ...updatedData }, { status: 200 });

  } catch (error) {
    console.error(`Erreur lors de la mise à jour du bateau ${id} dans Firestore:`, error);
    return NextResponse.json({ message: 'Échec de la mise à jour du bateau' }, { status: 500 });
  }
}

// DELETE /api/bateaux/[id] - Supprime un bateau spécifique
export async function DELETE(request, { params }) {
  const { id } = await params;
  const user = await authenticateServerSide(request);

  if (!user) {
    return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
  }

  // Interdire la suppression du bateau d'exemple (ID '1')
  if (id === '1') {
    return NextResponse.json({ message: 'La suppression du bateau d\'exemple (ID 1) n\'est pas autorisée.' }, { status: 403 });
  }

  try {
    const docRef = adminDb.collection('bateaux').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ message: 'Bateau non trouvé3' }, { status: 404 });
    }

    const bateauToDelete = docSnap.data();

    // Vérifier les permissions de suppression (propriétaire ou admin)
    if (bateauToDelete.userId !== user.uid && user.role !== 'admin') {
      return NextResponse.json({ message: 'Accès non autorisé' }, { status: 403 });
    }

    await docRef.delete();
    return NextResponse.json({ message: 'Bateau supprimé avec succès' }, { status: 200 });

  } catch (error) {
    console.error(`Erreur lors de la suppression du bateau ${id} dans Firestore:`, error);
    return NextResponse.json({ message: 'Échec de la suppression du bateau' }, { status: 500 });
  }
}
