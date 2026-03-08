import { Injectable, NotFoundException } from '@nestjs/common';
import { Between, FindOptionsOrderValue, In, Raw } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';

import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import {
  OfferingIncomeSearchType,
  OfferingIncomeSearchTypeNames,
} from '@/modules/offering/income/enums/offering-income-search-type.enum';
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
export class OfferingIncomeByZoneDateStrategy
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
    zoneRepository,
  }: OfferingIncomeSearchStrategyProps): Promise<OfferingIncome[]> {
    const [zoneTerm, date] = term.split('&');
    const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

    if (isNaN(fromTimestamp)) {
      throw new NotFoundException('Formato de marca de tiempo invalido.');
    }

    const fromDate = new Date(fromTimestamp);
    const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;
    const isFamilyGroup = searchType === OfferingIncomeSearchType.FamilyGroup;

    const zones = await zoneRepository.find({
      where: {
        ...(church && { theirChurch: church }),
        zoneName: Raw(
          (alias) =>
            `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
          { searchTerm: `%${zoneTerm.toLowerCase()}%` },
        ),
      },
      ...(isFamilyGroup && { relations: ['familyGroups'] }),
    });

    let offeringIncome: OfferingIncome[];

    if (isFamilyGroup) {
      const familyGroupsId = zones
        .flatMap((zone) => zone.familyGroups ?? [])
        .map((fg) => fg.id);

      offeringIncome = await offeringIncomeRepository.find({
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
    } else {
      const zonesId = zones.map((zone) => zone.id);

      offeringIncome = await offeringIncomeRepository.find({
        where: {
          ...(church && { church }),
          subType: searchType,
          date: Between(fromDate, toDate),
          zone: In(zonesId),
          recordStatus: RecordStatus.Active,
        },
        take: limit,
        skip: offset,
        relations: OFFERING_INCOME_RELATIONS,
        order: { createdAt: order as FindOptionsOrderValue },
      });
    }

    if (offeringIncome.length === 0) {
      const from = dateFormatterToDDMMYYYY(fromTimestamp);
      const to = dateFormatterToDDMMYYYY(toTimestamp);

      throw new NotFoundException(
        `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este rango de fechas: ${from} - ${to}, con esta zona: ${zoneTerm} y con esta iglesia: ${church ? church.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }

    return offeringIncomeDataFormatter({ offeringIncome }) as any;
  }
}
