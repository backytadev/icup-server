import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue, Raw, Repository } from 'typeorm';

import { User } from '@/modules/user/entities/user.entity';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { UserRoleNames } from '@/common/enums/user-role.enum';
import { UserSearchStrategy } from '@/modules/user/search/user-search-strategy.interface';
import { UserSearchAndPaginationDto } from '@/modules/user/dto/user-search-and-pagination.dto';

@Injectable()
export class RolesSearchStrategy implements UserSearchStrategy {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(params: UserSearchAndPaginationDto): Promise<User[]> {
    const { limit, offset, order, term } = params;
    const rolesArray = term.split('+');

    const users = await this.userRepository.find({
      where: {
        roles: Raw((alias) => `ARRAY[:...rolesArray]::text[] && ${alias}`, {
          rolesArray,
        }),
        recordStatus: RecordStatus.Active,
      },
      take: limit,
      skip: offset,
      relations: ['updatedBy', 'createdBy', 'churches', 'ministries'],
      order: { createdAt: order as FindOptionsOrderValue },
    });

    if (users.length === 0) {
      const rolesInSpanish = rolesArray
        .map((role) => UserRoleNames[role] ?? role)
        .join(' - ');

      throw new NotFoundException(
        `No se encontraron usuarios con estos roles: ${rolesInSpanish}`,
      );
    }

    return users;
  }
}
