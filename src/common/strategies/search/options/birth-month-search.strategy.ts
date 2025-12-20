import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { getBirthDateByMonth } from '@/common/helpers/get-birth-date-by-month.helper';
import { SearchStrategy } from '@/common/strategies/search/search-strategy.interface';
import { SearchStrategyProps } from '@/common/interfaces/search-strategy-props.interface';

@Injectable()
export class BirthMonthSearchStrategy implements SearchStrategy {
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
        theirChurch: church,
        recordStatus: RecordStatus.Active,
      } as any,
      take: limit,
      skip: offset,
      relations,
      relationLoadStrategy,
      order: { createdAt: order as FindOptionsOrderValue } as any,
    });

    const result = getBirthDateByMonth({
      month: term,
      data: data as any,
    });

    if (result.length === 0) {
      const monthNames = {
        january: 'Enero',
        february: 'Febrero',
        march: 'Marzo',
        april: 'Abril',
        may: 'Mayo',
        june: 'Junio',
        july: 'Julio',
        august: 'Agosto',
        september: 'Septiembre',
        october: 'Octubre',
        november: 'Noviembre',
        december: 'Diciembre',
      };

      const monthInSpanish = monthNames[term.toLowerCase()] ?? term;

      throw new NotFoundException(
        `No se encontraron ${moduleName} con este mes de nacimiento: ${monthInSpanish} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }

    return formatterData({
      [moduleKey]: data,
    });
  }
}
