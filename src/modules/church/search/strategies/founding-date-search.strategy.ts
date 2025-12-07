import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Between, FindOptionsOrderValue, Repository } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { Church } from '@/modules/church/entities/church.entity';

import { churchDataFormatter } from '@/modules/church/helpers/church-data-formatter.helper';
import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';
import { ChurchSearchStrategy } from '@/modules/church/search/church-search-strategy.interface';
import { ChurchSearchAndPaginationDto } from '@/modules/church/dto/church-search-and-pagination.dto';

@Injectable()
export class FoundingDateSearchStrategy implements ChurchSearchStrategy {
  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,
  ) {}

  async execute(params: ChurchSearchAndPaginationDto): Promise<Church[]> {
    const { limit, offset, order, term } = params;
    const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

    if (isNaN(fromTimestamp)) {
      throw new NotFoundException('Formato de marca de tiempo invalido.');
    }

    const fromDate = new Date(fromTimestamp);
    const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

    const churches = await this.churchRepository.find({
      where: {
        foundingDate: Between(fromDate, toDate),
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
      const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
      const toDate = dateFormatterToDDMMYYYY(toTimestamp);

      throw new NotFoundException(
        `No se encontraron iglesias con este rango de fechas: ${fromDate} - ${toDate}`,
      );
    }

    return churchDataFormatter({ churches, mainChurch }) as any;
  }
}
