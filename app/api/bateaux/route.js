// app/api/bateaux/route.js
import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebaseAdmin';
import { authenticateServerSide } from '../../../lib/authMiddleware';
import { FieldValue } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

// GET /api/bateaux
export async function GET(request) {
  try {
    const user = await authenticateServerSide(request);

    if (!user) {
      // Utilisateur non authentifié → retourne uniquement le bateau public (id = "1")
      const publicBoatDoc = await adminDb.collection('bateaux').doc('1').get();
      if (publicBoatDoc.exists) {
        return NextResponse.json([{ id: publicBoatDoc.id, ...publicBoatDoc.data() }]);
      } else {
        return NextResponse.json([]);
      }
    }

    // Utilisateur authentifié → admin voit tous, sinon siens + public
    const snapshot = await adminDb.collection('bateaux').get();
    const bateaux = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(bateau =>
        user.role === 'admin' ||
        bateau.userId === user.uid ||
        bateau.userId === 'public-boat-owner'
      );

    return NextResponse.json(bateaux);
  } catch (error) {
    console.error('Erreur récupération bateaux:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}

// POST /api/bateaux
export async function POST(request) {
  try {
    const user = await authenticateServerSide(request);
    if (!user) {
      return NextResponse.json({ message: 'Non authentifié' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.nom_bateau || typeof data.nom_bateau !== 'string') {
      return NextResponse.json({ message: 'Nom du bateau manquant ou invalide' }, { status: 400 });
    }

    // Transaction pour incrémenter et récupérer nextId
    const newId = await adminDb.runTransaction(async (tx) => {
      const counterRef = adminDb.collection('counters').doc('bateaux');
      const counterSnap = await tx.get(counterRef);
      let nextId = 1;

      if (counterSnap.exists && typeof counterSnap.data().nextId === 'number') {
        nextId = counterSnap.data().nextId + 1;
      }
      tx.set(counterRef, { nextId }, { merge: true });
      return nextId;
    });

    // Préparation du document bateau
    const newBateauData = {
      ...data,
      userId: user.uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      images: Array.isArray(data.images) ? data.images : [],
      equipements: Array.isArray(data.equipements) ? data.equipements : [],
    };

    // Création avec l’ID séquentiel
    await adminDb.collection('bateaux').doc(String(newId)).set(newBateauData);

    return NextResponse.json({ id: String(newId), ...newBateauData }, { status: 201 });
  } catch (error) {
    console.error('Erreur création bateau séquentielle :', error);
    return NextResponse.json({ message: 'Échec de la création du bateau' }, { status: 500 });
  }
}
