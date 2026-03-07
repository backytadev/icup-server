import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';
import { OfferingExpenseSearchStrategyProps } from '@/modules/offering/expense/strategies/interfaces/offering-expense-search-strategy-props.interface';

export interface OfferingExpenseSearchStrategy {
  execute(props: OfferingExpenseSearchStrategyProps): Promise<OfferingExpense[]>;
}
