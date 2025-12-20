import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue, In, Raw } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { SearchStrategyProps } from '@/common/interfaces/search-strategy-props.interface';
import { SearchStrategy } from '@/common/strategies/search/search-strategy.interface';

@Injectable()
export class FullNameSearchStrategy implements SearchStrategy {
  async execute<T>({
    params,
    church,
    relations,
    mainRepository,
    personRepository,
    moduleKey,
    computedKey,
    moduleName,
    personName,
    formatterData,
    relationLoadStrategy = 'join',
  }: SearchStrategyProps<T>): Promise<T[]> {
    const { limit, offset, order, term } = params;

    const [rawFirst, rawLast] = term.split('-');

    const firstNames = rawFirst.replace(/\+/g, ' ');
    const lastNames = rawLast.replace(/\+/g, ' ');

    let idsToSearch: string[] | undefined = undefined;

    if (personRepository) {
      const persons = await personRepository.find({
        where: {
          theirChurch: church,
          member: {
            firstNames: Raw(
              (alias) =>
                `unaccent(lower(${alias})) ILIKE unaccent(lower(:firstTerm))`,
              { firstTerm: `%${firstNames.toLowerCase()}%` },
            ),
            lastNames: Raw(
              (alias) =>
                `unaccent(lower(${alias})) ILIKE unaccent(lower(:lastTerm))`,
              { lastTerm: `%${lastNames.toLowerCase()}%` },
            ),
          },
          recordStatus: RecordStatus.Active,
        },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      idsToSearch = persons.map((p: any) => p.id);
    }

    const where: any = {
      theirChurch: church,
      recordStatus: RecordStatus.Active,
    };

    if (idsToSearch) {
      where[computedKey] = In(idsToSearch);
    } else {
      where.member = {
        firstNames: Raw(
          (alias) =>
            `unaccent(lower(${alias})) ILIKE unaccent(lower(:firstTerm))`,
          { firstTerm: `%${firstNames.toLowerCase()}%` },
        ),
        lastNames: Raw(
          (alias) =>
            `unaccent(lower(${alias})) ILIKE unaccent(lower(:lastTerm))`,
          { lastTerm: `%${lastNames.toLowerCase()}%` },
        ),
      };
    }

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
        `No se encontraron ${moduleName} con los nombres y apellidos de su ${
          personName ?? 'miembro'
        }: ${firstNames} ${lastNames} y con esta iglesia: ${
          church ? church.abbreviatedChurchName : 'Todas las iglesias'
        }`,
      );
    }

    return formatterData({
      [moduleKey]: data,
    });
  }
}
