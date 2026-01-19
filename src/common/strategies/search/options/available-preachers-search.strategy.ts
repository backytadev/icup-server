import { Injectable } from '@nestjs/common';
import { FindOptionsOrderValue, IsNull } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { SearchStrategyProps } from '@/common/interfaces/search-strategy-props.interface';
import { SearchStrategy } from '@/common/strategies/search/search-strategy.interface';
import { Zone } from '@/modules/zone/entities/zone.entity';
import { SearchType } from '@/common/enums/search-types.enum';

@Injectable()
export class AvailablePreachersSearchStrategy implements SearchStrategy {
  async execute<T>({
    params,
    mainRepository,
    zoneRepository,
  }: SearchStrategyProps<T>): Promise<T[]> {
    const { order, term, withNullFamilyGroup, searchType } = params;

    let zone: Zone;
    if (searchType === SearchType.AvailablePreachersByZone) {
      zone = await zoneRepository.findOne({
        where: {
          id: term,
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });
    }

    const data = await mainRepository.find({
      where: {
        ...(zone && {
          theirZone: zone,
          theirFamilyGroup: withNullFamilyGroup ? IsNull() : null,
        }),
        recordStatus: RecordStatus.Active,
      } as any,
      relations: ['theirFamilyGroup', 'member'],
      order: { createdAt: order as FindOptionsOrderValue } as any,
    });

    return data;
  }
}
