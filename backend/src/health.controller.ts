import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Public } from './common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  @Public()
  @Get()
  async check() {
    // Un healthcheck qui ne vérifie pas la base est trompeur : le process
    // Node peut être "up" alors que la DB est injoignable. On fait un
    // aller-retour minimal plutôt qu'un simple "200 OK" statique.
    try {
      await this.dataSource.query('SELECT 1');
    } catch (err) {
      throw new ServiceUnavailableException('Base de données injoignable.');
    }
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
