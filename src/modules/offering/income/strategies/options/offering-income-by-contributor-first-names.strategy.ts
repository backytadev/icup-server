import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue, Raw } from 'typeorm';

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

const OFFERING_INCOME_RELATIONS = [
  'updatedBy',
  'createdBy',
  'church',
  'familyGroup.theirPreacher.member',
  'zone.theirSupervisor.member',
  'pastor.member',
  'copastor.member',
  'supervisor.member',
  'preacher.member',
  'disciple.member',
  'externalDonor',
];

const nameFilter = (names: string) =>
  Raw(
    (alias) => `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
    { searchTerm: `%${names.toLowerCase()}%` },
  );

@Injectable()
export class OfferingIncomeByContributorFirstNamesStrategy
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
    const firstNames = names.replace(/\+/g, ' ');

    const baseWhere = {
      ...(church && { church }),
      subType: searchType,
      memberType,
      recordStatus: RecordStatus.Active,
    };

    const memberRelationFilter: Record<string, any> = {
      [MemberOfferingType.ExternalDonor]: {
        externalDonor: firstNames
          ? { firstNames: nameFilter(firstNames) }
          : undefined,
      },
      [MemberOfferingType.Pastor]: {
        pastor: firstNames
          ? { member: { firstNames: nameFilter(firstNames) } }
          : undefined,
      },
      [MemberOfferingType.Copastor]: {
        copastor: firstNames
          ? { member: { firstNames: nameFilter(firstNames) } }
          : undefined,
      },
      [MemberOfferingType.Supervisor]: {
        supervisor: firstNames
          ? { member: { firstNames: nameFilter(firstNames) } }
          : undefined,
      },
      [MemberOfferingType.Preacher]: {
        preacher: firstNames
          ? { member: { firstNames: nameFilter(firstNames) } }
          : undefined,
      },
      [MemberOfferingType.Disciple]: {
        disciple: firstNames
          ? { member: { firstNames: nameFilter(firstNames) } }
          : undefined,
      },
    };

    const extraFilter = memberRelationFilter[memberType] ?? {};

    const offeringIncome = await offeringIncomeRepository.find({
      where: { ...baseWhere, ...extraFilter },
      take: limit,
      skip: offset,
      relations: OFFERING_INCOME_RELATIONS,
      order: { createdAt: order as FindOptionsOrderValue },
    });

    if (offeringIncome.length === 0) {
      const memberTypeInSpanish =
        MemberOfferingTypeNames[memberType as MemberOfferingType] ?? memberType;

      throw new NotFoundException(
        `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este tipo de miembro: ${memberTypeInSpanish}, con estos nombres: ${firstNames} y con esta iglesia: ${church ? church.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }

    return offeringIncomeDataFormatter({ offeringIncome }) as any;
  }
}
