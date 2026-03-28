'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, LogOut, LayoutDashboard, Heart } from 'lucide-react';

export default function Navbar() {
  const { user, signInWithGoogle, logout, loading } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-200 group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-600 to-orange-500">
              UndanganKita
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 text-gray-600 hover:text-pink-600 transition-colors font-medium"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                  <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border border-gray-200"
                  />
                  <button
                    onClick={logout}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 bg-pink-600 text-white px-5 py-2 rounded-full hover:bg-pink-700 transition-all shadow-md hover:shadow-lg active:scale-95 font-medium"
              >
                <LogIn className="w-5 h-5" />
                <span>Mulai Sekarang</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
