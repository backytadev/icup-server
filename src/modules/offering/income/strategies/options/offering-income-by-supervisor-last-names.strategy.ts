import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue, In, Raw } from 'typeorm';

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
export class OfferingIncomeByZoneSupervisorLastNamesStrategy
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
    supervisorRepository,
  }: OfferingIncomeSearchStrategyProps): Promise<OfferingIncome[]> {
    const lastNames = term.replace(/\+/g, ' ');

    const supervisors = await supervisorRepository.find({
      where: {
        ...(church && { theirChurch: church }),
        member: {
          lastNames: Raw(
            (alias) =>
              `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
            { searchTerm: `%${lastNames.toLowerCase()}%` },
          ),
        },
      },
      relations: ['theirZone'],
    });

    const zonesId = supervisors.map((supervisor) => supervisor?.theirZone?.id);

    const offeringIncome = await offeringIncomeRepository.find({
      where: {
        ...(church && { church }),
        subType: searchType,
        zone: In(zonesId),
        recordStatus: RecordStatus.Active,
      },
      take: limit,
      skip: offset,
      relations: OFFERING_INCOME_RELATIONS,
      order: { createdAt: order as FindOptionsOrderValue },
    });

    if (offeringIncome.length === 0) {
      throw new NotFoundException(
        `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con estos apellidos de supervisor: ${lastNames} y con esta iglesia: ${church ? church.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }

    return offeringIncomeDataFormatter({ offeringIncome }) as any;
  }
}
