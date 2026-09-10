import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Wilaya } from '../modules/geography/entities/wilaya.entity';
import { Daira } from '../modules/geography/entities/daira.entity';
import { Commune } from '../modules/geography/entities/commune.entity';
import { User } from '../modules/users/entities/user.entity';
import { UserDocument } from '../modules/users/entities/user-document.entity';
import { RefreshToken } from '../modules/auth/entities/refresh-token.entity';
import { Vehicle } from '../modules/vehicles/entities/vehicle.entity';
import { VehiclePhoto } from '../modules/vehicles/entities/vehicle-photo.entity';
import { VehicleBlockedPeriod } from '../modules/vehicles/entities/vehicle-blocked-period.entity';
import { Booking } from '../modules/bookings/entities/booking.entity';
import { VehicleInspection } from '../modules/bookings/entities/vehicle-inspection.entity';
import { Payment } from '../modules/payments/entities/payment.entity';
import { ProtectionPlan } from '../modules/payments/entities/protection-plan.entity';
import { Conversation } from '../modules/messaging/entities/conversation.entity';
import { Message } from '../modules/messaging/entities/message.entity';
import { Review } from '../modules/reviews/entities/review.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // Le schéma est géré à la main via database/schema.sql (migrations SQL
  // explicites, plus prévisible qu'une génération automatique pour un
  // schéma avec des contraintes PostGIS/EXCLUDE). synchronize reste donc
  // désactivé : les entités DOIVENT rester en phase avec schema.sql.
  synchronize: false,
  logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  entities: [
    Wilaya,
    Daira,
    Commune,
    User,
    UserDocument,
    RefreshToken,
    Vehicle,
    VehiclePhoto,
    VehicleBlockedPeriod,
    Booking,
    VehicleInspection,
    Payment,
    ProtectionPlan,
    Conversation,
    Message,
    Review,
  ],
});
