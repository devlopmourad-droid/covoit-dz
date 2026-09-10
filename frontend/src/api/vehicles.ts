import { apiRequest } from './client';
import { Vehicle, VehicleSearchResult } from '../types';

export async function searchVehicles(params: { lat: number; lng: number; radiusKm?: number }): Promise<VehicleSearchResult[]> {
  const qs = new URLSearchParams({
    lat: String(params.lat),
    lng: String(params.lng),
    radiusKm: String(params.radiusKm ?? 25),
  });
  return apiRequest<VehicleSearchResult[]>(`/vehicles/search?${qs.toString()}`, { auth: false });
}

export async function getVehicle(id: string): Promise<Vehicle> {
  return apiRequest<Vehicle>(`/vehicles/${id}`, { auth: false });
}

export async function createVehicle(input: Record<string, unknown>): Promise<Vehicle> {
  return apiRequest<Vehicle>('/vehicles', { method: 'POST', body: input });
}

export async function myVehicles(): Promise<Vehicle[]> {
  return apiRequest<Vehicle[]>('/vehicles');
}
