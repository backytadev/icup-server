import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue, ILike, In } from 'typeorm';

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

    const firstNames = term.split('-')[0].replace(/\+/g, ' ');
    const lastNames = term.split('-')[1].replace(/\+/g, ' ');

    const persons = await personRepository.find({
      where: {
        theirChurch: church,
        member: {
          firstNames: ILike(`%${firstNames}%`),
          lastNames: ILike(`%${lastNames}%`),
        },
        recordStatus: RecordStatus.Active,
      },
      order: { createdAt: order as FindOptionsOrderValue },
    });

    const personsId = persons.map((person) => person?.id);

    const data = await mainRepository.find({
      where: {
        theirChurch: church,
        [computedKey]: In(personsId),
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
        `No se encontraron ${moduleName} con los nombres de su ${personName}: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }
    return formatterData({
      [moduleKey]: data,
    });
  }
}
