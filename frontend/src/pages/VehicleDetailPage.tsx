import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import { getVehicle } from '../api/vehicles';
import { createBooking } from '../api/bookings';
import { Vehicle } from '../types';
import { ApiError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const FUEL_LABELS: Record<string, string> = {
  essence: 'Essence', diesel: 'Diesel', hybride: 'Hybride', electrique: 'Électrique', gpl: 'GPL',
};

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getVehicle(id).then(setVehicle).catch(() => setError('Véhicule introuvable.')).finally(() => setLoading(false));
  }, [id]);

  const daysCount = (() => {
    if (!startDate || !endDate) return 0;
    const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(0, Math.ceil(ms / 86400000));
  })();

  const onBook = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id || !startDate || !endDate) return;
    setBooking(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await createBooking({
        vehicleId: id,
        startAt: new Date(`${startDate}T09:00:00`).toISOString(),
        endAt: new Date(`${endDate}T09:00:00`).toISOString(),
      });
      setSuccess(
        result.status === 'confirmed'
          ? `Réservation confirmée ! Total : ${result.totalAmount} DA + ${result.depositAmount} DA de caution.`
          : 'Demande envoyée — le propriétaire doit la confirmer.',
      );
      setTimeout(() => navigate('/bookings'), 1800);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Réservation impossible.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-4xl px-5 py-16 text-center text-muted">Chargement…</div>;
  }
  if (!vehicle) {
    return <div className="mx-auto max-w-4xl px-5 py-16 text-center text-red-600">{error || 'Véhicule introuvable.'}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-card bg-gradient-to-br from-brand-dark to-brand md:h-80">
        <svg viewBox="0 0 200 60" className="h-20 w-52 opacity-30">
          <path d="M0 50 Q 50 10, 100 50 T 200 50" stroke="white" strokeWidth="3" fill="none" strokeDasharray="8 6" />
        </svg>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <h1 className="text-2xl font-bold text-brand-dark">{vehicle.brand} {vehicle.model} ({vehicle.year})</h1>
          <p className="mt-1 text-muted">Proposé par {vehicle.owner.firstName}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="muted">{vehicle.seats} places</Badge>
            <Badge tone="muted">{FUEL_LABELS[vehicle.fuelType] || vehicle.fuelType}</Badge>
            <Badge tone="muted">{vehicle.transmission}</Badge>
            {vehicle.instantBooking && <Badge tone="accent">⚡ Réservation instantanée</Badge>}
          </div>

          {vehicle.description && <p className="mt-5 leading-relaxed text-brand-dark/80">{vehicle.description}</p>}

          {vehicle.features.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {vehicle.features.map((f) => <Badge key={f} tone="brand">{f}</Badge>)}
            </div>
          )}
        </div>

        <div className="rounded-card border border-gray-100 bg-white p-5 shadow-sm md:sticky md:top-24 md:h-fit">
          <p className="text-2xl font-bold text-brand-dark">
            {vehicle.pricePerDay} DA <span className="text-sm font-normal text-muted">/ jour</span>
          </p>
          <p className="mt-1 text-sm text-muted">Caution : {vehicle.depositAmount} DA</p>

          <div className="mt-4 space-y-3">
            <Input label="Départ" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="Retour" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          {daysCount > 0 && (
            <p className="mt-3 text-sm text-muted">
              {daysCount} jour{daysCount > 1 ? 's' : ''} × {vehicle.pricePerDay} DA
            </p>
          )}

          {error && <p className="mt-3 rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-3 rounded-field bg-brand-light px-3 py-2 text-sm text-brand">{success}</p>}

          <Button fullWidth className="mt-4" loading={booking} onClick={onBook} disabled={!startDate || !endDate}>
            {vehicle.instantBooking ? 'Réserver instantanément' : 'Demander la réservation'}
          </Button>
        </div>
      </div>
    </div>
  );
}
