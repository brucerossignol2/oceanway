// components/Navbar.js
"use client";

import Link from 'next/link';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';

export default function Navbar() {
  const { user, loadingAuth, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      alert("Erreur lors de la déconnexion. Veuillez réessayer.");
    }
  };

  return (
    <nav className="bg-white shadow-md p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/logo-oceanway.png"
            alt="Logo OceanWay"
            width={40}
            height={40}
            className="w-10 h-10 object-contain"
          />
          <span className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
            OceanWay
          </span>
        </Link>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-gray-700 focus:outline-none"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>

        <div
          className={`$ {
            menuOpen ? 'block' : 'hidden'
          } md:flex md:items-center md:space-x-4 absolute md:static top-full left-0 w-full md:w-auto bg-white shadow-md md:shadow-none z-40 md:z-auto px-4 py-2 md:p-0`}
        >
          {!loadingAuth && (
            <>
              {user ? (
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                  <Link
                    href="/profile"
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    Profil ({user.email})
                  </Link>
                  {user.role === 'admin' && (
                    <span className="text-sm font-semibold text-purple-600">(Admin)</span>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="py-1 px-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    Se déconnecter
                  </button>
                </div>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                  <Link
                    href="/login"
                    className="py-1 px-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/signup"
                    className="py-1 px-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    S'inscrire
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
