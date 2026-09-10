import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Badge from '../components/Badge';

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white">
          {user.firstName[0]}{user.lastName[0]}
        </div>
        <h1 className="mt-4 text-xl font-bold text-brand-dark">{user.firstName} {user.lastName}</h1>
        <p className="text-muted">{user.email}</p>
        <div className="mt-3 flex gap-2">
          {user.roles.map((r) => <Badge key={r} tone="brand">{r}</Badge>)}
        </div>
        {Number(user.ratingCount) > 0 && (
          <p className="mt-3 text-sm text-brand-dark">★ {user.ratingAvg} ({user.ratingCount} avis)</p>
        )}
      </div>
    </div>
  );
}
