import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeographyService } from './geography.service';
import { GeographyController } from './geography.controller';
import { Wilaya } from './entities/wilaya.entity';
import { Commune } from './entities/commune.entity';
import { Daira } from './entities/daira.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wilaya, Commune, Daira])],
  controllers: [GeographyController],
  providers: [GeographyService],
  exports: [GeographyService],
})
export class GeographyModule {}
