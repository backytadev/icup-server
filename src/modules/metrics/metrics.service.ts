import {
  Logger,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Not, Repository } from 'typeorm';

import { endOfMonth, startOfMonth } from 'date-fns';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { DashboardSearchType } from '@/common/enums/dashboard-search-type.enum';

import { ReportPaginationDto } from '@/common/dtos/report-pagination.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { MetricSearchType } from '@/modules/metrics/enums/metrics-search-type.enum';

import { OfferingIncomeCreationType } from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import { OfferingIncomeCreationSubType } from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';

import { IncomeAndExpensesComparativeFormatter } from '@//modules/metrics/helpers/offering-comparative/income-and-expenses-comparative-formatter.helper';
import { comparativeOfferingIncomeByTypeFormatter } from '@//modules/metrics/helpers/offering-comparative/comparative-offering-income-by-type-formatter.helper';
import { generalComparativeOfferingIncomeFormatter } from '@//modules/metrics/helpers/offering-comparative/general-comparative-offering-income-formatter.helper';
import { comparativeOfferingExpensesByTypeFormatter } from '@//modules/metrics/helpers/offering-comparative/comparative-offering-expenses-by-type-formatter.helper';
import { generalComparativeOfferingExpensesFormatter } from '@//modules/metrics/helpers/offering-comparative/general-comparative-offering-expenses-formatter.helper';
import { ComparativeOfferingExpensesBySubTypeFormatter } from '@//modules/metrics/helpers/offering-comparative/comparative-offering-expenses-by-sub-type-formatter.helper';

import { Church } from '@/modules/church/entities/church.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';

import { DashboardMetricsService } from '@/modules/metrics/services/dashboard-metrics.service';
import { MemberMetricsService } from '@/modules/metrics/services/member-metrics.service';
import { FamilyGroupMetricsService } from '@/modules/metrics/services/family-group-metrics.service';
import { OfferingIncomeMetricsService } from '@/modules/metrics/services/offering-income-metrics.service';
import { OfferingExpenseMetricsService } from '@/modules/metrics/services/offering-expense-metrics.service';
import { OfferingComparativeMetricsService } from '@/modules/metrics/services/offering-comparative-metrics.service';

//* Dispatch sets
const DASHBOARD_TYPES = new Set<DashboardSearchType>([
  DashboardSearchType.LastSundaysOfferings,
  DashboardSearchType.TopFamilyGroupsOfferings,
]);

const MEMBER_TYPES = new Set<MetricSearchType>([
  MetricSearchType.MembersByProportion,
  MetricSearchType.MembersFluctuationByYear,
  MetricSearchType.MembersByBirthMonth,
  MetricSearchType.MembersByCategory,
  MetricSearchType.MembersByCategoryAndGender,
  MetricSearchType.MembersByRoleAndGender,
  MetricSearchType.MembersByMaritalStatus,
  MetricSearchType.DisciplesByZoneAndGender,
  MetricSearchType.PreachersByZoneAndGender,
  MetricSearchType.MembersByDistrictAndGender,
  MetricSearchType.MembersByRecordStatus,
]);

const FAMILY_GROUP_TYPES = new Set<MetricSearchType>([
  MetricSearchType.FamilyGroupsByProportion,
  MetricSearchType.FamilyGroupsFluctuationByYear,
  MetricSearchType.FamilyGroupsByZone,
  MetricSearchType.FamilyGroupsByCopastorAndZone,
  MetricSearchType.FamilyGroupsByDistrict,
  MetricSearchType.FamilyGroupsByServiceTime,
  MetricSearchType.FamilyGroupsByRecordStatus,
]);

const OFFERING_INCOME_TYPES = new Set<MetricSearchType>([
  MetricSearchType.OfferingIncomeByProportion,
  MetricSearchType.OfferingIncomeBySundayService,
  MetricSearchType.OfferingIncomeByFamilyGroup,
  MetricSearchType.OfferingIncomeBySundaySchool,
  MetricSearchType.OfferingIncomeByFastingAndVigilAndEvangelism,
  MetricSearchType.OfferingIncomeByYouthService,
  MetricSearchType.OfferingIncomeBySpecialOffering,
  MetricSearchType.OfferingIncomeByChurchGround,
  MetricSearchType.OfferingIncomeByUnitedService,
  MetricSearchType.OfferingIncomeByActivities,
  MetricSearchType.OfferingIncomeAdjustment,
]);

const OFFERING_EXPENSE_TYPES = new Set<MetricSearchType>([
  MetricSearchType.OfferingExpensesByProportion,
  MetricSearchType.OperationalOfferingExpenses,
  MetricSearchType.MaintenanceAndRepairOfferingExpenses,
  MetricSearchType.DecorationOfferingExpenses,
  MetricSearchType.EquipmentAndTechnologyOfferingExpenses,
  MetricSearchType.SuppliesOfferingExpenses,
  MetricSearchType.PlaningEventsOfferingExpenses,
  MetricSearchType.OtherOfferingExpenses,
  MetricSearchType.OfferingExpensesAdjustment,
]);

const COMPARATIVE_TYPES = new Set<MetricSearchType>([
  MetricSearchType.OfferingExpensesAndOfferingIncomeByProportion,
  MetricSearchType.IncomeAndExpensesComparativeByYear,
  MetricSearchType.GeneralComparativeOfferingIncome,
  MetricSearchType.ComparativeOfferingIncomeByType,
  MetricSearchType.GeneralComparativeOfferingExpenses,
  MetricSearchType.ComparativeOfferingExpensesByType,
  MetricSearchType.ComparativeOfferingExpensesBySubType,
]);

@Injectable()
export class MetricsService {
  private readonly logger = new Logger('MetricsService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,

    @InjectRepository(OfferingExpense)
    private readonly offeringExpenseRepository: Repository<OfferingExpense>,

    private readonly dashboardMetrics: DashboardMetricsService,
    private readonly memberMetrics: MemberMetricsService,
    private readonly familyGroupMetrics: FamilyGroupMetricsService,
    private readonly offeringIncomeMetrics: OfferingIncomeMetricsService,
    private readonly offeringExpenseMetrics: OfferingExpenseMetricsService,
    private readonly comparativeMetrics: OfferingComparativeMetricsService,
  ) {}

  //? GENERE BALANCE SUMMARY
  async generateFinancialBalanceSummary(
    paginationDto: ReportPaginationDto,
  ): Promise<any> {
    const { churchId, endMonth, startMonth, year, currency } = paginationDto;

    const yearValue = +year;

    const currentStartMonthDate = new Date(`January 1, ${yearValue}`);
    const currentEndMonthDate = new Date(`December 1, ${yearValue}`);

    const currentYearStartDate = startOfMonth(currentStartMonthDate);
    const currentYearEndDate = endOfMonth(currentEndMonthDate);

    const previousStartMonthDate = new Date(`January 1, ${yearValue - 1}`);
    const previousEndMonthDate = new Date(`December 1, ${yearValue - 1}`);

    const previousYearStartDate = startOfMonth(previousStartMonthDate);
    const previousYearEndDate = endOfMonth(previousEndMonthDate);

    //* Income
    const startMonthDateIncome = new Date(`${startMonth} 1, ${year}`);
    const endMonthDateIncome = new Date(`${endMonth} 1, ${year}`);

    const startDateIncome = startOfMonth(startMonthDateIncome);
    const endDateIncome = endOfMonth(endMonthDateIncome);

    //* Expenses
    const startMonthDateExpenses = new Date(`${startMonth} 1, ${year}`);
    const endMonthDateExpenses = new Date(`${endMonth} 1, ${year}`);

    const startDateExpenses = startOfMonth(startMonthDateExpenses);
    const endDateExpenses = endOfMonth(endMonthDateExpenses);

    try {
      const church = await this.churchRepository.findOne({
        where: {
          id: churchId,
          recordStatus: RecordStatus.Active,
        },
      });

      if (!church) return [];

      //? Resumen general (ingresos vs salidas)
      //* Current year
      const currentYearOfferingIncome =
        await this.offeringIncomeRepository.find({
          where: [
            {
              church: church,
              subType: Not(OfferingIncomeCreationSubType.ChurchGround),
              currency: currency,
              date: Between(currentYearStartDate, currentYearEndDate),
              recordStatus: RecordStatus.Active,
            },
            {
              church: church,
              subType: IsNull(),
              currency: currency,
              date: Between(currentYearStartDate, currentYearEndDate),
              recordStatus: RecordStatus.Active,
            },
          ],
          relations: ['church'],
        });

      const currentYearOfferingExpenses =
        await this.offeringExpenseRepository.find({
          where: {
            church: church,
            currency: currency,
            date: Between(currentYearStartDate, currentYearEndDate),
            recordStatus: RecordStatus.Active,
          },
          relations: ['church'],
        });

      //* Previous year
      const previousYearOfferingIncome =
        await this.offeringIncomeRepository.find({
          where: [
            {
              church: church,
              subType: Not(OfferingIncomeCreationSubType.ChurchGround),

              currency: currency,
              date: Between(previousYearStartDate, previousYearEndDate),
              recordStatus: RecordStatus.Active,
            },
            {
              church: church,
              subType: IsNull(),
              currency: currency,
              date: Between(previousYearStartDate, previousYearEndDate),
              recordStatus: RecordStatus.Active,
            },
          ],
          relations: ['church'],
        });

      const previousYearOfferingExpenses =
        await this.offeringExpenseRepository.find({
          where: {
            church: church,
            currency: currency,
            date: Between(previousYearStartDate, previousYearEndDate),
            recordStatus: RecordStatus.Active,
          },
          relations: ['church'],
        });

      const calculateBalanceSummary = IncomeAndExpensesComparativeFormatter({
        currentYearOfferingIncome: currentYearOfferingIncome,
        currentYearOfferingExpenses: currentYearOfferingExpenses,
        previousYearOfferingIncome: previousYearOfferingIncome,
        previousYearOfferingExpenses: previousYearOfferingExpenses,
        startMonth: startMonth,
        endMonth: endMonth,
        church,
      }) as any;

      //? Resumen de Ingresos
      const offeringIncome = await this.offeringIncomeRepository.find({
        where: {
          church: church,
          date: Between(startDateIncome, endDateIncome),
          recordStatus: RecordStatus.Active,
        },
        relations: ['church'],
      });

      const calculateSummaryIncome = generalComparativeOfferingIncomeFormatter({
        offeringIncome: offeringIncome,
      }) as any;

      //? Resumen de Salidas
      const offeringExpenses = await this.offeringExpenseRepository.find({
        where: {
          church: church,
          date: Between(startDateExpenses, endDateExpenses),
          recordStatus: RecordStatus.Active,
        },

        relations: ['church'],
      });

      const calculateSummaryExpenses =
        generalComparativeOfferingExpensesFormatter({
          offeringExpenses,
        }) as any;

      //* Final data
      return {
        calculateBalanceSummary,
        calculateSummaryIncome,
        calculateSummaryExpenses,
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //? Find by month (cards)
  //* Income
  async getIncomeMonthlyDetailByType(
    paginationDto: ReportPaginationDto,
  ): Promise<any> {
    const { churchId, endMonth, type, startMonth, year } = paginationDto;
    const yearVale = +year;

    const startMonthDate = new Date(`January 1, ${yearVale}`);
    const endMonthDate = new Date(`December 1, ${yearVale}`);
    const startDate = startOfMonth(startMonthDate);
    const endDate = endOfMonth(endMonthDate);

    try {
      const church = await this.churchRepository.findOne({
        where: {
          id: churchId,
          recordStatus: RecordStatus.Active,
        },
      });
      if (!church) return [];
      let offeringIncome: OfferingIncome[];
      if (type !== OfferingIncomeCreationType.IncomeAdjustment) {
        offeringIncome = await this.offeringIncomeRepository.find({
          where: {
            church: church,
            subType: type,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          relations: ['church'],
        });
      }
      if (type === OfferingIncomeCreationType.IncomeAdjustment) {
        offeringIncome = await this.offeringIncomeRepository.find({
          where: {
            church: church,
            type: type,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          relations: ['church'],
        });
      }
      return comparativeOfferingIncomeByTypeFormatter({
        offeringIncome: offeringIncome,
        startMonth,
        endMonth,
      }) as any;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Expense
  async getExpenseMonthlyDetailByType(
    paginationDto: ReportPaginationDto,
  ): Promise<any> {
    const { churchId, endMonth, type, startMonth, year } = paginationDto;
    const yearVale = +year;

    const startMonthDate = new Date(`January 1, ${yearVale}`);
    const endMonthDate = new Date(`December 1, ${yearVale}`);
    const startDate = startOfMonth(startMonthDate);
    const endDate = endOfMonth(endMonthDate);

    try {
      const church = await this.churchRepository.findOne({
        where: {
          id: churchId,
          recordStatus: RecordStatus.Active,
        },
      });

      if (!church) return [];

      const offeringExpenses = await this.offeringExpenseRepository.find({
        where: {
          church: church,
          type: type,
          date: Between(startDate, endDate),
          recordStatus: RecordStatus.Active,
        },
        relations: ['church'],
      });

      return comparativeOfferingExpensesByTypeFormatter({
        offeringExpenses,
        endMonth,
        startMonth,
      }) as any;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  async getExpenseMonthlyDetailBySubType(
    paginationDto: ReportPaginationDto,
  ): Promise<any> {
    const { churchId, endMonth, type, startMonth, year } = paginationDto;
    const yearValue = +year;

    const startMonthDate = new Date(`${startMonth} 1, ${yearValue}`);
    const endMonthDate = new Date(`${endMonth} 1, ${yearValue}`);

    const startDate = startOfMonth(startMonthDate);
    const endDate = endOfMonth(endMonthDate);

    try {
      const church = await this.churchRepository.findOne({
        where: {
          id: churchId,
          recordStatus: RecordStatus.Active,
        },
      });

      if (!church) return [];

      const offeringExpenses = await this.offeringExpenseRepository.find({
        where: {
          church: church,
          type: type,
          date: Between(startDate, endDate),
          recordStatus: RecordStatus.Active,
        },
        relations: ['church'],
      });

      return ComparativeOfferingExpensesBySubTypeFormatter({
        offeringExpenses,
      }) as any;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find by term
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<any> {
    const { searchType } = searchTypeAndPaginationDto;

    if (!term) {
      throw new BadRequestException(`El termino de búsqueda es requerido.`);
    }

    if (!searchType) {
      throw new BadRequestException(`El tipo de búsqueda es requerido1.`);
    }

    if (DASHBOARD_TYPES.has(searchType as any))
      return this.dashboardMetrics.findByTerm(term, searchTypeAndPaginationDto);

    if (MEMBER_TYPES.has(searchType as MetricSearchType))
      return this.memberMetrics.findByTerm(term, searchTypeAndPaginationDto);

    if (FAMILY_GROUP_TYPES.has(searchType as MetricSearchType))
      return this.familyGroupMetrics.findByTerm(
        term,
        searchTypeAndPaginationDto,
      );

    if (OFFERING_INCOME_TYPES.has(searchType as MetricSearchType))
      return this.offeringIncomeMetrics.findByTerm(
        term,
        searchTypeAndPaginationDto,
      );

    if (OFFERING_EXPENSE_TYPES.has(searchType as MetricSearchType))
      return this.offeringExpenseMetrics.findByTerm(
        term,
        searchTypeAndPaginationDto,
      );

    if (COMPARATIVE_TYPES.has(searchType as MetricSearchType))
      return this.comparativeMetrics.findByTerm(
        term,
        searchTypeAndPaginationDto,
      );
  }

  //* Private methods
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(`${error.message}`);
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
