import { BadRequestException, Injectable } from '@nestjs/common';

import {
  OfferingExpenseSearchType,
  OfferingExpenseSearchTypeNames,
} from '@/modules/offering/expense/enums/offering-expense-search-type.enum';
import { OfferingExpenseSearchStrategy } from '@/modules/offering/expense/strategies/interfaces/offering-expense-search.strategy.interface';
import { OfferingExpenseByDateRangeStrategy } from '@/modules/offering/expense/strategies/options/offering-expense-by-date-range.strategy';
import { OfferingExpenseByAdjustmentStrategy } from '@/modules/offering/expense/strategies/options/offering-expense-by-adjustment.strategy';
import { OfferingExpenseByRecordStatusStrategy } from '@/modules/offering/expense/strategies/options/offering-expense-by-record-status.strategy';

@Injectable()
export class OfferingExpenseSearchStrategyFactory {
  private readonly strategies: Map<
    OfferingExpenseSearchType,
    OfferingExpenseSearchStrategy
  >;

  constructor(
    byDateRange: OfferingExpenseByDateRangeStrategy,
    byAdjustment: OfferingExpenseByAdjustmentStrategy,
    byRecordStatus: OfferingExpenseByRecordStatusStrategy,
  ) {
    this.strategies = new Map<
      OfferingExpenseSearchType,
      OfferingExpenseSearchStrategy
    >([
      [OfferingExpenseSearchType.OperationalExpenses, byDateRange],
      [OfferingExpenseSearchType.MaintenanceAndRepairExpenses, byDateRange],
      [OfferingExpenseSearchType.DecorationExpenses, byDateRange],
      [OfferingExpenseSearchType.EquipmentAndTechnologyExpenses, byDateRange],
      [OfferingExpenseSearchType.SuppliesExpenses, byDateRange],
      [OfferingExpenseSearchType.PlaningEventsExpenses, byDateRange],
      [OfferingExpenseSearchType.OtherExpenses, byDateRange],
      [OfferingExpenseSearchType.ExpensesAdjustment, byAdjustment],
      [OfferingExpenseSearchType.RecordStatus, byRecordStatus],
    ]);
  }

  getStrategy(type: OfferingExpenseSearchType): OfferingExpenseSearchStrategy {
    const strategy = this.strategies.get(type);

    if (!strategy) {
      throw new BadRequestException(
        `Tipo de búsqueda no válido: ${OfferingExpenseSearchTypeNames[type] ?? type}`,
      );
    }

    return strategy;
  }
}
