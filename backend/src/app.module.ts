import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GeographyModule } from './modules/geography/geography.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AdminModule } from './modules/admin/admin.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HealthController } from './health.controller';

import { Wilaya } from './modules/geography/entities/wilaya.entity';
import { Daira } from './modules/geography/entities/daira.entity';
import { Commune } from './modules/geography/entities/commune.entity';
import { User } from './modules/users/entities/user.entity';
import { UserDocument } from './modules/users/entities/user-document.entity';
import { RefreshToken } from './modules/auth/entities/refresh-token.entity';
import { Vehicle } from './modules/vehicles/entities/vehicle.entity';
import { VehiclePhoto } from './modules/vehicles/entities/vehicle-photo.entity';
import { VehicleBlockedPeriod } from './modules/vehicles/entities/vehicle-blocked-period.entity';
import { Booking } from './modules/bookings/entities/booking.entity';
import { VehicleInspection } from './modules/bookings/entities/vehicle-inspection.entity';
import { Payment } from './modules/payments/entities/payment.entity';
import { ProtectionPlan } from './modules/payments/entities/protection-plan.entity';
import { Conversation } from './modules/messaging/entities/conversation.entity';
import { Message } from './modules/messaging/entities/message.entity';
import { Review } from './modules/reviews/entities/review.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
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
    }),
    AuthModule,
    UsersModule,
    GeographyModule,
    VehiclesModule,
    BookingsModule,
    PaymentsModule,
    MessagingModule,
    ReviewsModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    // JwtAuthGuard global : toute route est protégée par défaut, sauf
    // celles marquées @Public() explicitement (liste blanche plutôt que
    // liste noire — plus sûr par défaut pour une marketplace).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // ClassSerializerInterceptor global : applique les @Exclude() définis
    // sur les entités (ex. password_hash) à TOUTE réponse de l'API, y
    // compris les entités imbriquées via des relations (ex. vehicle.owner).
    // C'est un filet de sécurité au niveau plateforme plutôt qu'une
    // discipline à appliquer manuellement dans chaque contrôleur.
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector) => new ClassSerializerInterceptor(reflector, { excludeExtraneousValues: false }),
      inject: [Reflector],
    },
  ],
})
export class AppModule {}
