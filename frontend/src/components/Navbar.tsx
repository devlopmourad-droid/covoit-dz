import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-2">
          <Logo variant="icon" className="h-9 w-9 rounded-lg" />
          <span className="font-bold text-lg text-brand-dark tracking-tight">NQASMO</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-brand-dark md:flex">
          <Link to="/" className="hover:text-brand">Rechercher</Link>
          {user && <Link to="/bookings" className="hover:text-brand">Mes réservations</Link>}
          {user?.roles.includes('owner') && <Link to="/owner/vehicles" className="hover:text-brand">Mes véhicules</Link>}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/profile" className="hidden text-sm font-medium text-brand-dark hover:text-brand sm:inline">
                {user.firstName}
              </Link>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="rounded-btn border border-gray-200 px-4 py-2 text-sm font-medium text-muted hover:border-red-300 hover:text-red-600"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-btn px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-dark/5">
                Se connecter
              </Link>
              <Link to="/register" className="rounded-btn bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90">
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
