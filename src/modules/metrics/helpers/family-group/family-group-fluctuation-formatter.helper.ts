import { Church } from '@/modules/church/entities/church.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';

interface Options {
  activeFamilyGroups: FamilyGroup[];
  inactiveFamilyGroups: FamilyGroup[];
  church: Church;
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

interface ChurchInfo {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}

export interface MonthlyFamilyGroupsFluctuationDataResult {
  month: string;
  newFamilyGroups: number;
  inactiveFamilyGroups: number;
  church: ChurchInfo;
}

export const familyGroupFluctuationFormatter = ({
  activeFamilyGroups,
  inactiveFamilyGroups,
  church,
}: Options): MonthlyFamilyGroupsFluctuationDataResult[] => {
  const filterFamilyGroupsByMonth = (
    familyGroups: FamilyGroup[],
    monthIndex: number,
  ) =>
    familyGroups.filter(
      (member) => new Date(member.createdAt).getMonth() === monthIndex,
    );

  const dataResult: MonthlyFamilyGroupsFluctuationDataResult[] = monthNames.map(
    (_, index) => {
      return {
        month: monthNames[index],
        newFamilyGroups: filterFamilyGroupsByMonth(activeFamilyGroups, index)
          .length,
        inactiveFamilyGroups: filterFamilyGroupsByMonth(
          inactiveFamilyGroups,
          index,
        ).length,
        church: {
          isAnexe: church
            ? church.isAnexe
            : activeFamilyGroups[0]?.theirChurch?.isAnexe,
          abbreviatedChurchName: church
            ? church.abbreviatedChurchName
            : activeFamilyGroups[0]?.theirChurch?.abbreviatedChurchName,
        },
      };
    },
  );

  return dataResult;
};
