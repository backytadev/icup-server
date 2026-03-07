import { Repository } from 'typeorm';

import { Church } from '@/modules/church/entities/church.entity';
import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';
import { OfferingExpenseSearchType } from '@/modules/offering/expense/enums/offering-expense-search-type.enum';
import { OfferingExpenseSearchSubType } from '@/modules/offering/expense/enums/offering-expense-search-sub-type.enum';

export interface OfferingExpenseSearchStrategyProps {
  term: string;
  searchType: OfferingExpenseSearchType;
  searchSubType?: OfferingExpenseSearchSubType;
  limit?: number;
  offset?: number;
  order?: string;
  church?: Church;
  offeringExpenseRepository: Repository<OfferingExpense>;
}
