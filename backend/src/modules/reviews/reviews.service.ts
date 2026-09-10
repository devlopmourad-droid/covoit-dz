import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Vehicle } from '../vehicles/entities/vehicle.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private reviewsRepo: Repository<Review>,
    @InjectRepository(Booking) private bookingsRepo: Repository<Booking>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Vehicle) private vehiclesRepo: Repository<Vehicle>,
  ) {}

  async create(bookingId: string, reviewerId: string, rating: number, comment?: string) {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['renter', 'owner', 'vehicle'],
    });
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.status !== 'completed') {
      throw new BadRequestException('Seules les locations terminées peuvent être notées.');
    }

    const isRenter = booking.renter.id === reviewerId;
    const isOwner = booking.owner.id === reviewerId;
    if (!isRenter && !isOwner) throw new ForbiddenException('Vous ne participez pas à cette réservation.');

    const direction = isRenter ? 'renter_to_owner' : 'owner_to_renter';
    const existing = await this.reviewsRepo.findOne({ where: { booking: { id: bookingId }, direction } });
    if (existing) throw new ConflictException('Vous avez déjà noté cette location.');

    const reviewer = await this.usersRepo.findOne({ where: { id: reviewerId } });
    const revieweeId = isRenter ? booking.owner.id : booking.renter.id;
    const reviewee = await this.usersRepo.findOne({ where: { id: revieweeId } });
    if (!reviewer || !reviewee) throw new NotFoundException('Utilisateur introuvable.');

    const review = this.reviewsRepo.create({ booking, reviewer, reviewee, direction, rating, comment });
    const saved = await this.reviewsRepo.save(review);

    // Mise à jour de la note moyenne du destinataire (utilisateur, et véhicule si pertinent)
    await this.recomputeUserRating(revieweeId);
    if (direction === 'renter_to_owner') {
      await this.recomputeVehicleRating(booking.vehicle.id);
    }

    return saved;
  }

  private async recomputeUserRating(userId: string) {
    const { avg, count } = await this.reviewsRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.reviewee_id = :userId', { userId })
      .getRawOne();
    await this.usersRepo.update(userId, {
      ratingAvg: avg ? parseFloat(avg).toFixed(1) : '0',
      ratingCount: parseInt(count, 10) || 0,
    });
  }

  private async recomputeVehicleRating(vehicleId: string) {
    const { avg, count } = await this.reviewsRepo
      .createQueryBuilder('r')
      .innerJoin('r.booking', 'b')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('b.vehicle_id = :vehicleId', { vehicleId })
      .andWhere("r.direction = 'renter_to_owner'")
      .getRawOne();
    await this.vehiclesRepo.update(vehicleId, {
      avgRating: avg ? parseFloat(avg).toFixed(1) : '0',
      ratingCount: parseInt(count, 10) || 0,
    });
  }

  async forVehicle(vehicleId: string) {
    return this.reviewsRepo
      .createQueryBuilder('r')
      .innerJoin('r.booking', 'b')
      .where('b.vehicle_id = :vehicleId', { vehicleId })
      .andWhere("r.direction = 'renter_to_owner'")
      .leftJoinAndSelect('r.reviewer', 'reviewer')
      .orderBy('r.created_at', 'DESC')
      .getMany();
  }
}
