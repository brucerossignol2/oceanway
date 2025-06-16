import './globals.css'; // Assurez-vous que ce fichier existe et contient les imports Tailwind

export const metadata = {
  title: 'Calculateur Budget Voilier',
  description: 'Application de gestion de fiches de voiliers et calcul de budget.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="bg-gray-100 text-gray-800 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}