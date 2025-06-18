// app/bateaux/[id]/page.jsx
import FicheBateau from '../../../components/FicheBateau';

async function getBateau(id) {
  const res = await fetch(`http://localhost:3000/api/bateaux/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Bateau ${id}`,
    // tu peux ajouter d’autres métadonnées si besoin
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const initialBateau = await getBateau(id);

  if (!initialBateau) {
    return <p>Bateau non trouvé.</p>;
  }

  return (
    <div>
      <FicheBateau initialBateau={initialBateau} isNewBateau={false} />
    </div>
  );
}
