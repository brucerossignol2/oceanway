// app/bateau/nouveau/page.js
// C'est une page simple qui réutilise le composant BateauDetailPage
// pour gérer la création d'un nouveau bateau.
import BateauDetailPage from '../[id]/page';

export default function NouveauBateauPage() {
  // Le composant BateauDetailPage gérera le cas "nouveau" via son `params.id`
  // Nous passons un objet params simulé pour qu'il le détecte.
  return <BateauDetailPage params={{ id: 'nouveau' }} />;
}
