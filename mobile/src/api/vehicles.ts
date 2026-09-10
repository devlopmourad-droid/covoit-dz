import { apiRequest } from './client';
import { Vehicle, VehicleSearchResult } from '../types';

export async function searchVehicles(params: {
  lat: number;
  lng: number;
  radiusKm?: number;
  startAt?: string;
  endAt?: string;
}): Promise<VehicleSearchResult[]> {
  const qs = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radiusKm: String(params.radiusKm ?? 25),
    ...(params.startAt ? { startAt: params.startAt } : {}),
    ...(params.endAt ? { endAt: params.endAt } : {}),
  });
  return apiRequest<VehicleSearchResult[]>(`/vehicles/search?${qs.toString()}`, { auth: false });
}

export async function getVehicle(id: string): Promise<Vehicle> {
  return apiRequest<Vehicle>(`/vehicles/${id}`, { auth: false });
}
