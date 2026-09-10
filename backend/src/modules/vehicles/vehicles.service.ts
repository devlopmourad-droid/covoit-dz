import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { SearchVehiclesDto } from './dto/search-vehicles.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle) private vehiclesRepo: Repository<Vehicle>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async create(ownerId: string, dto: CreateVehicleDto) {
    // location est un type PostGIS que TypeORM ne mappe pas nativement pour
    // l'écriture -> on passe par une requête paramétrée directe.
    const result = await this.dataSource.query(
      `INSERT INTO vehicles
        (owner_id, brand, model, year, license_plate, color, seats, fuel_type, transmission,
         commune_id, location, address_label, price_per_day, deposit_amount, min_rental_days,
         max_rental_days, instant_booking, mileage_limit_per_day, description, features, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, ST_SetSRID(ST_MakePoint($12,$11),4326)::geography,
               $13,$14,$15,$16,$17,$18,$19,$20,$21,'pending_review')
       RETURNING id`,
      [
        ownerId,
        dto.brand,
        dto.model,
        dto.year,
        dto.licensePlate,
        dto.color ?? null,
        dto.seats ?? 5,
        dto.fuelType,
        dto.transmission,
        dto.communeId ?? null,
        dto.lat,
        dto.lng,
        dto.addressLabel ?? null,
        dto.pricePerDay,
        dto.depositAmount ?? 0,
        dto.minRentalDays ?? 1,
        dto.maxRentalDays ?? 30,
        dto.instantBooking ?? false,
        dto.mileageLimitPerDay ?? null,
        dto.description ?? null,
        dto.features ?? [],
      ],
    );
    return this.findOne(result[0].id);
  }

  async findOne(id: string) {
    const vehicle = await this.vehiclesRepo.findOne({ where: { id }, relations: ['owner'] });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable.');
    return vehicle;
  }

  async myVehicles(ownerId: string) {
    return this.vehiclesRepo.find({ where: { owner: { id: ownerId } }, order: { createdAt: 'DESC' } });
  }

  async remove(id: string, ownerId: string) {
    const vehicle = await this.findOne(id);
    if (vehicle.owner.id !== ownerId) {
      throw new ForbiddenException("Vous n'êtes pas propriétaire de ce véhicule.");
    }
    await this.vehiclesRepo.update(id, { status: 'archived' });
    return { success: true };
  }

  /**
   * Recherche géolocalisée : véhicules actifs dans un rayon donné, avec
   * distance calculée par PostGIS, et — si des dates sont fournies —
   * exclusion des véhicules déjà réservés ou bloqués sur cette période
   * (LEFT JOIN anti-join sur bookings et vehicle_blocked_periods).
   */
  async search(dto: SearchVehiclesDto) {
    const params: any[] = [dto.lat, dto.lng, dto.radiusKm ?? 25];
    let dateFilter = '';
    if (dto.startAt && dto.endAt) {
      params.push(dto.startAt, dto.endAt);
      dateFilter = `
        AND NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b.vehicle_id = v.id
            AND b.status IN ('pending','confirmed','ongoing')
            AND tstzrange(b.start_at, b.end_at) && tstzrange($${params.length - 1}::timestamptz, $${params.length}::timestamptz)
        )
        AND NOT EXISTS (
          SELECT 1 FROM vehicle_blocked_periods bp
          WHERE bp.vehicle_id = v.id
            AND tstzrange(bp.start_at, bp.end_at) && tstzrange($${params.length - 1}::timestamptz, $${params.length}::timestamptz)
        )`;
    }

    let priceFilter = '';
    if (dto.minPrice != null) {
      params.push(dto.minPrice);
      priceFilter += ` AND v.price_per_day >= $${params.length}`;
    }
    if (dto.maxPrice != null) {
      params.push(dto.maxPrice);
      priceFilter += ` AND v.price_per_day <= $${params.length}`;
    }
    let fuelFilter = '';
    if (dto.fuelType) {
      params.push(dto.fuelType);
      fuelFilter = ` AND v.fuel_type = $${params.length}`;
    }
    let transFilter = '';
    if (dto.transmission) {
      params.push(dto.transmission);
      transFilter = ` AND v.transmission = $${params.length}`;
    }

    return this.dataSource.query(
      `SELECT v.id, v.brand, v.model, v.year, v.seats, v.fuel_type AS "fuelType",
              v.transmission, v.price_per_day AS "pricePerDay", v.instant_booking AS "instantBooking",
              v.avg_rating AS "avgRating", v.rating_count AS "ratingCount",
              ROUND((ST_Distance(v.location, ST_SetSRID(ST_MakePoint($2,$1),4326)::geography) / 1000)::numeric, 1) AS "distanceKm",
              ST_Y(v.location::geometry) AS lat, ST_X(v.location::geometry) AS lng,
              u.first_name AS "ownerFirstName", u.rating_avg AS "ownerRating"
       FROM vehicles v
       JOIN users u ON u.id = v.owner_id
       WHERE v.status = 'active'
         AND ST_DWithin(v.location, ST_SetSRID(ST_MakePoint($2,$1),4326)::geography, $3 * 1000)
         ${dateFilter}${priceFilter}${fuelFilter}${transFilter}
       ORDER BY v.location <-> ST_SetSRID(ST_MakePoint($2,$1),4326)::geography`,
      params,
    );
  }

  /** Utilisé par l'équipe modération/admin pour publier une annonce après vérification. */
  async activate(id: string) {
    await this.vehiclesRepo.update(id, { status: 'active' });
    return this.findOne(id);
  }
}
