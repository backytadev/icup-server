import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { OfferingIncomeSearchStrategyProps } from '@/modules/offering/income/strategies/interfaces/offering-income-search-strategy-props.interface';

export interface OfferingIncomeSearchStrategy {
  execute(props: OfferingIncomeSearchStrategyProps): Promise<OfferingIncome[]>;
}
