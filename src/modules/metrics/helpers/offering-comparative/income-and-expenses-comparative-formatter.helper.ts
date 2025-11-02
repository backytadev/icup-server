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
  startMonth?: string;
  endMonth?: string;
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

const MONTH_NAMES = [
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

const MONTH_MAP_EN_TO_ES: Record<string, string> = {
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

const normalizeMonth = (month: string) => {
  if (!month) return null;

  const lower = month.toLowerCase();
  const spanish = MONTH_MAP_EN_TO_ES[lower];
  return spanish ?? null;
};
export const IncomeAndExpensesComparativeFormatter = ({
  currentYearOfferingExpenses,
  currentYearOfferingIncome,
  previousYearOfferingIncome,
  previousYearOfferingExpenses,
  startMonth = null,
  endMonth = null,
}: DataResultOptions): YearlyIncomeExpenseComparativeDataResult[] => {
  const startEs = normalizeMonth(startMonth) ?? null;
  const endEs = normalizeMonth(endMonth) ?? null;

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
  const previousYearDataByMonth = MONTH_NAMES.map((_, index) =>
    previousYearData.filter((offering) => {
      const zonedDate = toZonedTime(offering.date, timeZone);
      return zonedDate.getMonth() === index;
    }),
  );

  let previousNetResult: number | null = null;

  const previousYearResults: YearlyIncomeExpenseComparativeDataResult[] =
    MONTH_NAMES.map((_, index) => {
      const { totalIncome, totalExpenses } = calculateIncomeAndExpenses(
        previousYearDataByMonth[index],
      );

      const previousMonthResult: YearlyIncomeExpenseComparativeDataResult = {
        month: MONTH_NAMES[index],
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
  const currentYearDataByMonth = MONTH_NAMES.map((_, index) =>
    currentYearData.filter((offering) => {
      const zonedDate = toZonedTime(offering.date, timeZone);
      return zonedDate.getMonth() === index;
    }),
  );

  let currentNetResult: number | null = null;

  const currentYearResults: YearlyIncomeExpenseComparativeDataResult[] =
    MONTH_NAMES.map((_, index) => {
      const { totalIncome, totalExpenses } = calculateIncomeAndExpenses(
        currentYearDataByMonth[index],
      );

      const currentMonthResult: YearlyIncomeExpenseComparativeDataResult = {
        month: MONTH_NAMES[index],
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

  const filteredData =
    startEs && endEs
      ? currentYearResults.filter((item) => {
          const startIndex = MONTH_NAMES.indexOf(startEs);
          const endIndex = MONTH_NAMES.indexOf(endEs);
          const itemIndex = MONTH_NAMES.indexOf(item.month);

          return itemIndex >= startIndex && itemIndex <= endIndex;
        })
      : currentYearResults;

  return filteredData;
};
