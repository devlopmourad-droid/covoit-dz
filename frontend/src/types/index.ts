export type UserRole = 'renter' | 'owner' | 'admin' | 'support';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  ratingAvg?: string;
  ratingCount?: number;
}

export interface VehicleSearchResult {
  id: string;
  brand: string;
  model: string;
  year: number;
  seats: number;
  fuelType: string;
  transmission: string;
  pricePerDay: string;
  instantBooking: boolean;
  avgRating: string;
  ratingCount: number;
  distanceKm: string;
  lat: number;
  lng: number;
  ownerFirstName: string;
  ownerRating: string;
}

export interface Vehicle extends Omit<VehicleSearchResult, 'distanceKm' | 'ownerFirstName' | 'ownerRating'> {
  licensePlate: string;
  color: string | null;
  addressLabel: string | null;
  depositAmount: string;
  minRentalDays: number;
  maxRentalDays: number;
  status: string;
  description: string | null;
  features: string[];
  owner: User;
}

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'ongoing'
  | 'completed'
  | 'cancelled_by_renter'
  | 'cancelled_by_owner'
  | 'rejected'
  | 'disputed';

export interface Booking {
  id: string;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  pricePerDay: string;
  daysCount: number;
  subtotal: string;
  serviceFee: string;
  totalAmount: string;
  depositAmount: string;
  vehicle: Vehicle;
  renter?: User;
  owner?: User;
}
