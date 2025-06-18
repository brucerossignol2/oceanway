// components/Navbar.js
"use client";

import Link from 'next/link';
import { useAuth } from './AuthContext'; // Importe notre hook d'authentification
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, loadingAuth, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login'); // Redirige vers la page de connexion après déconnexion
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      alert("Erreur lors de la déconnexion. Veuillez réessayer."); // Utiliser une alerte temporaire pour l'instant
    }
  };

  return (
    <nav className="bg-white shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
          ⛵ OceanWay
        </Link>
        <div className="space-x-4">
          {!loadingAuth && ( // N'affiche les liens qu'une fois l'état d'authentification chargé
            <>
              {user ? (
                <>
                  <Link href="/profile" className="text-gray-700 hover:text-blue-600 transition-colors">
                    Profil ({user.email})
                  </Link>
                  {user.role === 'admin' && (
                     <span className="text-sm font-semibold text-purple-600"> (Admin)</span>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="py-1 px-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="py-1 px-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                    Se connecter
                  </Link>
                  <Link href="/signup" className="py-1 px-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
                    S'inscrire
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
