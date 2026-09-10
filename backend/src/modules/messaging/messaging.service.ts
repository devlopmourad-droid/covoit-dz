import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(Conversation) private convRepo: Repository<Conversation>,
    @InjectRepository(Message) private msgRepo: Repository<Message>,
    @InjectRepository(Booking) private bookingsRepo: Repository<Booking>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async getOrCreateForBooking(bookingId: string, userId: string) {
    const booking = await this.bookingsRepo.findOne({
      where: { id: bookingId },
      relations: ['renter', 'owner', 'vehicle'],
    });
    if (!booking) throw new NotFoundException('Réservation introuvable.');
    if (booking.renter.id !== userId && booking.owner.id !== userId) {
      throw new ForbiddenException('Vous ne participez pas à cette réservation.');
    }

    let conv = await this.convRepo.findOne({ where: { booking: { id: bookingId } } });
    if (!conv) {
      conv = this.convRepo.create({
        booking,
        vehicle: booking.vehicle,
        renter: booking.renter,
        owner: booking.owner,
      });
      conv = await this.convRepo.save(conv);
    }
    return conv;
  }

  async sendMessage(bookingId: string, senderId: string, content: string) {
    const conv = await this.getOrCreateForBooking(bookingId, senderId);
    const sender = await this.usersRepo.findOne({ where: { id: senderId } });
    if (!sender) throw new NotFoundException('Utilisateur introuvable.');
    const message = this.msgRepo.create({ conversation: conv, sender, content });
    return this.msgRepo.save(message);
  }

  async listMessages(bookingId: string, userId: string) {
    const conv = await this.getOrCreateForBooking(bookingId, userId);
    return this.msgRepo.find({
      where: { conversation: { id: conv.id } },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }
}
