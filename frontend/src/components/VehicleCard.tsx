import React from 'react';
import { Link } from 'react-router-dom';
import Badge from './Badge';
import { VehicleSearchResult } from '../types';

const FUEL_LABELS: Record<string, string> = {
  essence: 'Essence', diesel: 'Diesel', hybride: 'Hybride', electrique: 'Électrique', gpl: 'GPL',
};

export default function VehicleCard({ vehicle }: { vehicle: VehicleSearchResult }) {
  return (
    <Link
      to={`/vehicles/${vehicle.id}`}
      className="group block overflow-hidden rounded-card border border-gray-100 bg-white transition-shadow hover:shadow-lg hover:shadow-brand-dark/5"
    >
      {/* Pas encore de photos véhicule côté backend (voir docs/ROADMAP.md) —
          espace réservé thématique plutôt qu'un rectangle gris générique */}
      <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-brand-dark to-brand">
        <svg viewBox="0 0 200 60" className="h-16 w-40 opacity-30">
          <path d="M0 50 Q 50 10, 100 50 T 200 50" stroke="white" strokeWidth="3" fill="none" strokeDasharray="8 6" />
        </svg>
        {vehicle.instantBooking && (
          <div className="absolute left-3 top-3">
            <Badge tone="accent">⚡ Instantanée</Badge>
          </div>
        )}
        <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-dark">
          {vehicle.distanceKm} km
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-brand-dark">
            {vehicle.brand} {vehicle.model}
          </h3>
          {Number(vehicle.avgRating) > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-sm text-brand-dark">
              ★ {vehicle.avgRating}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">
          {vehicle.year} · {FUEL_LABELS[vehicle.fuelType] || vehicle.fuelType} · {vehicle.transmission}
        </p>
        <div className="mt-3 flex items-baseline justify-between">
          <p className="font-bold text-brand-dark">
            {vehicle.pricePerDay} DA <span className="text-xs font-normal text-muted">/ jour</span>
          </p>
          <span className="text-xs text-muted group-hover:text-brand">Voir →</span>
        </div>
      </div>
    </Link>
  );
}
