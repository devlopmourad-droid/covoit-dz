import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Vehicle } from '../vehicles/entities/vehicle.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(Vehicle) private vehiclesRepo: Repository<Vehicle>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) {}

  async stats() {
    const [users, vehicles, bookingsByStatus] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE 'owner' = ANY(roles))::int AS owners FROM users`),
      this.dataSource.query(`SELECT status, COUNT(*)::int AS count FROM vehicles GROUP BY status`),
      this.dataSource.query(`SELECT status, COUNT(*)::int AS count FROM bookings GROUP BY status`),
    ]);
    return { users: users[0], vehiclesByStatus: vehicles, bookingsByStatus };
  }

  async pendingVehicles() {
    return this.vehiclesRepo.find({ where: { status: 'pending_review' }, relations: ['owner'] });
  }

  async listUsers(limit = 50) {
    return this.usersRepo.find({ take: limit, order: { createdAt: 'DESC' } });
  }
}
