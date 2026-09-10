import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { Vehicle } from './entities/vehicle.entity';
import { VehiclePhoto } from './entities/vehicle-photo.entity';
import { VehicleBlockedPeriod } from './entities/vehicle-blocked-period.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, VehiclePhoto, VehicleBlockedPeriod])],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
