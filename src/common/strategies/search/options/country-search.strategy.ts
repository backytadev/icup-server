import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue, FindOptionsWhere, Raw } from 'typeorm';

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
    moduleName,
  }: SearchStrategyProps<T>): Promise<T[]> {
    const { limit, offset, order, term } = params;

    const where = this.buildWhere(moduleKey, term, church);

    const data = await mainRepository.find({
      where,
      take: limit,
      skip: offset,
      relations,
      relationLoadStrategy,
      order: { createdAt: order as FindOptionsOrderValue } as any,
    });

    if (data.length === 0) {
      throw new NotFoundException(
        `No se encontraron ${moduleName} con este país: ${term}`,
      );
    }

    return formatterData({
      [moduleKey]: data,
    });
  }

  private buildWhere(
    moduleKey: string,
    term: string,
    church: any,
  ): FindOptionsWhere<any> {
    const baseWhere: any = {
      ...(church && { theirChurch: church }),
      recordStatus: RecordStatus.Active,
    };

    if (moduleKey === 'ministries' || moduleKey === 'churches') {
      return {
        ...baseWhere,
        country: Raw(
          (alias) =>
            `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
          { searchTerm: `%${term.toLowerCase()}%` },
        ),
      };
    }

    return {
      ...baseWhere,
      member: {
        residenceCountry: Raw(
          (alias) =>
            `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
          { searchTerm: `%${term.toLowerCase()}%` },
        ),
      },
    };
  }
}
