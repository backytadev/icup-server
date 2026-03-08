import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue, In } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';

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

@Injectable()
export class OfferingIncomeByPreacherFullNamesStrategy
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
    preacherRepository,
  }: OfferingIncomeSearchStrategyProps): Promise<OfferingIncome[]> {
    const firstNames = term.split('-')[0].replace(/\+/g, ' ');
    const lastNames = term.split('-')[1].replace(/\+/g, ' ');

    const qb = preacherRepository
      .createQueryBuilder('preacher')
      .leftJoinAndSelect('preacher.member', 'member')
      .leftJoinAndSelect('preacher.theirFamilyGroup', 'familyGroup')
      .andWhere(
        'unaccent(lower(member.firstNames)) ILIKE unaccent(lower(:first))',
        { first: `%${firstNames.toLowerCase()}%` },
      )
      .andWhere(
        'unaccent(lower(member.lastNames)) ILIKE unaccent(lower(:last))',
        { last: `%${lastNames.toLowerCase()}%` },
      );

    if (church) {
      qb.andWhere('preacher.theirChurch = :churchId', { churchId: church.id });
    }

    const preachers = await qb.getMany();

    const familyGroupsId = preachers.map(
      (preacher) => preacher?.theirFamilyGroup?.id,
    );

    const offeringIncome = await offeringIncomeRepository.find({
      where: {
        ...(church && { church }),
        subType: searchType,
        familyGroup: In(familyGroupsId),
        recordStatus: RecordStatus.Active,
      },
      take: limit,
      skip: offset,
      relations: OFFERING_INCOME_RELATIONS,
      order: { createdAt: order as FindOptionsOrderValue },
    });

    if (offeringIncome.length === 0) {
      throw new NotFoundException(
        `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con estos nombres y apellidos de predicador: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }

    return offeringIncomeDataFormatter({ offeringIncome }) as any;
  }
}
