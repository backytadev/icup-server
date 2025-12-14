import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue, Raw } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { SearchStrategyProps } from '@/common/interfaces/search-strategy-props.interface';
import { SearchStrategy } from '@/common/strategies/search/search-strategy.interface';

@Injectable()
export class CountrySearchStrategy implements SearchStrategy {
  async execute<T>({
    params,
    church,
    relations,
    mainRepository,
    moduleKey,
    formatterData,
    relationLoadStrategy = 'join',
  }: SearchStrategyProps<T>): Promise<T[]> {
    const { limit, offset, order, term } = params;

    const data = await mainRepository.find({
      where: {
        theirChurch: church,
        member: {
          // originCountry: ILike(`%${term}%`),
          originCountry: Raw(
            (alias) =>
              `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
            { searchTerm: `%${term.toLowerCase()}%` },
          ),
        },
        recordStatus: RecordStatus.Active,
      } as any,
      take: limit,
      skip: offset,
      relations,
      relationLoadStrategy,
      order: { createdAt: order as FindOptionsOrderValue } as any,
    });

    if (data.length === 0) {
      throw new NotFoundException(
        `No se encontraron registros con este país: ${term}`,
      );
    }

    return formatterData({
      [moduleKey]: data,
    });
  }
}
