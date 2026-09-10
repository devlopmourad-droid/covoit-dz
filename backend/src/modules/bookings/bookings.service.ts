import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { User } from '../users/entities/user.entity';
import { VehicleInspection, InspectionType } from './entities/vehicle-inspection.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { BUSINESS_RULES } from '../../config/business-rules.config';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking) private bookingsRepo: Repository<Booking>,
    @InjectRepository(Vehicle) private vehiclesRepo: Repository<Vehicle>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(VehicleInspection) private inspectionsRepo: Repository<VehicleInspection>,
  ) {}

  async create(renterId: string, dto: CreateBookingDto) {
    const start = new Date(dto.startAt);
    const end = new Date(dto.endAt);
    if (!(end.getTime() > start.getTime())) {
      throw new BadRequestException('La date de fin doit être après la date de début.');
    }
    if (start.getTime() < Date.now() - 60 * 60 * 1000) {
      throw new BadRequestException('La date de début ne peut pas être dans le passé.');
    }

    const vehicle = await this.vehiclesRepo.findOne({ where: { id: dto.vehicleId }, relations: ['owner'] });
    if (!vehicle) throw new NotFoundException('Véhicule introuvable.');
    if (vehicle.status !== 'active') {
      throw new BadRequestException("Ce véhicule n'est pas disponible à la réservation.");
    }
    if (vehicle.owner.id === renterId) {
      throw new BadRequestException('Vous ne pouvez pas réserver votre propre véhicule.');
    }

    const daysCount = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY));
    if (daysCount < vehicle.minRentalDays) {
      throw new BadRequestException(`Durée minimale de location : ${vehicle.minRentalDays} jour(s).`);
    }
    if (daysCount > vehicle.maxRentalDays) {
      throw new BadRequestException(`Durée maximale de location : ${vehicle.maxRentalDays} jour(s).`);
    }

    const pricePerDay = parseFloat(vehicle.pricePerDay);
    const subtotal = pricePerDay * daysCount;
    const serviceFee = Math.round(subtotal * (BUSINESS_RULES.PLATFORM_SERVICE_FEE_PERCENT / 100) * 100) / 100;
    const protectionFee = 0; // TODO: brancher protection_plans une fois validées juridiquement
    const depositAmount = parseFloat(vehicle.depositAmount) || BUSINESS_RULES.DEFAULT_DEPOSIT_DZD;
    const totalAmount = subtotal + serviceFee + protectionFee;

    const renter = await this.usersRepo.findOne({ where: { id: renterId } });
    if (!renter) throw new NotFoundException('Utilisateur introuvable.');

    const booking = this.bookingsRepo.create({
      vehicle,
      renter,
      owner: vehicle.owner,
      startAt: start,
      endAt: end,
      status: vehicle.instantBooking ? 'confirmed' : 'pending',
      pricePerDay: pricePerDay.toFixed(2),
      daysCount,
      subtotal: subtotal.toFixed(2),
      serviceFee: serviceFee.toFixed(2),
      protectionFee: protectionFee.toFixed(2),
      depositAmount: depositAmount.toFixed(2),
      totalAmount: totalAmount.toFixed(2),
      confirmedAt: vehicle.instantBooking ? new Date() : null,
    });

    try {
      // C'est ICI que la contrainte EXCLUDE de Postgres protège contre les
      // réservations simultanées en conflit : si deux requêtes arrivent au
      // même instant pour des dates qui se chevauchent, l'une des deux
      // provoquera une violation de contrainte (code 23P01), peu importe
      // l'ordre d'exécution — pas besoin de verrou applicatif fragile.
      return await this.bookingsRepo.save(booking);
    } catch (err: any) {
      if (err?.code === '23P01') {
        throw new ConflictException('Ce véhicule est déjà réservé sur une partie de cette période.');
      }
      throw err;
    }
  }

  async findOne(id: string) {
    const booking = await this.bookingsRepo.findOne({
      where: { id },
      relations: ['vehicle', 'renter', 'owner'],
    });
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    return booking;
  }

  async myBookingsAsRenter(renterId: string) {
    return this.bookingsRepo.find({
      where: { renter: { id: renterId } },
      relations: ['vehicle'],
      order: { createdAt: 'DESC' },
    });
  }

  async myBookingsAsOwner(ownerId: string) {
    return this.bookingsRepo.find({
      where: { owner: { id: ownerId } },
      relations: ['vehicle', 'renter'],
      order: { createdAt: 'DESC' },
    });
  }

  async confirm(id: string, ownerId: string) {
    const booking = await this.findOne(id);
    if (booking.owner.id !== ownerId) throw new ForbiddenException('Action réservée au propriétaire.');
    if (booking.status !== 'pending') {
      throw new BadRequestException(`Impossible de confirmer une réservation au statut "${booking.status}".`);
    }
    booking.status = 'confirmed';
    booking.confirmedAt = new Date();
    return this.bookingsRepo.save(booking);
  }

  async reject(id: string, ownerId: string, dto: CancelBookingDto) {
    const booking = await this.findOne(id);
    if (booking.owner.id !== ownerId) throw new ForbiddenException('Action réservée au propriétaire.');
    if (booking.status !== 'pending') {
      throw new BadRequestException(`Impossible de refuser une réservation au statut "${booking.status}".`);
    }
    booking.status = 'rejected';
    booking.cancellationReason = dto.reason ?? null;
    return this.bookingsRepo.save(booking);
  }

  async cancel(id: string, userId: string, dto: CancelBookingDto) {
    const booking = await this.findOne(id);
    const isRenter = booking.renter.id === userId;
    const isOwner = booking.owner.id === userId;
    if (!isRenter && !isOwner) throw new ForbiddenException('Vous ne participez pas à cette réservation.');
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new BadRequestException(`Impossible d'annuler une réservation au statut "${booking.status}".`);
    }

    const hoursUntilStart = (booking.startAt.getTime() - Date.now()) / (60 * 60 * 1000);
    const withinFreeCancellationWindow = hoursUntilStart >= BUSINESS_RULES.FREE_CANCELLATION_WINDOW_HOURS;
    // [CONFIGURABLE - VALIDATION JURIDIQUE] une politique d'annulation avec
    // pénalité doit être définie et validée (remboursement partiel, etc.)
    // avant la mise en production ; pour l'instant on se contente de tracer
    // l'information dans cancellation_reason.

    booking.status = isRenter ? 'cancelled_by_renter' : 'cancelled_by_owner';
    booking.cancelledAt = new Date();
    booking.cancellationReason = dto.reason
      ? `${dto.reason} ${withinFreeCancellationWindow ? '(dans le délai gratuit)' : '(hors délai gratuit — pénalité à définir)'}`
      : null;
    return this.bookingsRepo.save(booking);
  }

  async recordInspection(
    bookingId: string,
    userId: string,
    type: InspectionType,
    data: { mileage?: number; fuelLevelPercent?: number; exteriorNotes?: string; interiorNotes?: string; damagesReported?: boolean },
  ) {
    const booking = await this.findOne(bookingId);
    const isParticipant = booking.renter.id === userId || booking.owner.id === userId;
    if (!isParticipant) throw new ForbiddenException('Vous ne participez pas à cette réservation.');

    if (type === 'check_in' && booking.status !== 'confirmed') {
      throw new BadRequestException("L'état des lieux de départ nécessite une réservation confirmée.");
    }
    if (type === 'check_out' && booking.status !== 'ongoing') {
      throw new BadRequestException("L'état des lieux de retour nécessite une location en cours.");
    }

    const performedBy = await this.usersRepo.findOne({ where: { id: userId } });
    if (!performedBy) throw new NotFoundException('Utilisateur introuvable.');
    const inspection = this.inspectionsRepo.create({
      booking,
      type,
      performedBy,
      ...data,
    });
    await this.inspectionsRepo.save(inspection);

    booking.status = type === 'check_in' ? 'ongoing' : 'completed';
    await this.bookingsRepo.save(booking);

    return inspection;
  }
}
