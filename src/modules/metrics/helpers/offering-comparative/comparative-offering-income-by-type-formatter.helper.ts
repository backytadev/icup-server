import { toZonedTime } from 'date-fns-tz';
const timeZone = 'America/Lima';

import { normalizeMonth } from '@/common/helpers/normalize-name-months';
import { CurrencyType } from '@/modules/offering/shared/enums/currency-type.enum';

import { OfferingIncomeCreationTypeNames } from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import { OfferingIncomeCreationSubTypeNames } from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';

import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';

interface Options {
  offeringIncome: OfferingIncome[];
  startMonth?: string;
  endMonth?: string;
}

interface Church {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}

export interface OfferingIncomeComparativeByTypeDataResult {
  month: string;
  type: string;
  subType: string;
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  church: Church;
  totalAmount: number;
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

export const comparativeOfferingIncomeByTypeFormatter = ({
  offeringIncome,
  startMonth = null,
  endMonth = null,
}: Options): OfferingIncomeComparativeByTypeDataResult[] => {
  const startEs = normalizeMonth(startMonth) ?? null;
  const endEs = normalizeMonth(endMonth) ?? null;

  const dataResult: OfferingIncomeComparativeByTypeDataResult[] =
    offeringIncome?.reduce((acc, offering) => {
      const zonedDate = toZonedTime(offering.date, timeZone);
      const offeringMonth = zonedDate.getMonth();

      const existing = acc.find(
        (item) => item?.month === MONTH_NAMES[offeringMonth],
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
          month: MONTH_NAMES[offeringMonth],
          type: OfferingIncomeCreationTypeNames[offering?.type],
          subType:
            OfferingIncomeCreationSubTypeNames[offering.subType] ??
            'Ajuste por Ingreso',
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

  const filteredData =
    startEs && endEs
      ? dataResult.filter((item) => {
          const startIndex = MONTH_NAMES.indexOf(startEs);
          const endIndex = MONTH_NAMES.indexOf(endEs);
          const itemIndex = MONTH_NAMES.indexOf(item.month);

          return itemIndex >= startIndex && itemIndex <= endIndex;
        })
      : dataResult;

  return filteredData.sort(
    (a, b) => MONTH_NAMES.indexOf(a.month) - MONTH_NAMES.indexOf(b.month),
  );
};
