// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from "../components/AuthContext";
import Navbar from "../components/Navbar";
import { ToastContainer } from 'react-toastify'; // Importe ToastContainer
import 'react-toastify/dist/ReactToastify.css'; // Importe le CSS de react-toastify pour les styles par défaut

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OceanWay",
  description: "Calcul de votre budget voilier pour la haute mer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <AuthContextProvider>
          <Navbar />
          <main className="min-h-screen bg-gray-100 py-6">
            {children}
          </main>
          {/* Le ToastContainer est placé ici pour être disponible globalement dans l'application */}
          {/* Il affichera les notifications (succès, erreur, etc.) déclenchées par react-toastify */}
          <ToastContainer
            position="bottom-right" // Position des notifications
            autoClose={3000} // Ferme automatiquement après 3 secondes
            hideProgressBar={false} // Affiche la barre de progression
            newestOnTop={false} // Les nouvelles notifications apparaissent en bas
            closeOnClick // Ferme la notification au clic
            rtl={false} // Pas de support de droite à gauche
            pauseOnFocusLoss // Met en pause la fermeture automatique si l'utilisateur quitte l'onglet
            draggable // Les notifications peuvent être glissées
            pauseOnHover // Met en pause la fermeture automatique au survol
          />
          <footer className="bg-gray-800 text-white p-4 text-center text-sm">
            Créé par{' '}
            <a href="https://br-net.fr" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              br-net.fr
            </a>
          </footer>
        </AuthContextProvider>
      </body>
    </html>
  );
}
