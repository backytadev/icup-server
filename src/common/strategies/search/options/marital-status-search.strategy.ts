import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsOrderValue } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { MaritalStatusNames } from '@/common/enums/marital-status.enum';
import { SearchStrategy } from '@/common/strategies/search/search-strategy.interface';
import { SearchStrategyProps } from '@/common/interfaces/search-strategy-props.interface';

@Injectable()
export class MaritalStatusSearchStrategy implements SearchStrategy {
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

    const maritalStatusTerm = term.toLowerCase();

    const validMaritalStatus = [
      'single',
      'married',
      'widowed',
      'divorced',
      'other',
    ];

    if (!validMaritalStatus.includes(maritalStatusTerm)) {
      throw new BadRequestException(`Estado Civil no válido: ${term}`);
    }

    const data = await mainRepository.find({
      where: {
        theirChurch: church,
        member: {
          maritalStatus: maritalStatusTerm,
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
      const maritalStatusInSpanish =
        MaritalStatusNames[term.toLowerCase()] ?? term;

      throw new NotFoundException(
        `No se encontraron ${moduleName} con este estado civil: ${maritalStatusInSpanish} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }

    return formatterData({
      [moduleKey]: data,
    });
  }
}
