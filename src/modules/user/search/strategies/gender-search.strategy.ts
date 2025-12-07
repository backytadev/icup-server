import { InjectRepository } from '@nestjs/typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FindOptionsOrderValue, Repository } from 'typeorm';

import { User } from '@/modules/user/entities/user.entity';
import { GenderNames } from '@/common/enums/gender.enum';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { UserSearchStrategy } from '@/modules/user/search/user-search-strategy.interface';
import { UserSearchAndPaginationDto } from '@/modules/user/dto/user-search-and-pagination.dto';

@Injectable()
export class GenderSearchStrategy implements UserSearchStrategy {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(params: UserSearchAndPaginationDto): Promise<User[]> {
    const { limit, offset, order, term } = params;
    const genderTerm = term.toLowerCase();

    const validGenders = ['male', 'female'];

    if (!validGenders.includes(genderTerm)) {
      throw new BadRequestException(`Género no válido: ${term}`);
    }

    const users = await this.userRepository.find({
      where: {
        gender: genderTerm,
        recordStatus: RecordStatus.Active,
      },
      take: limit,
      skip: offset,
      relations: ['updatedBy', 'createdBy', 'churches', 'ministries'],
      order: { createdAt: order as FindOptionsOrderValue },
    });

    if (users.length === 0) {
      const genderInSpanish = GenderNames[term.toLowerCase()] ?? term;

      throw new NotFoundException(
        `No se encontraron usuarios con este género: ${genderInSpanish}`,
      );
    }

    return users;
  }
}
