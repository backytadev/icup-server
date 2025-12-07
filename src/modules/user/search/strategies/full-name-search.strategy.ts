import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue, ILike, Repository } from 'typeorm';

import { User } from '@/modules/user/entities/user.entity';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { UserSearchStrategy } from '@/modules/user/search/user-search-strategy.interface';
import { UserSearchAndPaginationDto } from '@/modules/user/dto/user-search-and-pagination.dto';

@Injectable()
export class FullNameSearchStrategy implements UserSearchStrategy {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(params: UserSearchAndPaginationDto): Promise<User[]> {
    const { limit, offset, order, term } = params;
    const firstNames = term.split('-')[0].replace(/\+/g, ' ');
    const lastNames = term.split('-')[1].replace(/\+/g, ' ');

    const users = await this.userRepository.find({
      where: {
        firstNames: ILike(`%${firstNames}%`),
        lastNames: ILike(`%${lastNames}%`),
        recordStatus: RecordStatus.Active,
      },
      take: limit,
      skip: offset,
      relations: ['updatedBy', 'createdBy', 'churches', 'ministries'],
      order: { createdAt: order as FindOptionsOrderValue },
    });

    if (users.length === 0) {
      throw new NotFoundException(
        `No se encontraron usuarios con estos nombres y apellidos: ${firstNames} ${lastNames}`,
      );
    }

    return users;
  }
}
