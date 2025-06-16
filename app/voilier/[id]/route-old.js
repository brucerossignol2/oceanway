// app/api/voilier/[id]/route.js
// Ceci est un Serverless Function / API Route dans Next.js
// Elle s'exécute uniquement côté serveur.

export async function GET(request, { params }) {
  const { id } = params;

  // Utilisez la variable d'environnement qui est disponible côté serveur ici
  const wordpressApiUrl = process.env.WORDPRESS_API_URL; // Note: pas NEXT_PUBLIC_ ici !

  if (!wordpressApiUrl) {
    console.error("WORDPRESS_API_URL n'est pas défini dans l'environnement du serveur.");
    return new Response(JSON.stringify({ error: "Configuration API WordPress manquante." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(`${wordpressApiUrl}/wp/v2/voilier/${id}?_embed`);

    if (!res.ok) {
      // Si l'API WordPress renvoie une erreur (par exemple 404), renvoyez-la
      const errorText = await res.text(); // Lire le corps de l'erreur
      console.error(`Erreur de l'API WordPress pour l'ID ${id}: ${res.status} ${res.statusText} - ${errorText}`);
      return new Response(JSON.stringify({ error: `Erreur de l'API WordPress: ${res.statusText}`, details: errorText }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`Erreur lors de la récupération des données du voilier (API Route) pour l'ID ${id}:`, error);
    return new Response(JSON.stringify({ error: "Erreur interne du serveur lors de la récupération des données du voilier." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}