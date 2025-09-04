import { toZonedTime } from 'date-fns-tz';
const timeZone = 'America/Lima';

import { CurrencyType } from '@/modules/offering/shared/enums/currency-type.enum';
import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';
import { OfferingExpenseSearchTypeNames } from '@/modules/offering/expense/enums/offering-expense-search-type.enum';

interface Options {
  offeringExpenses: OfferingExpense[];
}

interface Church {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}

export interface OfferingExpenseComparativeByTypeDataResult {
  month: string;
  type: string;
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  church: Church;
  totalAmount: number;
}

const monthNames = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export const comparativeOfferingExpensesByTypeFormatter = ({
  offeringExpenses,
}: Options): OfferingExpenseComparativeByTypeDataResult[] => {
  const dataResult: OfferingExpenseComparativeByTypeDataResult[] =
    offeringExpenses?.reduce((acc, offering) => {
      const zonedDate = toZonedTime(offering.date, timeZone);
      const offeringMonth = zonedDate.getMonth();

      const existing = acc.find(
        (item) => item?.month === monthNames[offeringMonth],
      );

      if (existing) {
        if (offering?.currency === CurrencyType?.PEN) {
          existing.accumulatedOfferingPEN += +offering.amount;
        } else if (offering.currency === CurrencyType.USD) {
          existing.accumulatedOfferingUSD += +offering.amount;
        } else if (offering.currency === CurrencyType.EUR) {
          existing.accumulatedOfferingEUR += +offering.amount;
        }

        existing.totalAmount += +offering.amount;
      } else {
        acc.push({
          month: monthNames[offeringMonth],
          type: OfferingExpenseSearchTypeNames[offering?.type],
          accumulatedOfferingPEN:
            offering?.currency === CurrencyType.PEN ? +offering?.amount : 0,
          accumulatedOfferingUSD:
            offering?.currency === CurrencyType.USD ? +offering?.amount : 0,
          accumulatedOfferingEUR:
            offering?.currency === CurrencyType.EUR ? +offering?.amount : 0,
          church: {
            isAnexe: offering?.church?.isAnexe,
            abbreviatedChurchName: offering?.church?.abbreviatedChurchName,
          },
          totalAmount: +offering.amount,
        });
      }

      return acc;
    }, []);

  return dataResult.sort(
    (a, b) => monthNames.indexOf(a.month) - monthNames.indexOf(b.month),
  );
};
