import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../api/client';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'renter' | 'owner'>('renter');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setSubmitting(true);
    try {
      await register({ email: email.trim().toLowerCase(), password, firstName, lastName, roles: [role] });
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Inscription impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo variant="icon" className="h-16 w-16 rounded-2xl shadow-sm" />
          <h1 className="mt-4 text-xl font-bold text-brand-dark">Rejoignez NQASMO</h1>
          <p className="mt-1 text-sm text-muted">نتقاسموا الطريق — partageons la route</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="Nom" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <Input label="Email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Mot de passe" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-brand-dark">Je veux…</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('renter')}
                className={`rounded-field border px-3 py-2.5 text-sm font-medium ${role === 'renter' ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-muted'}`}
              >
                Louer un véhicule
              </button>
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={`rounded-field border px-3 py-2.5 text-sm font-medium ${role === 'owner' ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-muted'}`}
              >
                Proposer le mien
              </button>
            </div>
          </div>

          {error && <p className="rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" fullWidth loading={submitting}>Créer mon compte</Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Déjà inscrit ?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}
