import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { SearchStrategyProps } from '@/common/interfaces/search-strategy-props.interface';
import { SearchStrategy } from '@/common/strategies/search/search-strategy.interface';

@Injectable()
export class FamilyGroupMostPopulatedSearchStrategy implements SearchStrategy {
  async execute<T>({
    params,
    church,
    relations,
    familyGroupRepository,
    moduleKey,
    formatterData,
    relationLoadStrategy = 'join',
  }: SearchStrategyProps<T>): Promise<T[]> {
    const { limit, offset, order } = params;

    const familyGroups = await familyGroupRepository.find({
      where: {
        theirChurch: church,
        recordStatus: RecordStatus.Active,
      } as any,
      skip: offset,
      take: limit,
      relations,
      relationLoadStrategy,
      order: { createdAt: order as FindOptionsOrderValue } as any,
    });

    if (familyGroups.length === 0) {
      throw new NotFoundException(`No se encontraron grupos familiares`);
    }

    const dataResult = familyGroups
      .sort((a, b) => b.disciples.length - a.disciples.length)
      .slice(0, 7);

    return formatterData({
      [moduleKey]: dataResult,
    });
  }
}
