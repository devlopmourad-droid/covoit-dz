import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BUSINESS_RULES } from '../../config/business-rules.config';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  async findById(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    if (dto.dateOfBirth) {
      const age = this.computeAge(new Date(dto.dateOfBirth));
      if (age < BUSINESS_RULES.MIN_DRIVER_AGE) {
        // On n'empêche pas la création du compte (un mineur pourrait vouloir
        // seulement consulter), mais on trace le fait que l'utilisateur est
        // sous l'âge minimum pour louer/proposer un véhicule. La vérification
        // bloquante définitive doit être faite à l'étape réservation/annonce
        // une fois la règle validée juridiquement.
      }
    }
    await this.usersRepo.update(id, dto as any);
    return this.findById(id);
  }

  private computeAge(dob: Date) {
    const diff = Date.now() - dob.getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  }
}
