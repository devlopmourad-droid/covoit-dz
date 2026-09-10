import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="px-5 py-16 text-center text-muted">Chargement…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
