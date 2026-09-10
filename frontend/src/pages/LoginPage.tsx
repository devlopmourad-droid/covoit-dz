import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connexion impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo variant="icon" className="h-16 w-16 rounded-2xl shadow-sm" />
          <h1 className="mt-4 text-xl font-bold text-brand-dark">Content de vous revoir</h1>
          <p className="mt-1 text-sm text-muted">Connectez-vous pour continuer sur NQASMO</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Mot de passe" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth loading={submitting}>Se connecter</Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Pas encore de compte ?{' '}
          <Link to="/register" className="font-semibold text-brand hover:underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
