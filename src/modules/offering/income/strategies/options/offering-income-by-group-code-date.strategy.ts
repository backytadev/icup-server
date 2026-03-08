import { Injectable, NotFoundException } from '@nestjs/common';
import { Between, FindOptionsOrderValue, In, Raw } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';

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
export class OfferingIncomeByGroupCodeDateStrategy
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
    familyGroupRepository,
  }: OfferingIncomeSearchStrategyProps): Promise<OfferingIncome[]> {
    const [code, date] = term.split('&');
    const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

    if (isNaN(fromTimestamp)) {
      throw new NotFoundException('Formato de marca de tiempo invalido.');
    }

    const fromDate = new Date(fromTimestamp);
    const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

    const familyGroups = await familyGroupRepository.find({
      where: {
        ...(church && { theirChurch: church }),
        familyGroupCode: Raw(
          (alias) =>
            `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
          { searchTerm: `%${code.toLowerCase()}%` },
        ),
      },
    });

    const familyGroupsId = familyGroups.map((fg) => fg?.id);

    const offeringIncome = await offeringIncomeRepository.find({
      where: {
        ...(church && { church }),
        subType: searchType,
        date: Between(fromDate, toDate),
        familyGroup: In(familyGroupsId),
        recordStatus: RecordStatus.Active,
      },
      take: limit,
      skip: offset,
      relations: OFFERING_INCOME_RELATIONS,
      order: { createdAt: order as FindOptionsOrderValue },
    });

    if (offeringIncome.length === 0) {
      const from = dateFormatterToDDMMYYYY(fromTimestamp);
      const to = dateFormatterToDDMMYYYY(toTimestamp);

      throw new NotFoundException(
        `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este rango de fechas: ${from} - ${to}, este código de grupo: ${code} y con esta iglesia: ${church ? church.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }

    return offeringIncomeDataFormatter({ offeringIncome }) as any;
  }
}
