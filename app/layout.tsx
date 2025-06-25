// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";              // ou "./globals.css"
import { AuthContextProvider } from "../components/AuthContext";
import Navbar from "../components/Navbar";

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
          <main className="min-h-screen bg-gray-100 py-6 mt-20 md:mt-0">
             {children}
          </main>
          {/* Nouveau pied de page ajouté ici */}
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
