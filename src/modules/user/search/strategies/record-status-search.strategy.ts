import { InjectRepository } from '@nestjs/typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FindOptionsOrderValue, Repository } from 'typeorm';

import { User } from '@/modules/user/entities/user.entity';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { UserSearchStrategy } from '@/modules/user/search/user-search-strategy.interface';
import { UserSearchAndPaginationDto } from '@/modules/user/dto/user-search-and-pagination.dto';

@Injectable()
export class RecordStatusSearchStrategy implements UserSearchStrategy {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(params: UserSearchAndPaginationDto): Promise<User[]> {
    const { limit, offset, order, term } = params;
    const recordStatusTerm = term.toLowerCase();

    const validRecordStatus = ['active', 'inactive'];

    if (!validRecordStatus.includes(recordStatusTerm)) {
      throw new BadRequestException(`Estado de registro no válido: ${term}`);
    }

    const users = await this.userRepository.find({
      where: {
        recordStatus: recordStatusTerm,
      },
      take: limit,
      skip: offset,
      relations: ['updatedBy', 'createdBy', 'churches', 'ministries'],
      order: { createdAt: order as FindOptionsOrderValue },
    });

    if (users.length === 0) {
      const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

      throw new NotFoundException(
        `No se encontraron usuarios con este estado de registro: ${value}`,
      );
    }

    return users;
  }
}
