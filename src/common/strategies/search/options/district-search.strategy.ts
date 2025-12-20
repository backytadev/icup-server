import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue, ILike } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { SearchStrategyProps } from '@/common/interfaces/search-strategy-props.interface';
import { SearchStrategy } from '@/common/strategies/search/search-strategy.interface';

@Injectable()
export class DistrictSearchStrategy implements SearchStrategy {
  async execute<T>({
    params,
    church,
    relations,
    mainRepository,
    moduleKey,
    formatterData,
    relationLoadStrategy = 'join',
    moduleName,
  }: SearchStrategyProps<T>): Promise<T[]> {
    const { limit, offset, order, term } = params;

    const data = await mainRepository.find({
      where: {
        ...(church && { theirChurch: church }),
        district: ILike(`%${term}%`),
        recordStatus: RecordStatus.Active,
      } as any,
      take: limit,
      skip: offset,
      relations,
      relationLoadStrategy,
      order: { createdAt: order as FindOptionsOrderValue } as any,
    });

    let mainChurch = null;
    if (moduleKey === 'churches') {
      mainChurch = await mainRepository.findOne({
        where: { isAnexe: false, recordStatus: RecordStatus.Active } as any,
      });
    }

    if (data.length === 0) {
      throw new NotFoundException(
        `No se encontraron ${moduleName} con este distrito: ${term}`,
      );
    }

    return formatterData({
      [moduleKey]: data,
      ...(mainChurch && { mainChurch }),
    });
  }
}
