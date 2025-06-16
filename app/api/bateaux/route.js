// app/api/bateaux/route.js
import { getAllBateaux, createBateau } from '../../../lib/data';
import { NextResponse } from 'next/server';

// Gérer la requête GET (Récupérer tous les bateaux)
export async function GET() {
  const bateaux = getAllBateaux();
  return NextResponse.json(bateaux);
}

// Gérer la requête POST (Créer un nouveau bateau)
export async function POST(request) {
  try {
    const newBateauData = await request.json();
    const newBateau = createBateau(newBateauData);
    return NextResponse.json(newBateau, { status: 201 }); // 201 Created
  } catch (error) {
    console.error('Erreur lors de la création du bateau :', error);
    return NextResponse.json({ message: 'Erreur interne du serveur lors de la création du bateau.' }, { status: 500 });
  }
}