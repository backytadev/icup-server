import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Between, FindOptionsOrderValue } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';
import { OfferingIncomeCreationShiftTypeNames } from '@/modules/offering/income/enums/offering-income-creation-shift-type.enum';

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
export class OfferingIncomeByShiftDateStrategy
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
    const [shift, date] = term.split('&');
    const shiftTerm = shift.toLowerCase();
    const validShifts = ['day', 'afternoon'];

    if (!validShifts.includes(shiftTerm)) {
      throw new BadRequestException(`Turno no válido: ${term}`);
    }

    const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

    if (isNaN(fromTimestamp)) {
      throw new NotFoundException('Formato de marca de tiempo invalido.');
    }

    const fromDate = new Date(fromTimestamp);
    const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

    const offeringIncome = await offeringIncomeRepository.find({
      where: {
        ...(church && { church }),
        subType: searchType,
        date: Between(fromDate, toDate),
        shift: shiftTerm,
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
      const shiftInSpanish =
        OfferingIncomeCreationShiftTypeNames[shiftTerm] ?? shiftTerm;

      throw new NotFoundException(
        `No se encontraron ingresos de ofrendas (${OfferingIncomeSearchTypeNames[searchType]}) con este rango de fechas: ${from} - ${to}, turno: ${shiftInSpanish} y con esta iglesia: ${church ? church.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }

    return offeringIncomeDataFormatter({ offeringIncome }) as any;
  }
}
