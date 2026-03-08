import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { Church } from '@/modules/church/entities/church.entity';

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

interface Options {
  newMembers: [Pastor[], Copastor[], Supervisor[], Preacher[], Disciple[]];
  inactiveMembers: [Pastor[], Copastor[], Supervisor[], Preacher[], Disciple[]];
  church: Church;
}

interface ChurchInfo {
  isAnexe: boolean;
  abbreviatedChurchName: string;
}

export interface MonthlyMemberFluctuationDataResult {
  month: string;
  newMembers: number;
  inactiveMembers: number;
  church: ChurchInfo;
}

export const memberFluctuationFormatter = ({
  newMembers,
  inactiveMembers,
  church,
}: Options): MonthlyMemberFluctuationDataResult[] => {
  const flattenMembers = (
    members: [Pastor[], Copastor[], Supervisor[], Preacher[], Disciple[]],
  ) => members.flat();

  const allNewMembers = flattenMembers(newMembers);
  const allInactiveMembers = flattenMembers(inactiveMembers);

  const filterMembersByMonth = (
    members: (Pastor | Copastor | Supervisor | Preacher | Disciple)[],
    monthIndex: number,
  ) =>
    members.filter(
      (member) => new Date(member.createdAt).getMonth() === monthIndex,
    );

  const dataResult: MonthlyMemberFluctuationDataResult[] = monthNames.map(
    (_, index) => {
      return {
        month: monthNames[index],
        newMembers: filterMembersByMonth(allNewMembers, index).length,
        inactiveMembers: filterMembersByMonth(allInactiveMembers, index).length,
        church: {
          isAnexe: church
            ? church.isAnexe
            : allNewMembers[0]?.theirChurch?.isAnexe,
          abbreviatedChurchName: church
            ? church.abbreviatedChurchName
            : allNewMembers[0]?.theirChurch?.abbreviatedChurchName,
        },
      };
    },
  );

  return dataResult;
};
