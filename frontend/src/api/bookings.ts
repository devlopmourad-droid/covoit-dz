import { apiRequest } from './client';
import { Booking } from '../types';

export async function createBooking(input: { vehicleId: string; startAt: string; endAt: string }): Promise<Booking> {
  return apiRequest<Booking>('/bookings', { method: 'POST', body: input });
}

export async function myBookings(as: 'renter' | 'owner' = 'renter'): Promise<Booking[]> {
  return apiRequest<Booking[]>(`/bookings/mine?as=${as}`);
}

export async function cancelBooking(id: string, reason?: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${id}/cancel`, { method: 'PATCH', body: { reason } });
}
