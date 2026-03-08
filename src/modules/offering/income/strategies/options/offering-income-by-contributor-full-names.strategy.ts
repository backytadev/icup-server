import { Injectable, NotFoundException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import {
  MemberOfferingType,
  MemberOfferingTypeNames,
} from '@/modules/offering/income/enums/member-offering-type.enum';

import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { OfferingIncomeSearchTypeNames } from '@/modules/offering/income/enums/offering-income-search-type.enum';
import { offeringIncomeDataFormatter } from '@/modules/offering/income/helpers/offering-income-data-formatter.helper';
import { OfferingIncomeSearchStrategy } from '@/modules/offering/income/strategies/interfaces/offering-income-search.strategy.interface';
import { OfferingIncomeSearchStrategyProps } from '@/modules/offering/income/strategies/interfaces/offering-income-search-strategy-props.interface';

const buildBaseQuery = (
  offeringIncomeRepository: OfferingIncomeSearchStrategyProps['offeringIncomeRepository'],
  churchId: string,
  searchType: string,
  memberType: string,
): SelectQueryBuilder<OfferingIncome> =>
  offeringIncomeRepository
    .createQueryBuilder('offering')
    .leftJoinAndSelect('offering.updatedBy', 'updatedBy')
    .leftJoinAndSelect('offering.createdBy', 'createdBy')
    .leftJoinAndSelect('offering.church', 'church')
    .leftJoinAndSelect('offering.familyGroup', 'familyGroup')
    .leftJoinAndSelect('familyGroup.theirPreacher', 'fgPreacher')
    .leftJoinAndSelect('fgPreacher.member', 'fgPreacherMember')
    .leftJoinAndSelect('offering.zone', 'zone')
    .leftJoinAndSelect('zone.theirSupervisor', 'zoneSupervisor')
    .leftJoinAndSelect('zoneSupervisor.member', 'zoneSupervisorMember')
    .leftJoinAndSelect('offering.pastor', 'pastor')
    .leftJoinAndSelect('pastor.member', 'pastorMember')
    .leftJoinAndSelect('offering.copastor', 'copastor')
    .leftJoinAndSelect('copastor.member', 'copastorMember')
    .leftJoinAndSelect('offering.supervisor', 'supervisor')
    .leftJoinAndSelect('supervisor.member', 'supervisorMember')
    .leftJoinAndSelect('offering.preacher', 'preacher')
    .leftJoinAndSelect('preacher.member', 'preacherMember')
    .leftJoinAndSelect('offering.disciple', 'disciple')
    .leftJoinAndSelect('disciple.member', 'discipleMember')
    .leftJoinAndSelect('offering.externalDonor', 'externalDonor')
    .where('offering.church = :churchId', { churchId })
    .andWhere('offering.subType = :subType', { subType: searchType })
    .andWhere('offering.memberType = :memberType', { memberType })
    .andWhere('offering.recordStatus = :status', {
      status: RecordStatus.Active,
    });

const nameCondition = (firstAlias: string, lastAlias: string) =>
  `unaccent(lower(${firstAlias})) ILIKE unaccent(lower(:first)) AND unaccent(lower(${lastAlias})) ILIKE unaccent(lower(:last))`;

@Injectable()
export class OfferingIncomeByContributorFullNamesStrategy
  implements OfferingIncomeSearchStrategy
{
  async execute({
    term,
    searchType,
    limit,
    offset = 0,
    order,
    church,
    offeringIncomeRepository,
  }: OfferingIncomeSearchStrategyProps): Promise<OfferingIncome[]> {
    const [memberType, names] = term.split('&');
    const firstNames = names.split('-')[0].replace(/\+/g, ' ');
    const lastNames = names.split('-')[1].replace(/\+/g, ' ');

    const nameParams = {
      first: `%${firstNames?.toLowerCase() ?? ''}%`,
      last: `%${lastNames?.toLowerCase() ?? ''}%`,
    };
    const hasNames = firstNames && lastNames;

    const memberAliasMap: Record<string, [string, string]> = {
      [MemberOfferingType.ExternalDonor]: [
        'externalDonor.firstNames',
        'externalDonor.lastNames',
      ],
      [MemberOfferingType.Pastor]: [
        'pastorMember.firstNames',
        'pastorMember.lastNames',
      ],
      [MemberOfferingType.Copastor]: [
        'copastorMember.firstNames',
        'copastorMember.lastNames',
      ],
      [MemberOfferingType.Supervisor]: [
        'supervisorMember.firstNames',
        'supervisorMember.lastNames',
      ],
      [MemberOfferingType.Preacher]: [
        'preacherMember.firstNames',
        'preacherMember.lastNames',
      ],
      [MemberOfferingType.Disciple]: [
        'discipleMember.firstNames',
        'discipleMember.lastNames',
      ],
    };

    const aliases = memberAliasMap[memberType];
    const qb = buildBaseQuery(
      offeringIncomeRepository,
      church?.id,
      searchType,
      memberType,
    );

    if (aliases && hasNames) {
      qb.andWhere(nameCondition(aliases[0], aliases[1]), nameParams);
    }

    const offeringIncome = await qb
      .orderBy('offering.createdAt', order as 'ASC' | 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();

    if (offeringIncome.length === 0) {
      const memberTypeInSpanish =
        MemberOfferingTypeNames[memberType as MemberOfferingType] ?? memberType;

      throw new NotFoundException(
        `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este tipo de miembro: ${memberTypeInSpanish}, con estos nombres y apellidos: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }

    return offeringIncomeDataFormatter({ offeringIncome }) as any;
  }
}
