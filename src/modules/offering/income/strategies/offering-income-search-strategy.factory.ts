import { Injectable } from '@nestjs/common';

import {
  OfferingIncomeSearchSubType,
} from '@/modules/offering/income/enums/offering-income-search-sub-type.enum';
import {
  OfferingIncomeSearchType,
} from '@/modules/offering/income/enums/offering-income-search-type.enum';
import { OfferingIncomeSearchStrategy } from '@/modules/offering/income/strategies/interfaces/offering-income-search.strategy.interface';

import { OfferingIncomeByDateStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-date.strategy';
import { OfferingIncomeByShiftStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-shift.strategy';
import { OfferingIncomeByShiftDateStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-shift-date.strategy';
import { OfferingIncomeByRecordStatusStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-record-status.strategy';
import { OfferingIncomeByZoneStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-zone.strategy';
import { OfferingIncomeByZoneDateStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-zone-date.strategy';
import { OfferingIncomeByGroupCodeStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-group-code.strategy';
import { OfferingIncomeByGroupCodeDateStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-group-code-date.strategy';
import { OfferingIncomeByPreacherFirstNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-preacher-first-names.strategy';
import { OfferingIncomeByPreacherLastNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-preacher-last-names.strategy';
import { OfferingIncomeByPreacherFullNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-preacher-full-names.strategy';
import { OfferingIncomeByZoneSupervisorFirstNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-supervisor-first-names.strategy';
import { OfferingIncomeByZoneSupervisorLastNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-supervisor-last-names.strategy';
import { OfferingIncomeByZoneSupervisorFullNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-supervisor-full-names.strategy';
import { OfferingIncomeByContributorFirstNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-contributor-first-names.strategy';
import { OfferingIncomeByContributorLastNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-contributor-last-names.strategy';
import { OfferingIncomeByContributorFullNamesStrategy } from '@/modules/offering/income/strategies/options/offering-income-by-contributor-full-names.strategy';

@Injectable()
export class OfferingIncomeSearchStrategyFactory {
  private readonly subTypeStrategies: Map<
    OfferingIncomeSearchSubType,
    OfferingIncomeSearchStrategy
  >;
  private readonly typeStrategies: Map<
    OfferingIncomeSearchType,
    OfferingIncomeSearchStrategy
  >;

  constructor(
    private readonly byDate: OfferingIncomeByDateStrategy,
    private readonly byShift: OfferingIncomeByShiftStrategy,
    private readonly byShiftDate: OfferingIncomeByShiftDateStrategy,
    private readonly byRecordStatus: OfferingIncomeByRecordStatusStrategy,
    private readonly byZone: OfferingIncomeByZoneStrategy,
    private readonly byZoneDate: OfferingIncomeByZoneDateStrategy,
    private readonly byGroupCode: OfferingIncomeByGroupCodeStrategy,
    private readonly byGroupCodeDate: OfferingIncomeByGroupCodeDateStrategy,
    private readonly byPreacherFirstNames: OfferingIncomeByPreacherFirstNamesStrategy,
    private readonly byPreacherLastNames: OfferingIncomeByPreacherLastNamesStrategy,
    private readonly byPreacherFullNames: OfferingIncomeByPreacherFullNamesStrategy,
    private readonly bySupervisorFirstNames: OfferingIncomeByZoneSupervisorFirstNamesStrategy,
    private readonly bySupervisorLastNames: OfferingIncomeByZoneSupervisorLastNamesStrategy,
    private readonly bySupervisorFullNames: OfferingIncomeByZoneSupervisorFullNamesStrategy,
    private readonly byContributorFirstNames: OfferingIncomeByContributorFirstNamesStrategy,
    private readonly byContributorLastNames: OfferingIncomeByContributorLastNamesStrategy,
    private readonly byContributorFullNames: OfferingIncomeByContributorFullNamesStrategy,
  ) {
    this.subTypeStrategies = new Map([
      [OfferingIncomeSearchSubType.OfferingByDate, this.byDate],
      [OfferingIncomeSearchSubType.OfferingByShift, this.byShift],
      [OfferingIncomeSearchSubType.OfferingByShiftDate, this.byShiftDate],
      [OfferingIncomeSearchSubType.OfferingByZone, this.byZone],
      [OfferingIncomeSearchSubType.OfferingByZoneDate, this.byZoneDate],
      [OfferingIncomeSearchSubType.OfferingByGroupCode, this.byGroupCode],
      [OfferingIncomeSearchSubType.OfferingByGroupCodeDate, this.byGroupCodeDate],
      [OfferingIncomeSearchSubType.OfferingByPreacherFirstNames, this.byPreacherFirstNames],
      [OfferingIncomeSearchSubType.OfferingByPreacherLastNames, this.byPreacherLastNames],
      [OfferingIncomeSearchSubType.OfferingByPreacherFullNames, this.byPreacherFullNames],
      [OfferingIncomeSearchSubType.OfferingBySupervisorFirstNames, this.bySupervisorFirstNames],
      [OfferingIncomeSearchSubType.OfferingBySupervisorLastNames, this.bySupervisorLastNames],
      [OfferingIncomeSearchSubType.OfferingBySupervisorFullNames, this.bySupervisorFullNames],
      [OfferingIncomeSearchSubType.OfferingByContributorFirstNames, this.byContributorFirstNames],
      [OfferingIncomeSearchSubType.OfferingByContributorLastNames, this.byContributorLastNames],
      [OfferingIncomeSearchSubType.OfferingByContributorFullNames, this.byContributorFullNames],
    ]);

    this.typeStrategies = new Map([
      [OfferingIncomeSearchType.RecordStatus, this.byRecordStatus],
    ]);
  }

  getStrategy(
    searchType: OfferingIncomeSearchType,
    searchSubType?: OfferingIncomeSearchSubType,
  ): OfferingIncomeSearchStrategy {
    if (searchSubType) {
      const strategy = this.subTypeStrategies.get(searchSubType);
      if (strategy) return strategy;
    }

    const strategy = this.typeStrategies.get(searchType);
    if (strategy) return strategy;

    throw new Error(
      `No strategy found for searchType: ${searchType}, searchSubType: ${searchSubType}`,
    );
  }
}
