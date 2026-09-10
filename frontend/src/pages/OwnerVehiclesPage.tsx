import React, { useEffect, useState } from 'react';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import { myVehicles, createVehicle } from '../api/vehicles';
import { Vehicle } from '../types';
import { ApiError } from '../api/client';

const STATUS_TONE: Record<string, string> = {
  active: 'text-brand bg-brand-light',
  pending_review: 'text-amber-600 bg-amber-50',
  draft: 'text-muted bg-gray-100',
  paused: 'text-muted bg-gray-100',
  suspended: 'text-red-600 bg-red-50',
};

export default function OwnerVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    brand: '', model: '', year: '2020', licensePlate: '', fuelType: 'essence', transmission: 'manuelle',
    pricePerDay: '', lat: '36.7538', lng: '3.0588', addressLabel: '',
  });

  const load = () => myVehicles().then(setVehicles).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createVehicle({
        ...form,
        year: Number(form.year),
        pricePerDay: Number(form.pricePerDay),
        lat: Number(form.lat),
        lng: Number(form.lng),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de créer cette annonce.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-dark">Mes véhicules</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Annuler' : 'Ajouter un véhicule'}</Button>
      </div>

      {showForm && (
        <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-card border border-gray-100 bg-white p-5">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Marque" required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <Input label="Modèle" required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Année" type="number" required value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            <Input label="Immatriculation" required value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-dark">Carburant</label>
              <select className="w-full rounded-field border border-gray-200 px-4 py-3 text-sm" value={form.fuelType} onChange={(e) => setForm({ ...form, fuelType: e.target.value })}>
                <option value="essence">Essence</option>
                <option value="diesel">Diesel</option>
                <option value="hybride">Hybride</option>
                <option value="electrique">Électrique</option>
                <option value="gpl">GPL</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-dark">Boîte</label>
              <select className="w-full rounded-field border border-gray-200 px-4 py-3 text-sm" value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })}>
                <option value="manuelle">Manuelle</option>
                <option value="automatique">Automatique</option>
              </select>
            </div>
          </div>
          <Input label="Prix / jour (DA)" type="number" required value={form.pricePerDay} onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })} />
          <Input label="Adresse (label libre)" value={form.addressLabel} onChange={(e) => setForm({ ...form, addressLabel: e.target.value })} />
          <p className="text-xs text-muted">
            Coordonnées GPS par défaut : Alger centre — un sélecteur de carte sera ajouté ultérieurement (voir docs/ROADMAP.md).
          </p>
          {error && <p className="rounded-field bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <Button type="submit" loading={submitting}>Publier l'annonce</Button>
        </form>
      )}

      {loading ? (
        <p className="mt-8 text-center text-muted">Chargement…</p>
      ) : vehicles.length === 0 ? (
        <p className="mt-8 text-center text-muted">Aucun véhicule pour l'instant.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {vehicles.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-card border border-gray-100 bg-white p-4">
              <div>
                <p className="font-semibold text-brand-dark">{v.brand} {v.model} ({v.year})</p>
                <p className="text-sm text-muted">{v.pricePerDay} DA / jour</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_TONE[v.status] || 'text-muted bg-gray-100'}`}>
                {v.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
