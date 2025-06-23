

//app/bateaux/[id]/page.jsx
import FicheBateau from "../../../components/FicheBateau";
import { cookies } from "next/headers"; // ✅ Pour accéder au cookie de session côté serveur

async function getBateau(id) {
  const cookieStore = cookies();
  const token = cookieStore.get("__session")?.value; // 🔄 Adapte le nom du cookie ici si besoin

  const res = await fetch(`http://localhost:3000/api/bateaux/${id}`, {
    cache: "no-store",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    return null;
  }
  return res.json();
}

export async function generateMetadata({ params }) {
  const { id } = params;
  return {
    title: `Bateau ${id}`,
    // Tu peux ajouter d’autres métadonnées si besoin
  };
}

export default async function Page({ params }) {
  const { id } = params;
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
