import { toZonedTime } from 'date-fns-tz';
const timeZone = 'America/Lima';

import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';
import { OfferingIncomeCreationType } from '@/modules/offering/income/enums/offering-income-creation-type.enum';

interface DataResultOptions {
  currentYearOfferingIncome: OfferingIncome[];
  currentYearOfferingExpenses: OfferingExpense[];
  previousYearOfferingIncome: OfferingIncome[];
  previousYearOfferingExpenses: OfferingExpense[];
}

export interface YearlyIncomeExpenseComparativeDataResult {
  month: string;
  netResultPrevious: number | null;
  totalIncome: number;
  totalExpenses: number;
  currency: string;
  netResult: number;
  church: {
    isAnexe: boolean;
    abbreviatedChurchName: string;
  };
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

export const IncomeAndExpensesComparativeFormatter = ({
  currentYearOfferingExpenses,
  currentYearOfferingIncome,
  previousYearOfferingIncome,
  previousYearOfferingExpenses,
}: DataResultOptions): YearlyIncomeExpenseComparativeDataResult[] => {
  const currentYearData = [
    ...currentYearOfferingIncome,
    ...currentYearOfferingExpenses,
  ];

  const previousYearData = [
    ...previousYearOfferingIncome,
    ...previousYearOfferingExpenses,
  ];

  // Function to calculate total income and expenses
  const calculateIncomeAndExpenses = (
    offerings: (OfferingIncome | OfferingExpense)[],
  ) => {
    const totalIncome = offerings
      .filter(
        (offering) =>
          offering.type === OfferingIncomeCreationType.Offering ||
          offering.type === OfferingIncomeCreationType.IncomeAdjustment,
      )
      .reduce((acc, current) => acc + +current.amount, 0);

    const totalExpenses = offerings
      .filter(
        (offering) =>
          offering.type !== OfferingIncomeCreationType.Offering &&
          offering.type !== OfferingIncomeCreationType.IncomeAdjustment,
      )
      .reduce((acc, current) => acc + +current.amount, 0);

    return { totalIncome, totalExpenses };
  };

  //? Previous year
  //* Filtrar los ingresos y gastos del año anterior por mes
  const previousYearDataByMonth = monthNames.map((_, index) =>
    previousYearData.filter((offering) => {
      const zonedDate = toZonedTime(offering.date, timeZone);
      return zonedDate.getMonth() === index;
    }),
  );

  let previousNetResult: number | null = null;

  const previousYearResults: YearlyIncomeExpenseComparativeDataResult[] =
    monthNames.map((_, index) => {
      const { totalIncome, totalExpenses } = calculateIncomeAndExpenses(
        previousYearDataByMonth[index],
      );

      const previousMonthResult: YearlyIncomeExpenseComparativeDataResult = {
        month: monthNames[index],
        currency: previousYearData[0]?.currency || 'S/D',
        netResultPrevious: previousNetResult,
        totalIncome,
        totalExpenses,
        netResult: totalIncome + previousNetResult - totalExpenses,
        church: {
          isAnexe: previousYearData[0]?.church?.isAnexe,
          abbreviatedChurchName:
            previousYearData[0]?.church?.abbreviatedChurchName,
        },
      };

      previousNetResult = previousMonthResult.netResult;

      return previousMonthResult;
    });

  //? Current
  //* Filtrar los ingresos y gastos del año actual por mes
  const currentYearDataByMonth = monthNames.map((_, index) =>
    currentYearData.filter((offering) => {
      const zonedDate = toZonedTime(offering.date, timeZone);
      return zonedDate.getMonth() === index;
    }),
  );

  let currentNetResult: number | null = null;

  const currentYearResults: YearlyIncomeExpenseComparativeDataResult[] =
    monthNames.map((_, index) => {
      const { totalIncome, totalExpenses } = calculateIncomeAndExpenses(
        currentYearDataByMonth[index],
      );

      const currentMonthResult: YearlyIncomeExpenseComparativeDataResult = {
        month: monthNames[index],
        currency: currentYearData[0]?.currency || 'S/D',
        netResultPrevious:
          index === 0 ? previousYearResults.at(-1).netResult : currentNetResult,
        totalIncome,
        totalExpenses,
        netResult:
          index === 0
            ? totalIncome + previousYearResults.at(-1).netResult - totalExpenses
            : totalIncome + currentNetResult - totalExpenses,
        church: {
          isAnexe: currentYearData[0]?.church?.isAnexe,
          abbreviatedChurchName:
            currentYearData[0]?.church?.abbreviatedChurchName,
        },
      };

      currentNetResult = currentMonthResult.netResult;
      return currentMonthResult;
    });

  return currentYearResults;
};
