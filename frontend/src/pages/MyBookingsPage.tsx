import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { myBookings } from '../api/bookings';
import { Booking } from '../types';

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'En attente', tone: 'text-amber-600 bg-amber-50' },
  confirmed: { label: 'Confirmée', tone: 'text-brand bg-brand-light' },
  ongoing: { label: 'En cours', tone: 'text-blue-600 bg-blue-50' },
  completed: { label: 'Terminée', tone: 'text-muted bg-gray-100' },
  cancelled_by_renter: { label: 'Annulée', tone: 'text-red-600 bg-red-50' },
  cancelled_by_owner: { label: 'Annulée par le propriétaire', tone: 'text-red-600 bg-red-50' },
  rejected: { label: 'Refusée', tone: 'text-red-600 bg-red-50' },
  disputed: { label: 'Litige en cours', tone: 'text-red-600 bg-red-50' },
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    myBookings('renter').then(setBookings).finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="text-2xl font-bold text-brand-dark">Mes réservations</h1>

      {loading && <p className="mt-8 text-center text-muted">Chargement…</p>}

      {!loading && bookings.length === 0 && (
        <div className="mt-8 rounded-card border border-gray-100 bg-white px-5 py-16 text-center">
          <p className="font-medium text-brand-dark">Aucune réservation pour l'instant</p>
          <Link to="/" className="mt-2 inline-block text-sm font-semibold text-brand hover:underline">
            Trouver un véhicule →
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {bookings.map((b) => {
          const status = STATUS_LABELS[b.status] || { label: b.status, tone: 'text-muted bg-gray-100' };
          return (
            <div key={b.id} className="rounded-card border border-gray-100 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-brand-dark">{b.vehicle.brand} {b.vehicle.model}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {new Date(b.startAt).toLocaleDateString('fr-DZ')} → {new Date(b.endAt).toLocaleDateString('fr-DZ')}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.tone}`}>{status.label}</span>
              </div>
              <p className="mt-3 font-bold text-brand-dark">{b.totalAmount} DA</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
