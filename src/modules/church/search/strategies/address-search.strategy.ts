import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue, ILike, Repository } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { Church } from '@/modules/church/entities/church.entity';
import { churchDataFormatter } from '@/modules/church/helpers/church-data-formatter.helper';
import { ChurchSearchStrategy } from '@/modules/church/search/church-search-strategy.interface';
import { ChurchSearchAndPaginationDto } from '@/modules/church/dto/church-search-and-pagination.dto';

@Injectable()
export class AddressSearchStrategy implements ChurchSearchStrategy {
  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,
  ) {}

  async execute(params: ChurchSearchAndPaginationDto): Promise<Church[]> {
    const { limit, offset, order, term } = params;

    const churches = await this.churchRepository.find({
      where: {
        address: ILike(`%${term}%`),
        recordStatus: RecordStatus.Active,
      },
      take: limit,
      skip: offset,
      relations: [
        'updatedBy',
        'createdBy',
        'anexes',
        'zones',
        'familyGroups',
        'pastors.member',
        'copastors.member',
        'supervisors.member',
        'preachers.member',
        'disciples.member',
      ],
      relationLoadStrategy: 'query',
      order: { createdAt: order as FindOptionsOrderValue },
    });

    const mainChurch = await this.churchRepository.findOne({
      where: { isAnexe: false, recordStatus: RecordStatus.Active },
    });

    if (churches.length === 0) {
      throw new NotFoundException(
        `No se encontraron iglesias con esta dirección: ${term}`,
      );
    }

    return churchDataFormatter({ churches, mainChurch }) as any;
  }
}
