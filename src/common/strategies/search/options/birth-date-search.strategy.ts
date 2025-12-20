import { Injectable, NotFoundException } from '@nestjs/common';
import { Between, FindOptionsOrderValue } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { SearchStrategyProps } from '@/common/interfaces/search-strategy-props.interface';
import { SearchStrategy } from '@/common/strategies/search/search-strategy.interface';
import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';

@Injectable()
export class BirthDateSearchStrategy implements SearchStrategy {
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

    const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

    if (isNaN(fromTimestamp)) {
      throw new NotFoundException('Formato de marca de tiempo invalido.');
    }

    const fromDate = new Date(fromTimestamp);
    const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

    const data = await mainRepository.find({
      where: {
        theirChurch: church,
        member: {
          birthDate: Between(fromDate, toDate),
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
      const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
      const toDate = dateFormatterToDDMMYYYY(toTimestamp);

      throw new NotFoundException(
        `No se encontraron ${moduleName} con este rango de fechas de nacimiento: ${fromDate} - ${toDate} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }

    return formatterData({
      [moduleKey]: data,
    });
  }
}
