import { Injectable, NotFoundException } from '@nestjs/common';
import { Between, FindOptionsOrderValue } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';

import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';
import { OfferingExpenseSearchTypeNames } from '@/modules/offering/expense/enums/offering-expense-search-type.enum';
import { formatDataOfferingExpense } from '@/modules/offering/expense/helpers/format-data-offering-expense.helper';
import { OfferingExpenseSearchStrategy } from '@/modules/offering/expense/strategies/interfaces/offering-expense-search.strategy.interface';
import { OfferingExpenseSearchStrategyProps } from '@/modules/offering/expense/strategies/interfaces/offering-expense-search-strategy-props.interface';

@Injectable()
export class OfferingExpenseByAdjustmentStrategy
  implements OfferingExpenseSearchStrategy
{
  async execute({
    term,
    searchType,
    limit,
    offset = 0,
    order,
    church,
    offeringExpenseRepository,
  }: OfferingExpenseSearchStrategyProps): Promise<OfferingExpense[]> {
    const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

    if (isNaN(fromTimestamp)) {
      throw new NotFoundException('Formato de marca de tiempo invalido.');
    }

    const fromDate = new Date(fromTimestamp);
    const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

    const offeringExpenses = await offeringExpenseRepository.find({
      where: {
        ...(church && { church }),
        type: searchType,
        date: Between(fromDate, toDate),
        recordStatus: RecordStatus.Active,
      },
      take: limit,
      skip: offset,
      relations: ['updatedBy', 'createdBy', 'church'],
      order: { createdAt: order as FindOptionsOrderValue },
    });

    if (offeringExpenses.length === 0) {
      const from = dateFormatterToDDMMYYYY(fromTimestamp);
      const to = dateFormatterToDDMMYYYY(toTimestamp);

      throw new NotFoundException(
        `No se encontraron salidas de ofrendas (${OfferingExpenseSearchTypeNames[searchType]}) con este rango de fechas: ${from} - ${to} y con esta iglesia: ${church ? church.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }

    return formatDataOfferingExpense({ offeringExpenses }) as any;
  }
}
