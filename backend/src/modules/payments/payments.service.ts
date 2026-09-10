import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentPurpose } from './entities/payment.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';

/**
 * Couche de paiement — provider "mock" uniquement pour l'instant.
 * Aucune intégration réelle avec un PSP algérien (SATIM/CIB, Edahabia)
 * n'est en place : cela nécessite un contrat marchand et des accès API
 * réels que je n'ai pas. L'interface ci-dessous est conçue pour qu'un
 * futur PaymentsService.charge() branché sur un vrai provider n'ait pas
 * à changer la logique des autres modules (bookings, etc.) — seul ce
 * fichier serait remplacé.
 */
@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentsRepo: Repository<Payment>,
    @InjectRepository(Booking) private bookingsRepo: Repository<Booking>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async payForBooking(bookingId: string, userId: string) {
    const booking = await this.bookingsRepo.findOne({ where: { id: bookingId }, relations: ['renter'] });
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.renter.id !== userId) throw new ForbiddenException('Seul le locataire peut payer cette réservation.');
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new BadRequestException(`Paiement impossible pour une réservation au statut "${booking.status}".`);
    }

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    const results: Payment[] = [];
    for (const [purpose, amount] of [
      ['rental', parseFloat(booking.totalAmount)],
      ['deposit', parseFloat(booking.depositAmount)],
    ] as [PaymentPurpose, number][]) {
      const payment = this.paymentsRepo.create({
        booking,
        user,
        provider: 'mock',
        purpose,
        amount: amount.toFixed(2),
        currency: 'DZD',
        // En mode mock, on simule un paiement immédiatement capturé pour le
        // loyer, et autorisé (bloqué, non débité) pour la caution — ce qui
        // reflète le fonctionnement usuel d'une marketplace de ce type.
        status: purpose === 'deposit' ? 'authorized' : 'captured',
        providerReference: `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      results.push(await this.paymentsRepo.save(payment));
    }
    return results;
  }

  async listForBooking(bookingId: string) {
    return this.paymentsRepo.find({ where: { booking: { id: bookingId } }, order: { createdAt: 'ASC' } });
  }

  async refundDeposit(bookingId: string) {
    const deposit = await this.paymentsRepo.findOne({
      where: { booking: { id: bookingId }, purpose: 'deposit' },
    });
    if (!deposit) throw new NotFoundException('Aucune caution trouvée pour cette réservation.');
    deposit.status = 'refunded';
    return this.paymentsRepo.save(deposit);
  }
}
