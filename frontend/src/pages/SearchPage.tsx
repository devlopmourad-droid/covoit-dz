import React, { useEffect, useState, useCallback } from 'react';
import VehicleCard from '../components/VehicleCard';
import { searchVehicles } from '../api/vehicles';
import { VehicleSearchResult } from '../types';

const ALGIERS = { lat: 36.7538259, lng: 3.057841 };

export default function SearchPage() {
  const [results, setResults] = useState<VehicleSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLabel, setLocationLabel] = useState('Alger (par défaut)');
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback((coords: { lat: number; lng: number }) => {
    setLoading(true);
    setError(null);
    searchVehicles({ lat: coords.lat, lng: coords.lng, radiusKm: 30 })
      .then(setResults)
      .catch(() => setError('Impossible de charger les véhicules disponibles.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationLabel('Près de vous');
          runSearch({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => runSearch(ALGIERS),
        { timeout: 5000 },
      );
    } else {
      runSearch(ALGIERS);
    }
  }, [runSearch]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-dark md:text-3xl">Véhicules disponibles</h1>
        <p className="mt-1 text-sm text-muted">{locationLabel} · rayon de 30 km</p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-card bg-gray-100" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-card border border-red-100 bg-red-50 px-5 py-8 text-center text-red-600">{error}</div>
      )}

      {!loading && !error && results.length === 0 && (
        <div className="flex flex-col items-center rounded-card border border-gray-100 bg-white px-5 py-16 text-center">
          <svg viewBox="0 0 200 60" className="mb-4 h-10 w-40 text-brand/30">
            <path d="M0 50 Q 50 10, 100 50 T 200 50" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="8 6" />
          </svg>
          <p className="font-medium text-brand-dark">Aucun véhicule trouvé près de vous</p>
          <p className="mt-1 text-sm text-muted">Essayez d'élargir votre zone de recherche.</p>
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
}
