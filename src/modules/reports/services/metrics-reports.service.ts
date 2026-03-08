import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RecordOrder } from '@/common/enums/record-order.enum';
import { ReportPaginationDto } from '@/common/dtos/report-pagination.dto';

import { CurrencyType } from '@/modules/offering/shared/enums/currency-type.enum';
import { OfferingIncomeCreationSubType } from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';
import { OfferingIncomeCreationType } from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import { OfferingExpenseSearchType } from '@/modules/offering/expense/enums/offering-expense-search-type.enum';

import { PrinterService } from '@/modules/printer/printer.service';
import { MetricsService } from '@/modules/metrics/metrics.service';
import { MetricSearchType } from '@/modules/metrics/enums/metrics-search-type.enum';

import { Church } from '@/modules/church/entities/church.entity';

import { MonthlyMemberDataResult } from '@/modules/metrics/helpers/member/member-formatter-by-birth-month.helper';
import { MembersByCategoryDataResult } from '@/modules/metrics/helpers/member/member-formatter-by-category.helper';
import { MembersByZoneDataResult } from '@/modules/metrics/helpers/member/disciple-formatter-by-zone-and-gender.helper';
import { PreachersByZoneDataResult } from '@/modules/metrics/helpers/member/preacher-formatter-by-zone-and-gender.helper';
import { MonthlyMemberFluctuationDataResult } from '@/modules/metrics/helpers/member/member-fluctuation-formatter.helper';
import { MembersByRecordStatusDataResult } from '@/modules/metrics/helpers/member/member-formatter-by-record-status.helper';
import { MembersByMaritalStatusDataResult } from '@/modules/metrics/helpers/member/member-formatter-by-marital-status.helper';
import { MemberByRoleAndGenderDataResult } from '@/modules/metrics/helpers/member/member-formatter-by-role-and-gender.helper';
import { MembersByDistrictAndGenderDataResult } from '@/modules/metrics/helpers/member/member-formatter-by-district-and-gender.helper';
import { MembersByCategoryAndGenderDataResult } from '@/modules/metrics/helpers/member/member-formatter-by-category-and-gender.helper';

import { FamilyGroupsByZoneDataResult } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-zone.helper';
import { FamilyGroupsByCopastorAndZoneDataResult } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-copastor-and-zone.helper';
import { FamilyGroupsByDistrictDataResult } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-district.helper';
import { FamilyGroupsByServiceTimeDataResult } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-service-time.helper';
import { MonthlyFamilyGroupsFluctuationDataResult } from '@/modules/metrics/helpers/family-group/family-group-fluctuation-formatter.helper';
import { FamilyGroupsByRecordStatusDataResult } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-record-status.helper';

import { OfferingIncomeByActivitiesDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-activities-formatter.helper';
import { OfferingIncomeByFamilyGroupDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-family-group-formatter.helper';
import { OfferingIncomeByChurchGroundDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-church-ground-formatter.helper';
import { OfferingIncomeBySundaySchoolDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-sunday-school-formatter.helper';
import { OfferingIncomeByYouthServiceDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-youth-service-formatter.helper';
import { OfferingIncomeBySundayServiceDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-sunday-service-formatter.helper';
import { OfferingIncomeByUnitedServiceDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-united-service-formatter.helper';
import { OfferingIncomeBySpecialOfferingDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-special-offering-formatter.helper';
import { OfferingIncomeByFastingAndVigilAndEvangelismDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-fasting-and-vigil-and-evangelism-formatter.helper';
import { OfferingIncomeByIncomeAdjustmentDataResult } from '@/modules/metrics/helpers/offering-income/offering-income-by-income-adjustment-formatter.helper';

import { OfferingExpenseDataResult } from '@/modules/metrics/helpers/offering-expense/offering-expense-chart-formatter.helper';
import { OfferingExpensesAdjustmentDataResult } from '@/modules/metrics/helpers/offering-expense/offering-expenses-adjustment-formatter.helper';

import { YearlyIncomeExpenseComparativeDataResult } from '@/modules/metrics/helpers/offering-comparative/income-and-expenses-comparative-formatter.helper';
import { OfferingIncomeComparativeByTypeDataResult } from '@/modules/metrics/helpers/offering-comparative/comparative-offering-income-by-type-formatter.helper';
import { GeneralOfferingIncomeComparativeDataResult } from '@/modules/metrics/helpers/offering-comparative/general-comparative-offering-income-formatter.helper';
import { OfferingExpenseComparativeByTypeDataResult } from '@/modules/metrics/helpers/offering-comparative/comparative-offering-expenses-by-type-formatter.helper';
import { GeneralOfferingExpensesComparativeDataResult } from '@/modules/metrics/helpers/offering-comparative/general-comparative-offering-expenses-formatter.helper';
import { OfferingExpenseComparativeBySubTypeDataResult } from '@/modules/metrics/helpers/offering-comparative/comparative-offering-expenses-by-sub-type-formatter.helper';

import { getMemberMetricsReport } from '@/modules/reports/reports-types/metrics/member-metrics.report';
import { getFamilyGroupMetricsReport } from '@/modules/reports/reports-types/metrics/family-group-metrics.report';
import { getOfferingIncomeMetricsReport } from '@/modules/reports/reports-types/metrics/offering-income-metrics.report';
import { getOfferingExpensesMetricsReport } from '@/modules/reports/reports-types/metrics/offering-expenses-metrics.report';
import { getFinancialBalanceComparativeMetricsReport } from '@/modules/reports/reports-types/metrics/financial-balance-comparative-metrics.report';

@Injectable()
export class MetricsReportsService {
  private readonly logger = new Logger('MetricsReportsService');

  constructor(
    private readonly printerService: PrinterService,
    private readonly metricsService: MetricsService,

    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,
  ) {}

  //* MEMBER METRICS
  async getMemberMetrics(metricsPaginationDto: ReportPaginationDto) {
    const { year, churchId, types } = metricsPaginationDto;

    try {
      const church = await this.churchRepository.findOne({
        where: { id: churchId },
      });

      if (!church) {
        throw new NotFoundException(
          `No se encontró ninguna iglesia con este ID: ${churchId}.`,
        );
      }

      const metricsTypesArray = types.split('+');

      let membersFluctuationByYearDataResult: MonthlyMemberFluctuationDataResult[];
      if (
        metricsTypesArray.includes(MetricSearchType.MembersFluctuationByYear)
      ) {
        membersFluctuationByYearDataResult =
          await this.metricsService.findByTerm(`${churchId}&${year}`, {
            searchType: MetricSearchType.MembersFluctuationByYear,
          });
      }

      let membersByBirthMonthDataResult: MonthlyMemberDataResult[];
      if (metricsTypesArray.includes(MetricSearchType.MembersByBirthMonth)) {
        membersByBirthMonthDataResult = await this.metricsService.findByTerm(
          churchId,
          { searchType: MetricSearchType.MembersByBirthMonth },
        );
      }

      let membersByCategoryDataResult: MembersByCategoryDataResult;
      if (metricsTypesArray.includes(MetricSearchType.MembersByCategory)) {
        membersByCategoryDataResult = await this.metricsService.findByTerm(
          churchId,
          { searchType: MetricSearchType.MembersByCategory },
        );
      }

      let membersByCategoryAndGenderDataResult: MembersByCategoryAndGenderDataResult;
      if (
        metricsTypesArray.includes(MetricSearchType.MembersByCategoryAndGender)
      ) {
        membersByCategoryAndGenderDataResult =
          await this.metricsService.findByTerm(churchId, {
            searchType: MetricSearchType.MembersByCategoryAndGender,
          });
      }

      let membersByRoleAndGenderDataResult: MemberByRoleAndGenderDataResult;
      if (metricsTypesArray.includes(MetricSearchType.MembersByRoleAndGender)) {
        membersByRoleAndGenderDataResult = await this.metricsService.findByTerm(
          churchId,
          { searchType: MetricSearchType.MembersByRoleAndGender },
        );
      }

      let membersByMaritalStatusDataResult: MembersByMaritalStatusDataResult;
      if (metricsTypesArray.includes(MetricSearchType.MembersByMaritalStatus)) {
        membersByMaritalStatusDataResult = await this.metricsService.findByTerm(
          churchId,
          { searchType: MetricSearchType.MembersByMaritalStatus },
        );
      }

      let disciplesByZoneAndGenderDataResult: MembersByZoneDataResult;
      if (
        metricsTypesArray.includes(MetricSearchType.DisciplesByZoneAndGender)
      ) {
        disciplesByZoneAndGenderDataResult =
          await this.metricsService.findByTerm(`${churchId}&{''}`, {
            searchType: MetricSearchType.DisciplesByZoneAndGender,
            allZones: true,
          });
      }

      let preachersByZoneAndGenderDataResult: PreachersByZoneDataResult;
      if (
        metricsTypesArray.includes(MetricSearchType.PreachersByZoneAndGender)
      ) {
        preachersByZoneAndGenderDataResult =
          await this.metricsService.findByTerm(`${churchId}&{''}`, {
            searchType: MetricSearchType.PreachersByZoneAndGender,
            allZones: true,
          });
      }

      let membersByDistrictAndGenderDataResult: MembersByDistrictAndGenderDataResult;
      if (
        metricsTypesArray.includes(MetricSearchType.MembersByDistrictAndGender)
      ) {
        membersByDistrictAndGenderDataResult =
          await this.metricsService.findByTerm(churchId, {
            searchType: MetricSearchType.MembersByDistrictAndGender,
          });
      }

      let membersByRecordStatusDataResult: MembersByRecordStatusDataResult;
      if (metricsTypesArray.includes(MetricSearchType.MembersByRecordStatus)) {
        membersByRecordStatusDataResult = await this.metricsService.findByTerm(
          churchId,
          { searchType: MetricSearchType.MembersByRecordStatus },
        );
      }

      const docDefinition = getMemberMetricsReport({
        title: 'Reporte de Métricas de Miembro',
        subTitle: 'Resultados de Búsqueda de Métricas de Miembros',
        metricsTypesArray,
        year,
        church,
        membersFluctuationByYearDataResult,
        membersByBirthMonthDataResult,
        membersByCategoryDataResult,
        membersByCategoryAndGenderDataResult,
        membersByRoleAndGenderDataResult,
        membersByMaritalStatusDataResult,
        disciplesByZoneAndGenderDataResult,
        preachersByZoneAndGenderDataResult,
        membersByDistrictAndGenderDataResult,
        membersByRecordStatusDataResult,
      });

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* FAMILY GROUP METRICS
  async getFamilyGroupMetrics(metricsPaginationDto: ReportPaginationDto) {
    const { year, churchId, types } = metricsPaginationDto;

    try {
      const church = await this.churchRepository.findOne({
        where: { id: churchId },
      });

      if (!church) {
        throw new NotFoundException(
          `No se encontró ninguna iglesia con este ID: ${churchId}.`,
        );
      }

      const metricsTypesArray = types.split('+');

      let familyGroupsFluctuationByYearDataResult: MonthlyFamilyGroupsFluctuationDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.FamilyGroupsFluctuationByYear,
        )
      ) {
        familyGroupsFluctuationByYearDataResult =
          await this.metricsService.findByTerm(`${churchId}&${year}`, {
            searchType: MetricSearchType.FamilyGroupsFluctuationByYear,
          });
      }

      let familyGroupsByZoneDataResult: FamilyGroupsByZoneDataResult;
      if (metricsTypesArray.includes(MetricSearchType.FamilyGroupsByZone)) {
        familyGroupsByZoneDataResult = await this.metricsService.findByTerm(
          `${churchId}&{''}`,
          {
            searchType: MetricSearchType.FamilyGroupsByZone,
            allFamilyGroups: true,
            order: 'ASC',
          },
        );
      }

      let familyGroupsByCopastorAndZoneDataResult: FamilyGroupsByCopastorAndZoneDataResult;
      if (
        metricsTypesArray.includes(
          MetricSearchType.FamilyGroupsByCopastorAndZone,
        )
      ) {
        familyGroupsByCopastorAndZoneDataResult =
          await this.metricsService.findByTerm(`${churchId}&{''}`, {
            searchType: MetricSearchType.FamilyGroupsByCopastorAndZone,
            allZones: true,
            order: 'DESC',
          });
      }

      let familyGroupsByDistrictDataResult: FamilyGroupsByDistrictDataResult;
      if (metricsTypesArray.includes(MetricSearchType.FamilyGroupsByDistrict)) {
        familyGroupsByDistrictDataResult = await this.metricsService.findByTerm(
          `${churchId}&${''}`,
          {
            searchType: MetricSearchType.FamilyGroupsByDistrict,
            allDistricts: true,
            order: 'DESC',
          },
        );
      }

      let familyGroupsByServiceTimeDataResult: FamilyGroupsByServiceTimeDataResult;
      if (
        metricsTypesArray.includes(MetricSearchType.FamilyGroupsByServiceTime)
      ) {
        familyGroupsByServiceTimeDataResult =
          await this.metricsService.findByTerm(`${churchId}&${''}`, {
            searchType: MetricSearchType.FamilyGroupsByServiceTime,
            allZones: true,
            order: 'DESC',
          });
      }

      let familyGroupsByRecordStatusDataResult: FamilyGroupsByRecordStatusDataResult;
      if (
        metricsTypesArray.includes(MetricSearchType.FamilyGroupsByRecordStatus)
      ) {
        familyGroupsByRecordStatusDataResult =
          await this.metricsService.findByTerm(`${churchId}&${''}`, {
            searchType: MetricSearchType.FamilyGroupsByRecordStatus,
            allZones: true,
          });
      }

      const docDefinition = getFamilyGroupMetricsReport({
        title: 'Reporte de Métricas de Grupo Familiar',
        subTitle: 'Resultados de Búsqueda de Métricas de Grupo Familiar',
        metricsTypesArray,
        year,
        familyGroupsFluctuationByYearDataResult,
        familyGroupsByZoneDataResult,
        familyGroupsByCopastorAndZoneDataResult,
        familyGroupsByDistrictDataResult,
        familyGroupsByServiceTimeDataResult,
        familyGroupsByRecordStatusDataResult,
      });

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* OFFERING INCOME METRICS
  async getOfferingIncomeMetrics(metricsPaginationDto: ReportPaginationDto) {
    const { year, startMonth, endMonth, churchId, types } =
      metricsPaginationDto;

    try {
      const church = await this.churchRepository.findOne({
        where: { id: churchId },
      });

      if (!church) {
        throw new NotFoundException(
          `No se encontró ninguna iglesia con este ID: ${churchId}.`,
        );
      }

      const metricsTypesArray = types.split('+');
      const termRange = `${churchId}&${startMonth}&${endMonth}&${year}`;

      let offeringIncomeBySundayServiceDataResult: OfferingIncomeBySundayServiceDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.OfferingIncomeBySundayService,
        )
      ) {
        offeringIncomeBySundayServiceDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.OfferingIncomeBySundayService,
            isSingleMonth: false,
          });
      }

      let offeringIncomeByFamilyGroupDataResult: OfferingIncomeByFamilyGroupDataResult[][];
      if (
        metricsTypesArray.includes(MetricSearchType.OfferingIncomeByFamilyGroup)
      ) {
        const resultData = await this.metricsService.findByTerm(termRange, {
          searchType: MetricSearchType.OfferingIncomeByFamilyGroup,
          isSingleMonth: false,
        });

        const groupByZone = (data: any[]): any[][] => {
          const grouped: Record<string, any[]> = {};
          for (const item of data) {
            const zoneName = item.zone.zoneName;
            if (!grouped[zoneName]) grouped[zoneName] = [];
            grouped[zoneName].push(item);
          }
          return Object.values(grouped);
        };

        offeringIncomeByFamilyGroupDataResult = groupByZone(resultData);
      }

      let offeringIncomeBySundaySchoolDataResult: OfferingIncomeBySundaySchoolDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.OfferingIncomeBySundaySchool,
        )
      ) {
        offeringIncomeBySundaySchoolDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.OfferingIncomeBySundaySchool,
            isSingleMonth: false,
          });
      }

      let offeringIncomeByUnitedServiceDataResult: OfferingIncomeByUnitedServiceDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.OfferingIncomeByUnitedService,
        )
      ) {
        offeringIncomeByUnitedServiceDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.OfferingIncomeByUnitedService,
            isSingleMonth: false,
          });
      }

      let offeringIncomeByFastingAndVigilDataResult: OfferingIncomeByFastingAndVigilAndEvangelismDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.OfferingIncomeByFastingAndVigilAndEvangelism,
        )
      ) {
        offeringIncomeByFastingAndVigilDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType:
              MetricSearchType.OfferingIncomeByFastingAndVigilAndEvangelism,
            isSingleMonth: false,
          });
      }

      let offeringIncomeByYouthServiceDataResult: OfferingIncomeByYouthServiceDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.OfferingIncomeByYouthService,
        )
      ) {
        offeringIncomeByYouthServiceDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.OfferingIncomeByYouthService,
            isSingleMonth: false,
          });
      }

      let offeringIncomeBySpecialOfferingDataResult: OfferingIncomeBySpecialOfferingDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.OfferingIncomeBySpecialOffering,
        )
      ) {
        offeringIncomeBySpecialOfferingDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.OfferingIncomeBySpecialOffering,
            isSingleMonth: false,
          });
      }

      let offeringIncomeByChurchGroundDataResult: OfferingIncomeByChurchGroundDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.OfferingIncomeByChurchGround,
        )
      ) {
        offeringIncomeByChurchGroundDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.OfferingIncomeByChurchGround,
            isSingleMonth: false,
          });
      }

      let offeringIncomeByActivitiesDataResult: OfferingIncomeByActivitiesDataResult[];
      if (
        metricsTypesArray.includes(MetricSearchType.OfferingIncomeByActivities)
      ) {
        offeringIncomeByActivitiesDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.OfferingIncomeByActivities,
            isSingleMonth: false,
          });
      }

      let offeringIncomeByIncomeAdjustmentDataResult: OfferingIncomeByIncomeAdjustmentDataResult[];
      if (
        metricsTypesArray.includes(MetricSearchType.OfferingIncomeAdjustment)
      ) {
        offeringIncomeByIncomeAdjustmentDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.OfferingIncomeAdjustment,
            isSingleMonth: false,
          });
      }

      const docDefinition = getOfferingIncomeMetricsReport({
        title: 'Reporte de Métricas de Ingresos de Ofrenda',
        subTitle: 'Resultados de Búsqueda de Métricas de Ingresos de Ofrendas',
        metricsTypesArray,
        year,
        startMonth,
        endMonth,
        offeringIncomeBySundayServiceDataResult,
        offeringIncomeByFamilyGroupDataResult,
        offeringIncomeBySundaySchoolDataResult,
        offeringIncomeByUnitedServiceDataResult,
        offeringIncomeByFastingAndVigilDataResult,
        offeringIncomeByYouthServiceDataResult,
        offeringIncomeBySpecialOfferingDataResult,
        offeringIncomeByChurchGroundDataResult,
        offeringIncomeByActivitiesDataResult,
        offeringIncomeByIncomeAdjustmentDataResult,
      });

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* OFFERING EXPENSE METRICS
  async getOfferingExpenseMetrics(metricsPaginationDto: ReportPaginationDto) {
    const { year, startMonth, endMonth, churchId, types } =
      metricsPaginationDto;

    try {
      const church = await this.churchRepository.findOne({
        where: { id: churchId },
      });

      if (!church) {
        throw new NotFoundException(
          `No se encontró ninguna iglesia con este ID: ${churchId}.`,
        );
      }

      const metricsTypesArray = types.split('+');
      const termRange = `${churchId}&${startMonth}&${endMonth}&${year}`;

      let operationalOfferingExpensesDataResult: OfferingExpenseDataResult[];
      if (
        metricsTypesArray.includes(MetricSearchType.OperationalOfferingExpenses)
      ) {
        operationalOfferingExpensesDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.OperationalOfferingExpenses,
            isSingleMonth: false,
          });
      }

      let maintenanceAndRepairOfferingExpensesDataResult: OfferingExpenseDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.MaintenanceAndRepairOfferingExpenses,
        )
      ) {
        maintenanceAndRepairOfferingExpensesDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.MaintenanceAndRepairOfferingExpenses,
            isSingleMonth: false,
          });
      }

      let decorationOfferingExpensesDataResult: OfferingExpenseDataResult[];
      if (
        metricsTypesArray.includes(MetricSearchType.DecorationOfferingExpenses)
      ) {
        decorationOfferingExpensesDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.DecorationOfferingExpenses,
            isSingleMonth: false,
          });
      }

      let equipmentAndTechnologyOfferingExpensesDataResult: OfferingExpenseDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.EquipmentAndTechnologyOfferingExpenses,
        )
      ) {
        equipmentAndTechnologyOfferingExpensesDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.EquipmentAndTechnologyOfferingExpenses,
            isSingleMonth: false,
          });
      }

      let suppliesOfferingExpensesDataResult: OfferingExpenseDataResult[];
      if (
        metricsTypesArray.includes(MetricSearchType.SuppliesOfferingExpenses)
      ) {
        suppliesOfferingExpensesDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.SuppliesOfferingExpenses,
            isSingleMonth: false,
          });
      }

      let planingEventsOfferingExpensesDataResult: OfferingExpenseDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.PlaningEventsOfferingExpenses,
        )
      ) {
        planingEventsOfferingExpensesDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.PlaningEventsOfferingExpenses,
            isSingleMonth: false,
          });
      }

      let othersOfferingExpensesDataResult: OfferingExpenseDataResult[];
      if (metricsTypesArray.includes(MetricSearchType.OtherOfferingExpenses)) {
        othersOfferingExpensesDataResult = await this.metricsService.findByTerm(
          termRange,
          {
            searchType: MetricSearchType.OtherOfferingExpenses,
            isSingleMonth: false,
          },
        );
      }

      let offeringExpensesAdjustmentsDataResult: OfferingExpensesAdjustmentDataResult[];
      if (
        metricsTypesArray.includes(MetricSearchType.OfferingExpensesAdjustment)
      ) {
        offeringExpensesAdjustmentsDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.OfferingExpensesAdjustment,
            isSingleMonth: false,
          });
      }

      const docDefinition = getOfferingExpensesMetricsReport({
        title: 'Reporte de Métricas de Salida de Ofrenda',
        subTitle: 'Resultados de Búsqueda de Métricas de Salida de Ofrendas',
        metricsTypesArray,
        year,
        startMonth,
        endMonth,
        operationalOfferingExpensesDataResult,
        maintenanceAndRepairOfferingExpensesDataResult,
        decorationOfferingExpensesDataResult,
        equipmentAndTechnologyOfferingExpensesDataResult,
        suppliesOfferingExpensesDataResult,
        planingEventsOfferingExpensesDataResult,
        othersOfferingExpensesDataResult,
        offeringExpensesAdjustmentsDataResult,
      });

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* FINANCIAL BALANCE COMPARATIVE METRICS
  async getFinancialBalanceComparativeMetrics(
    metricsPaginationDto: ReportPaginationDto,
  ) {
    const { year, startMonth, endMonth, churchId, types } =
      metricsPaginationDto;

    try {
      const church = await this.churchRepository.findOne({
        where: { id: churchId },
      });

      if (!church) {
        throw new NotFoundException(
          `No se encontró ninguna iglesia con este ID: ${churchId}.`,
        );
      }

      const metricsTypesArray = types.split('+');
      const termRange = `${churchId}&${startMonth}&${endMonth}&${year}`;

      //* Income vs Expenses (PEN, USD, EUR)
      let yearlyIncomeExpenseComparativePenDataResult: YearlyIncomeExpenseComparativeDataResult[];
      let yearlyIncomeExpenseComparativeUsdDataResult: YearlyIncomeExpenseComparativeDataResult[];
      let yearlyIncomeExpenseComparativeEurDataResult: YearlyIncomeExpenseComparativeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.IncomeAndExpensesComparativeByYear,
        )
      ) {
        [
          yearlyIncomeExpenseComparativePenDataResult,
          yearlyIncomeExpenseComparativeUsdDataResult,
          yearlyIncomeExpenseComparativeEurDataResult,
        ] = await Promise.all([
          this.metricsService.findByTerm(
            `${churchId}&${CurrencyType.PEN}&${year}`,
            { searchType: MetricSearchType.IncomeAndExpensesComparativeByYear },
          ),
          this.metricsService.findByTerm(
            `${churchId}&${CurrencyType.USD}&${year}`,
            { searchType: MetricSearchType.IncomeAndExpensesComparativeByYear },
          ),
          this.metricsService.findByTerm(
            `${churchId}&${CurrencyType.EUR}&${year}`,
            { searchType: MetricSearchType.IncomeAndExpensesComparativeByYear },
          ),
        ]);
      }

      //* General Income Comparative
      let generalOfferingIncomeComparativeDataResult: GeneralOfferingIncomeComparativeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.GeneralComparativeOfferingIncome,
        )
      ) {
        generalOfferingIncomeComparativeDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.GeneralComparativeOfferingIncome,
            order: RecordOrder.Ascending,
          });
      }

      //* Income Comparative By Type
      let offeringIncomeComparativeByFamilyGroupDataResult: OfferingIncomeComparativeByTypeDataResult[];
      let offeringIncomeComparativeBySundayServiceDataResult: OfferingIncomeComparativeByTypeDataResult[];
      let offeringIncomeComparativeBySundaySchoolDataResult: OfferingIncomeComparativeByTypeDataResult[];
      let offeringIncomeComparativeByGeneralFastingDataResult: OfferingIncomeComparativeByTypeDataResult[];
      let offeringIncomeComparativeByGeneralVigilDataResult: OfferingIncomeComparativeByTypeDataResult[];
      let offeringIncomeComparativeByZonalVigilDataResult: OfferingIncomeComparativeByTypeDataResult[];
      let offeringIncomeComparativeByZonalFastingDataResult: OfferingIncomeComparativeByTypeDataResult[];
      let offeringIncomeComparativeByYouthServiceDataResult: OfferingIncomeComparativeByTypeDataResult[];
      let offeringIncomeComparativeByUnitedServiceDataResult: OfferingIncomeComparativeByTypeDataResult[];
      let offeringIncomeComparativeBySpecialOfferingDataResult: OfferingIncomeComparativeByTypeDataResult[];
      let offeringIncomeComparativeByActivitiesDataResult: OfferingIncomeComparativeByTypeDataResult[];
      let offeringIncomeComparativeByChurchGroundDataResult: OfferingIncomeComparativeByTypeDataResult[];
      let offeringIncomeComparativeByIncomeAdjustmentDataResult: OfferingIncomeComparativeByTypeDataResult[];

      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingIncomeByType,
        )
      ) {
        const incomeSubTypes = [
          OfferingIncomeCreationSubType.FamilyGroup,
          OfferingIncomeCreationSubType.SundayService,
          OfferingIncomeCreationSubType.SundaySchool,
          OfferingIncomeCreationSubType.GeneralFasting,
          OfferingIncomeCreationSubType.GeneralVigil,
          OfferingIncomeCreationSubType.ZonalVigil,
          OfferingIncomeCreationSubType.ZonalFasting,
          OfferingIncomeCreationSubType.YouthService,
          OfferingIncomeCreationSubType.UnitedService,
          OfferingIncomeCreationSubType.Special,
          OfferingIncomeCreationSubType.Activities,
          OfferingIncomeCreationSubType.ChurchGround,
        ];

        const [fg, ss, ssch, gf, gv, zv, zf, ys, us, sp, act, cg, adj] =
          await Promise.all([
            ...incomeSubTypes.map((subType) =>
              this.metricsService.findByTerm(`${churchId}&${subType}&${year}`, {
                searchType: MetricSearchType.ComparativeOfferingIncomeByType,
                order: RecordOrder.Descending,
              }),
            ),
            this.metricsService.findByTerm(
              `${churchId}&${OfferingIncomeCreationType.IncomeAdjustment}&${year}`,
              {
                searchType: MetricSearchType.ComparativeOfferingIncomeByType,
                order: RecordOrder.Descending,
              },
            ),
          ]);

        [
          offeringIncomeComparativeByFamilyGroupDataResult,
          offeringIncomeComparativeBySundayServiceDataResult,
          offeringIncomeComparativeBySundaySchoolDataResult,
          offeringIncomeComparativeByGeneralFastingDataResult,
          offeringIncomeComparativeByGeneralVigilDataResult,
          offeringIncomeComparativeByZonalVigilDataResult,
          offeringIncomeComparativeByZonalFastingDataResult,
          offeringIncomeComparativeByYouthServiceDataResult,
          offeringIncomeComparativeByUnitedServiceDataResult,
          offeringIncomeComparativeBySpecialOfferingDataResult,
          offeringIncomeComparativeByActivitiesDataResult,
          offeringIncomeComparativeByChurchGroundDataResult,
          offeringIncomeComparativeByIncomeAdjustmentDataResult,
        ] = [fg, ss, ssch, gf, gv, zv, zf, ys, us, sp, act, cg, adj];
      }

      //* General Expense Comparative
      let generalOfferingExpensesComparativeDataResult: GeneralOfferingExpensesComparativeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.GeneralComparativeOfferingExpenses,
        )
      ) {
        generalOfferingExpensesComparativeDataResult =
          await this.metricsService.findByTerm(termRange, {
            searchType: MetricSearchType.GeneralComparativeOfferingExpenses,
            order: RecordOrder.Ascending,
          });
      }

      //* Expenses Comparative By Type
      let offeringOperationalExpensesComparativeDataResult: OfferingExpenseComparativeByTypeDataResult[];
      let offeringExpensesComparativeByMaintenanceAndRepairDataResult: OfferingExpenseComparativeByTypeDataResult[];
      let offeringExpensesComparativeByDecorationDataResult: OfferingExpenseComparativeByTypeDataResult[];
      let offeringExpensesComparativeByEquipmentAndTechnologyDataResult: OfferingExpenseComparativeByTypeDataResult[];
      let offeringExpensesComparativeBySuppliesDataResult: OfferingExpenseComparativeByTypeDataResult[];
      let offeringExpensesComparativeByPlaningEventsDataResult: OfferingExpenseComparativeByTypeDataResult[];
      let offeringExpensesComparativeByOtherExpensesDataResult: OfferingExpenseComparativeByTypeDataResult[];
      let offeringExpensesComparativeByExpenseAdjustmentDataResult: OfferingExpenseComparativeByTypeDataResult[];

      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesByType,
        )
      ) {
        const expenseTypes = [
          OfferingExpenseSearchType.OperationalExpenses,
          OfferingExpenseSearchType.MaintenanceAndRepairExpenses,
          OfferingExpenseSearchType.DecorationExpenses,
          OfferingExpenseSearchType.EquipmentAndTechnologyExpenses,
          OfferingExpenseSearchType.SuppliesExpenses,
          OfferingExpenseSearchType.PlaningEventsExpenses,
          OfferingExpenseSearchType.OtherExpenses,
          OfferingExpenseSearchType.ExpensesAdjustment,
        ];

        const results = await Promise.all(
          expenseTypes.map((expType) =>
            this.metricsService.findByTerm(`${churchId}&${expType}&${year}`, {
              searchType: MetricSearchType.ComparativeOfferingExpensesByType,
              order: RecordOrder.Descending,
            }),
          ),
        );

        [
          offeringOperationalExpensesComparativeDataResult,
          offeringExpensesComparativeByMaintenanceAndRepairDataResult,
          offeringExpensesComparativeByDecorationDataResult,
          offeringExpensesComparativeByEquipmentAndTechnologyDataResult,
          offeringExpensesComparativeBySuppliesDataResult,
          offeringExpensesComparativeByPlaningEventsDataResult,
          offeringExpensesComparativeByOtherExpensesDataResult,
          offeringExpensesComparativeByExpenseAdjustmentDataResult,
        ] = results;
      }

      //* Expenses Comparative By Sub-Type
      let offeringOperationalExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
      let offeringMaintenanceAndRepairExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
      let offeringDecorationExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
      let offeringEquipmentAndTechnologyExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
      let offeringSuppliesExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
      let offeringPlaningEventsExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
      let offeringOtherExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];

      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesBySubType,
        )
      ) {
        const subTypeExpenseTypes = [
          OfferingExpenseSearchType.OperationalExpenses,
          OfferingExpenseSearchType.MaintenanceAndRepairExpenses,
          OfferingExpenseSearchType.DecorationExpenses,
          OfferingExpenseSearchType.EquipmentAndTechnologyExpenses,
          OfferingExpenseSearchType.SuppliesExpenses,
          OfferingExpenseSearchType.PlaningEventsExpenses,
          OfferingExpenseSearchType.OtherExpenses,
        ];

        const subTypeResults = await Promise.all(
          subTypeExpenseTypes.map((expType) =>
            this.metricsService.findByTerm(
              `${churchId}&${expType}&${startMonth}&${endMonth}&${year}`,
              {
                searchType:
                  MetricSearchType.ComparativeOfferingExpensesBySubType,
                order: RecordOrder.Descending,
              },
            ),
          ),
        );

        [
          offeringOperationalExpensesBySubTypeComparativeDataResult,
          offeringMaintenanceAndRepairExpensesBySubTypeComparativeDataResult,
          offeringDecorationExpensesBySubTypeComparativeDataResult,
          offeringEquipmentAndTechnologyExpensesBySubTypeComparativeDataResult,
          offeringSuppliesExpensesBySubTypeComparativeDataResult,
          offeringPlaningEventsExpensesBySubTypeComparativeDataResult,
          offeringOtherExpensesBySubTypeComparativeDataResult,
        ] = subTypeResults;
      }

      const docDefinition = getFinancialBalanceComparativeMetricsReport({
        title: 'Reporte de Métricas Comparativas Balance Financiero',
        subTitle:
          'Resultados de Búsqueda de Métricas Comparativas Balance Financiero',
        metricsTypesArray,
        year,
        church,
        startMonth,
        endMonth,
        yearlyIncomeExpenseComparativePenDataResult,
        yearlyIncomeExpenseComparativeUsdDataResult,
        yearlyIncomeExpenseComparativeEurDataResult,
        generalOfferingIncomeComparativeDataResult,
        offeringIncomeComparativeByFamilyGroupDataResult,
        offeringIncomeComparativeBySundayServiceDataResult,
        offeringIncomeComparativeBySundaySchoolDataResult,
        offeringIncomeComparativeByGeneralFastingDataResult,
        offeringIncomeComparativeByGeneralVigilDataResult,
        offeringIncomeComparativeByZonalVigilDataResult,
        offeringIncomeComparativeByZonalFastingDataResult,
        offeringIncomeComparativeByYouthServiceDataResult,
        offeringIncomeComparativeByUnitedServiceDataResult,
        offeringIncomeComparativeBySpecialOfferingDataResult,
        offeringIncomeComparativeByActivitiesDataResult,
        offeringIncomeComparativeByChurchGroundDataResult,
        offeringIncomeComparativeByIncomeAdjustmentDataResult,
        generalOfferingExpensesComparativeDataResult,
        offeringOperationalExpensesComparativeDataResult,
        offeringExpensesComparativeByMaintenanceAndRepairDataResult,
        offeringExpensesComparativeByDecorationDataResult,
        offeringExpensesComparativeByEquipmentAndTechnologyDataResult,
        offeringExpensesComparativeBySuppliesDataResult,
        offeringExpensesComparativeByPlaningEventsDataResult,
        offeringExpensesComparativeByOtherExpensesDataResult,
        offeringExpensesComparativeByExpenseAdjustmentDataResult,
        offeringOperationalExpensesBySubTypeComparativeDataResult,
        offeringMaintenanceAndRepairExpensesBySubTypeComparativeDataResult,
        offeringDecorationExpensesBySubTypeComparativeDataResult,
        offeringSuppliesExpensesBySubTypeComparativeDataResult,
        offeringPlaningEventsExpensesBySubTypeComparativeDataResult,
        offeringOtherExpensesBySubTypeComparativeDataResult,
        offeringEquipmentAndTechnologyExpensesBySubTypeComparativeDataResult,
      });

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* PRIVATE METHODS
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
