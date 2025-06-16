// app/api/bateaux/[id]/route.js
import { getBateauById, updateBateau, deleteBateau } from '../../../../lib/data';
import { NextResponse } from 'next/server';

// Gérer la requête GET (Récupérer un bateau par ID)
export async function GET(request, { params }) {
  const { id } = params;
  const bateau = getBateauById(id);
  if (bateau) {
    return NextResponse.json(bateau);
  } else {
    return NextResponse.json({ message: 'Bateau non trouvé' }, { status: 404 });
  }
}

// Gérer la requête PUT (Mettre à jour un bateau par ID)
export async function PUT(request, { params }) {
  const { id } = params;
  try {
    const updatedBateauData = await request.json();
    const updatedBateau = updateBateau(id, updatedBateauData);
    if (updatedBateau) {
      return NextResponse.json(updatedBateau);
    } else {
      return NextResponse.json({ message: 'Bateau non trouvé' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du bateau ${id} :`, error);
    return NextResponse.json({ message: 'Erreur interne du serveur lors de la mise à jour.' }, { status: 500 });
  }
}

// Gérer la requête DELETE (Supprimer un bateau par ID)
export async function DELETE(request, { params }) {
  const { id } = params;
  const deleted = deleteBateau(id);
  if (deleted) {
    return new Response(null, { status: 204 }); // 204 No Content
  } else {
    return NextResponse.json({ message: 'Bateau non trouvé' }, { status: 404 });
  }
}