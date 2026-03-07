import { Injectable } from '@nestjs/common';
import { FindOptionsOrderValue, IsNull } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { SearchStrategyProps } from '@/common/interfaces/search-strategy-props.interface';
import { SearchStrategy } from '@/common/strategies/search/search-strategy.interface';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { SearchType } from '@/common/enums/search-types.enum';

@Injectable()
export class AvailableSupervisorsSearchStrategy implements SearchStrategy {
  async execute<T>({
    params,
    mainRepository,
    copastorRepository,
    church,
  }: SearchStrategyProps<T>): Promise<T[]> {
    const { order, term, withNullZone, searchType } = params;

    let copastor: Copastor;

    if (searchType === SearchType.AvailableSupervisorsByCopastor) {
      copastor = await copastorRepository.findOne({
        where: {
          id: term,
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const data = await mainRepository.find({
        where: {
          theirCopastor: copastor,
          theirZone: withNullZone ? IsNull() : null, // always null zone false for exchange supervisors
          recordStatus: RecordStatus.Active,
        } as any,
        relations: ['member', 'theirZone'],
        order: { createdAt: order as FindOptionsOrderValue } as any,
      });

      return data;
    }

    if (searchType === SearchType.AvailableSupervisorsByChurch) {
      const data = await mainRepository.find({
        where: {
          theirChurch: church,
          theirZone: withNullZone ? IsNull() : null, // always null zone true for assign new and update
          recordStatus: RecordStatus.Active,
        } as any,
        relations: ['member', 'theirZone'],
        order: { createdAt: order as FindOptionsOrderValue } as any,
      });

      return data;
    }

    return [];
  }
}
