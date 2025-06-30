import { getInitialFullNames } from '@/common/helpers/get-initial-full-names.helper';

import { CurrencyType } from '@/modules/offering/shared/enums/currency-type.enum';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';

interface Options {
  offeringIncome: OfferingIncome[];
}

interface Church {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}

interface Supervisor {
  id: string;
  firstNames: string;
  lastNames: string;
}

interface Preacher {
  id: string;
  firstNames: string;
  lastNames: string;
}

interface FamilyGroup {
  id: string;
  familyGroupName: string;
  familyGroupCode: string;
}

interface Zone {
  id: string;
  zoneName: string;
}

export interface OfferingIncomeByFamilyGroupDataResult {
  date: Date;
  category: string;
  accumulatedOfferingPEN: number;
  accumulatedOfferingUSD: number;
  accumulatedOfferingEUR: number;
  familyGroup: FamilyGroup;
  supervisor: Supervisor;
  preacher: Preacher;
  zone: Zone;
  church: Church;
  disciples: number;
  allOfferings: { offering: number; currency: string; date: string | Date }[];
}

export const offeringIncomeByFamilyGroupFormatter = ({
  offeringIncome,
}: Options): OfferingIncomeByFamilyGroupDataResult[] => {
  const dataResult: OfferingIncomeByFamilyGroupDataResult[] =
    offeringIncome?.reduce((acc, offering) => {
      const existing = acc.find(
        (item) => item?.familyGroup?.id === offering?.familyGroup?.id,
      );

      if (existing) {
        if (offering?.currency === CurrencyType?.PEN) {
          existing.accumulatedOfferingPEN += +offering.amount;
        } else if (offering.currency === CurrencyType.USD) {
          existing.accumulatedOfferingUSD += +offering.amount;
        } else if (offering.currency === CurrencyType.EUR) {
          existing.accumulatedOfferingEUR += +offering.amount;
        }

        existing.allOfferings.push({
          offering: +offering?.amount,
          currency: offering.currency,
          date: offering.date,
        });
      } else {
        acc.push({
          date: offering.date,
          category: offering.category,
          accumulatedOfferingPEN:
            offering?.currency === CurrencyType.PEN ? +offering?.amount : 0,
          accumulatedOfferingUSD:
            offering?.currency === CurrencyType.USD ? +offering?.amount : 0,
          accumulatedOfferingEUR:
            offering?.currency === CurrencyType.EUR ? +offering?.amount : 0,
          familyGroup: {
            id: offering?.familyGroup?.id,
            familyGroupName: offering?.familyGroup?.familyGroupName,
            familyGroupCode: offering?.familyGroup?.familyGroupCode,
          },
          zone: {
            id: offering?.familyGroup?.theirZone?.id,
            zoneName: offering?.familyGroup?.theirZone.zoneName,
          },
          preacher: {
            id: offering?.familyGroup?.theirPreacher?.id,
            firstNames: getInitialFullNames({
              firstNames:
                offering?.familyGroup?.theirPreacher?.member?.firstNames ?? '',
              lastNames: '',
            }),
            lastNames: offering?.familyGroup?.theirPreacher?.member?.lastNames,
          },
          supervisor: {
            id: offering?.familyGroup?.theirSupervisor?.id,
            firstNames: getInitialFullNames({
              firstNames:
                offering?.familyGroup?.theirSupervisor?.member?.firstNames ??
                '',
              lastNames: '',
            }),
            lastNames:
              offering?.familyGroup?.theirSupervisor?.member?.lastNames,
          },
          church: {
            isAnexe: offering?.church?.isAnexe,
            abbreviatedChurchName: offering?.church?.abbreviatedChurchName,
          },
          disciples: offering?.familyGroup?.disciples?.length,
          allOfferings: [
            {
              offering: +offering?.amount,
              currency: offering?.currency,
              date: offering?.date,
            },
          ],
        });
      }

      return acc;
    }, []);

  return dataResult.sort((a, b) => {
    const codeA = a.familyGroup?.familyGroupCode ?? '';
    const codeB = b.familyGroup?.familyGroupCode ?? '';
    return codeA.localeCompare(codeB, undefined, { numeric: true });
  });
};
