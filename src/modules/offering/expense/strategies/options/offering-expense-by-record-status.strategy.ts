import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsOrderValue } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';
import { OfferingExpenseSearchTypeNames } from '@/modules/offering/expense/enums/offering-expense-search-type.enum';
import { formatDataOfferingExpense } from '@/modules/offering/expense/helpers/format-data-offering-expense.helper';
import { OfferingExpenseSearchStrategy } from '@/modules/offering/expense/strategies/interfaces/offering-expense-search.strategy.interface';
import { OfferingExpenseSearchStrategyProps } from '@/modules/offering/expense/strategies/interfaces/offering-expense-search-strategy-props.interface';

@Injectable()
export class OfferingExpenseByRecordStatusStrategy
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
    const recordStatusTerm = term.toLowerCase();
    const validRecordStatus = ['active', 'inactive'];

    if (!validRecordStatus.includes(recordStatusTerm)) {
      throw new BadRequestException(`Estado de registro no válido: ${term}`);
    }

    const offeringExpenses = await offeringExpenseRepository.find({
      where: {
        ...(church && { church }),
        recordStatus: recordStatusTerm,
      },
      take: limit,
      skip: offset,
      relations: ['updatedBy', 'createdBy', 'church'],
      order: { createdAt: order as FindOptionsOrderValue },
    });

    if (offeringExpenses.length === 0) {
      const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

      throw new NotFoundException(
        `No se encontraron salidas de ofrendas (${OfferingExpenseSearchTypeNames[searchType]}) con este estado de registro: ${value} y con esta iglesia: ${church ? church.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }

    return formatDataOfferingExpense({ offeringExpenses }) as any;
  }
}
