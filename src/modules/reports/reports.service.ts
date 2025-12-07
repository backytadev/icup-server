import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { format } from 'date-fns';

import { UserRoleNames } from '@/common/enums/user-role.enum';

import {
  RecordOrder,
  RecordOrderNames,
} from '@/common/enums/record-order.enum';
import {
  SearchSubType,
  SearchSubTypeNames,
} from '@/common/enums/search-sub-type.enum';
import { GenderNames } from '@/common/enums/gender.enum';
import { RecordStatusNames } from '@/common/enums/record-status.enum';
import { MaritalStatusNames } from '@/common/enums/marital-status.enum';
import { SearchType, SearchTypeNames } from '@/common/enums/search-types.enum';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { ReportPaginationDto } from '@/common/dtos/report-pagination.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { UserSearchType } from '@/modules/user/enums/user-search-type.enum';
import { UserSearchAndPaginationDto } from '@/modules/user/dto/user-search-and-pagination.dto';

import { ChurchSearchType } from '@/modules/church/enums/church-search-type.enum';
import { ChurchSearchAndPaginationDto } from '@/modules/church/dto/church-search-and-pagination.dto';

import {
  MemberType,
  MemberTypeNames,
} from '@/modules/offering/income/enums/member-type.enum';
import { OfferingIncomeCreationType } from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import { OfferingIncomeCreationSubType } from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';
import { OfferingIncomeCreationShiftTypeNames } from '@/modules/offering/income/enums/offering-income-creation-shift-type.enum';

import { CurrencyType } from '@/modules/offering/shared/enums/currency-type.enum';

import { ZoneService } from '@/modules/zone/zone.service';

import { MetricsService } from '@/modules/metrics/metrics.service';
import { MetricSearchType } from '@/modules/metrics/enums/metrics-search-type.enum';

import { OfferingExpenseSearchType } from '@/modules/offering/expense/enums/offering-expense-search-type.enum';

import { PrinterService } from '@/modules/printer/printer.service';
import { DateFormatter } from '@/modules/reports/helpers/date-formatter';

import { getUsersReport } from '@/modules/reports/reports-types/user/user.report';
import { getZonesReport } from '@/modules/reports/reports-types/zone/zones.report';
import { getChurchesReport } from '@/modules/reports/reports-types/church/churches.report';
import { getMembersReport } from '@/modules/reports/reports-types/membership/members.report';
import { getMinistriesReport } from '@/modules/reports/reports-types/ministry/ministry.report';
import { getFamilyGroupsReport } from '@/modules/reports/reports-types/family-group/family-groups.report';
import { getOfferingIncomeReport } from '@/modules/reports/reports-types/offering/offering-income.report';
import { getOfferingExpensesReport } from '@/modules/reports/reports-types/offering/offering-expenses.report';
import { getStudyCertificateByIdReport } from '@/modules/reports/reports-types/others/study-certificate-by-id.report';

import { getMemberMetricsReport } from '@/modules/reports/reports-types/metrics/member-metrics.report';
import { getFamilyGroupMetricsReport } from '@/modules/reports/reports-types/metrics/family-group-metrics.report';
import { getOfferingIncomeMetricsReport } from '@/modules/reports/reports-types/metrics/offering-income-metrics.report';
import { getOfferingExpensesMetricsReport } from '@/modules/reports/reports-types/metrics/offering-expenses-metrics.report';
import { generateReceiptByOfferingIncomeId } from '@/modules/reports/reports-types/receipts/generate-receipt-by-offering-income-id';
import { getFinancialBalanceComparativeMetricsReport } from '@/modules/reports/reports-types/metrics/financial-balance-comparative-metrics.report';

import { UserService } from '@/modules/user/user.service';
import { PastorService } from '@/modules/pastor/pastor.service';
import { ChurchService } from '@/modules/church/church.service';
import { DiscipleService } from '@/modules/disciple/disciple.service';
import { CopastorService } from '@/modules/copastor/copastor.service';
import { PreacherService } from '@/modules/preacher/preacher.service';
import { MinistryService } from '@/modules/ministry/ministry.service';
import { SupervisorService } from '@/modules/supervisor/supervisor.service';
import { FamilyGroupService } from '@/modules/family-group/family-group.service';
import { OfferingIncomeService } from '@/modules/offering/income/offering-income.service';
import { OfferingExpenseService } from '@/modules/offering/expense/offering-expense.service';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Member } from '@/modules/member/entities/member.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';

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

@Injectable()
export class ReportsService {
  private readonly logger = new Logger('ReportsService');

  constructor(
    private readonly printerService: PrinterService,

    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,

    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,

    private readonly churchService: ChurchService,
    private readonly ministryService: MinistryService,
    private readonly pastorService: PastorService,
    private readonly copastorService: CopastorService,
    private readonly supervisorService: SupervisorService,
    private readonly preacherService: PreacherService,
    private readonly discipleService: DiscipleService,

    private readonly zoneService: ZoneService,
    private readonly familyGroupService: FamilyGroupService,

    @Inject(forwardRef(() => OfferingIncomeService))
    private readonly offeringIncomeService: OfferingIncomeService,

    private readonly offeringExpenseService: OfferingExpenseService,

    private readonly userService: UserService,

    private readonly metricsService: MetricsService,
  ) {}

  //* STUDENT CERTIFICATE
  async getStudyCertificateById(studentId: string) {
    try {
      const student = await this.memberRepository.findOne({
        where: {
          id: studentId,
        },
      });

      if (!student) {
        throw new NotFoundException(
          `Estudiante con id: ${studentId}, no fue encontrado.`,
        );
      }

      const docDefinition = getStudyCertificateByIdReport({
        studentName: `${student.firstNames} ${student.lastNames}`,
        directorName: 'Marcos Alberto Reyes Quispe',
        studyStartDate: DateFormatter.getDDMMYYYY(new Date('2024-03-07')),
        studyEndDate: DateFormatter.getDDMMYYYY(new Date('2024-10-07')),
        classSchedule: '17:00 a 19:00',
        hoursNumber: 10,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* GENERATE RECEIPT
  async generateReceiptByOfferingIncomeId(
    recordId: string,
    queryParams: { generationType: string },
  ) {
    try {
      const offeringIncome = await this.offeringIncomeRepository.findOne({
        where: {
          id: recordId,
        },
        relations: [
          'church',
          'pastor.member',
          'copastor.member',
          'supervisor.member',
          'preacher.member',
          'disciple.member',
          'familyGroup.theirPreacher.member',
          'familyGroup.theirSupervisor.member',
          'familyGroup.theirCopastor.member',
          'familyGroup.theirPastor.member',
          'zone.theirSupervisor.member',
          'zone.theirCopastor.member',
          'zone.theirPastor.member',
          'externalDonor',
        ],
      });

      if (!offeringIncome) {
        throw new NotFoundException(
          `El registro con id: ${recordId}, no fue encontrado.`,
        );
      }

      const docDefinition = generateReceiptByOfferingIncomeId({
        churchName: offeringIncome?.church?.churchName,
        abbreviatedChurchName: offeringIncome?.church?.abbreviatedChurchName,
        churchAddress: offeringIncome?.church?.address,
        churchPhoneNumber: offeringIncome?.church?.phoneNumber,
        churchEmail: offeringIncome?.church?.email,
        type: offeringIncome?.type,
        subType: offeringIncome?.subType,
        amount: offeringIncome?.amount,
        currency: offeringIncome?.currency,
        category: offeringIncome?.category,
        comments: offeringIncome?.comments,
        shift: offeringIncome?.shift,
        date: offeringIncome?.date,
        memberType: offeringIncome?.memberType,
        memberFullName:
          offeringIncome?.memberType === MemberType.Pastor
            ? `${offeringIncome?.pastor?.member?.firstNames} ${offeringIncome?.pastor?.member?.lastNames}`
            : offeringIncome?.memberType === MemberType.Copastor
              ? `${offeringIncome?.copastor?.member?.firstNames} ${offeringIncome?.copastor?.member?.lastNames}`
              : offeringIncome?.memberType === MemberType.Supervisor
                ? `${offeringIncome?.supervisor?.member?.firstNames} ${offeringIncome?.supervisor?.member?.lastNames}`
                : offeringIncome?.memberType === MemberType.Preacher
                  ? `${offeringIncome?.preacher?.member?.firstNames} ${offeringIncome?.preacher?.member?.lastNames}`
                  : `${offeringIncome?.disciple?.member?.firstNames} ${offeringIncome?.disciple?.member?.lastNames}`,
        externalDonorFullName: `${offeringIncome?.externalDonor?.firstNames} ${offeringIncome?.externalDonor?.lastNames}`,
        familyGroupName: offeringIncome?.familyGroup?.familyGroupName,
        familyGroupCode: offeringIncome?.familyGroup?.familyGroupCode,
        zoneName: offeringIncome?.zone?.zoneName,
        zoneDistrict: offeringIncome?.zone?.district,
        preacherFullName:
          offeringIncome.subType === OfferingIncomeCreationSubType.FamilyGroup
            ? `${offeringIncome?.familyGroup?.theirPreacher?.member?.firstNames} ${offeringIncome?.familyGroup?.theirPreacher?.member?.lastNames}`
            : '',
        supervisorFullName:
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.ZonalFasting ||
          offeringIncome.subType === OfferingIncomeCreationSubType.ZonalVigil ||
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.ZonalEvangelism
            ? `${offeringIncome?.zone?.theirSupervisor?.member?.firstNames} ${offeringIncome?.zone?.theirSupervisor?.member?.lastNames}`
            : offeringIncome.subType ===
                OfferingIncomeCreationSubType.FamilyGroup
              ? `${offeringIncome?.familyGroup?.theirSupervisor?.member?.firstNames} ${offeringIncome?.familyGroup?.theirSupervisor?.member?.lastNames}`
              : '',
        copastorFullName:
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.ZonalFasting ||
          offeringIncome.subType === OfferingIncomeCreationSubType.ZonalVigil ||
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.ZonalEvangelism ||
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.ZonalUnitedService
            ? `${offeringIncome?.zone?.theirCopastor?.member?.firstNames} ${offeringIncome?.zone?.theirCopastor?.member?.lastNames}`
            : offeringIncome.subType ===
                OfferingIncomeCreationSubType.FamilyGroup
              ? `${offeringIncome?.familyGroup?.theirCopastor?.member?.firstNames} ${offeringIncome?.familyGroup?.theirCopastor?.member?.lastNames}`
              : '',
        pastorFullName:
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.ZonalFasting ||
          offeringIncome.subType === OfferingIncomeCreationSubType.ZonalVigil ||
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.ZonalEvangelism
            ? `${offeringIncome?.zone?.theirPastor?.member?.firstNames} ${offeringIncome?.zone?.theirPastor?.member?.lastNames}`
            : offeringIncome.subType ===
                OfferingIncomeCreationSubType.FamilyGroup
              ? `${offeringIncome?.familyGroup?.theirPastor?.member?.firstNames} ${offeringIncome?.familyGroup?.theirPastor?.member?.lastNames}`
              : '',
        ticketImageUrl: offeringIncome?.imageUrls[0],
        receiptCode: offeringIncome?.receiptCode,
        createdAt: offeringIncome?.createdAt,
        createdBy: `${offeringIncome?.createdBy.firstNames} ${offeringIncome?.createdBy.lastNames}`,
        generationType: queryParams.generationType,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //? CHURCHES
  //* GENERAL CHURCHES REPORT
  async getGeneralChurches(paginationDto: PaginationDto) {
    const { order } = paginationDto;

    try {
      const churches: Church[] =
        await this.churchService.findAll(paginationDto);

      if (!churches) {
        throw new NotFoundException(
          `No se encontraron iglesias con estos términos de búsqueda.`,
        );
      }

      const docDefinition = getChurchesReport({
        title: 'Reporte de Iglesias',
        subTitle: 'Resultados de Búsqueda de Iglesias',
        description: 'iglesias',
        orderSearch: order,
        data: churches,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* CHURCHES REPORT BY TERM
  async getChurchesByFilters(
    searchTypeAndPaginationDto: ChurchSearchAndPaginationDto,
  ) {
    const { searchType, order, churchId, term } = searchTypeAndPaginationDto;

    try {
      const churches: Church[] = await this.churchService.findByFilters(
        searchTypeAndPaginationDto,
      );

      if (!churches) {
        throw new NotFoundException(
          `No se encontraron iglesias con estos términos de búsqueda.`,
        );
      }

      let newTerm: string;
      newTerm = term;

      //* By Founding Date
      if (searchType === ChurchSearchType.FoundingDate) {
        const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
        const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

        newTerm = `${formattedFromDate} - ${formattedToDate}`;
      }

      //* By Record Status
      if (searchType === ChurchSearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        const validRecordStatus = ['active', 'inactive'];

        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        newTerm = `${RecordStatusNames[recordStatusTerm]} `;
      }

      const docDefinition = getChurchesReport({
        title: 'Reporte de Iglesias',
        subTitle: 'Resultados de Búsqueda de Iglesias',
        description: 'iglesias',
        searchTerm: `${newTerm}`,
        searchType: `${SearchTypeNames[searchType]}`,
        searchSubType: 'S/N',
        orderSearch: RecordOrderNames[order],
        churchName: churchId
          ? churches[0]?.theirMainChurch?.abbreviatedChurchName
          : undefined,
        data: churches,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //? MINISTRIES
  //* GENERAL CHURCHES REPORT
  async getGeneralMinistries(paginationDto: PaginationDto) {
    const { order } = paginationDto;

    try {
      const ministries: Ministry[] =
        await this.ministryService.findAll(paginationDto);

      if (!ministries) {
        throw new NotFoundException(
          `No se encontraron ministerios con estos términos de búsqueda.`,
        );
      }

      const docDefinition = getMinistriesReport({
        title: 'Reporte de Ministerios',
        subTitle: 'Resultados de Búsqueda de Ministerios',
        description: 'ministerios',
        orderSearch: order,
        data: ministries,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* MINISTRIES REPORT BY TERM
  async getMinistriesByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { searchType, searchSubType, order, churchId } =
      searchTypeAndPaginationDto;

    try {
      const ministries: Ministry[] = await this.ministryService.findByTerm(
        term,
        searchTypeAndPaginationDto,
      );

      if (!ministries) {
        throw new NotFoundException(
          `No se encontraron ministerios con estos términos de búsqueda.`,
        );
      }

      let newTerm: string;
      newTerm = term;

      //* By Founding Date
      if (searchType === SearchType.FoundingDate) {
        const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
        const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

        newTerm = `${formattedFromDate} - ${formattedToDate}`;
      }

      //* By Record Status
      if (searchType === SearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        const validRecordStatus = ['active', 'inactive'];

        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        newTerm = `${RecordStatusNames[recordStatusTerm]} `;
      }

      const docDefinition = getMinistriesReport({
        title: 'Reporte de Ministerios',
        subTitle: 'Resultados de Búsqueda de Ministerios',
        description: 'ministerios',
        searchTerm: `${newTerm}`,
        searchType: `${SearchTypeNames[searchType]}`,
        searchSubType: SearchSubTypeNames[searchSubType] ?? 'S/N',
        orderSearch: RecordOrderNames[order],
        churchName: churchId
          ? ministries[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: ministries,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //? PASTORS
  //* GENERAL PASTORS REPORT
  async getGeneralPastors(paginationDto: PaginationDto) {
    const { order, churchId } = paginationDto;

    try {
      const pastors: Pastor[] = await this.pastorService.findAll(paginationDto);

      if (!pastors) {
        throw new NotFoundException(
          `No se encontraron pastores con estos términos de búsqueda.`,
        );
      }

      const docDefinition = getMembersReport({
        title: 'Reporte de Pastores',
        subTitle: 'Resultados de Búsqueda de Pastores',
        description: 'pastores',
        orderSearch: order,
        churchName: churchId
          ? pastors[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: pastors,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* PASTORS REPORT BY TERM
  async getPastorsByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { searchType, searchSubType, order, churchId } =
      searchTypeAndPaginationDto;

    try {
      const pastors: Pastor[] = await this.pastorService.findByTerm(
        term,
        searchTypeAndPaginationDto,
      );

      if (!pastors) {
        throw new NotFoundException(
          `No se encontraron pastores con estos términos de búsqueda.`,
        );
      }

      let newTerm: string;
      if (term.includes('-')) {
        const firstNames = term.split('-')[0].replace(/\+/g, ' ');
        const lastNames = term.split('-')[1].replace(/\+/g, ' ');
        newTerm = `${firstNames} ${lastNames}`;
      } else {
        newTerm = term.replace(/\+/g, ' ');
      }

      //* By Birth Date
      if (searchType === SearchType.BirthDate) {
        const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
        const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

        newTerm = `${formattedFromDate} - ${formattedToDate}`;
      }

      //* By Birth Month
      if (searchType === SearchType.BirthMonth) {
        const monthNames = {
          january: 'Enero',
          february: 'Febrero',
          march: 'Marzo',
          april: 'Abril',
          may: 'Mayo',
          june: 'Junio',
          july: 'Julio',
          august: 'Agosto',
          september: 'Septiembre',
          october: 'Octubre',
          november: 'Noviembre',
          december: 'Diciembre',
        };

        newTerm = monthNames[term.toLowerCase()] ?? term;
      }

      //* By Gender
      if (searchType === SearchType.Gender) {
        const genderTerm = term.toLowerCase();
        const validGenders = ['male', 'female'];

        if (!validGenders.includes(genderTerm)) {
          throw new BadRequestException(`Género no válido: ${term}`);
        }

        newTerm = `${GenderNames[genderTerm]}`;
      }

      //* By Marital Status
      if (searchType === SearchType.MaritalStatus) {
        const maritalStatusTerm = term.toLowerCase();
        const validMaritalStatus = [
          'single',
          'married',
          'widowed',
          'divorced',
          'other',
        ];

        if (!validMaritalStatus.includes(maritalStatusTerm)) {
          throw new BadRequestException(`Estado Civil no válido: ${term}`);
        }

        newTerm = `${MaritalStatusNames[maritalStatusTerm]}`;
      }

      //* By Record Status
      if (searchType === SearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        const validRecordStatus = ['active', 'inactive'];

        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        newTerm = `${RecordStatusNames[recordStatusTerm]} `;
      }

      const docDefinition = getMembersReport({
        title: 'Reporte de Pastores',
        subTitle: 'Resultados de Búsqueda de Pastores',
        description: 'pastores',
        searchTerm: newTerm,
        searchType: SearchTypeNames[searchType],
        searchSubType: SearchSubTypeNames[searchSubType] ?? 'S/N',
        orderSearch: RecordOrderNames[order],
        churchName: churchId
          ? pastors[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: pastors,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //? COPASTORS
  //* GENERAL COPASTORS REPORT
  async getGeneralCopastors(paginationDto: PaginationDto) {
    const { order, churchId } = paginationDto;

    try {
      const copastors: Copastor[] =
        await this.copastorService.findAll(paginationDto);

      if (!copastors) {
        throw new NotFoundException(
          `No se encontraron co-pastores con estos términos de búsqueda.`,
        );
      }

      const docDefinition = getMembersReport({
        title: 'Reporte de Co-Pastores',
        subTitle: 'Resultados de Búsqueda de Co-Pastores',
        description: 'co-pastores',
        orderSearch: order,
        churchName: churchId
          ? copastors[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: copastors,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* COPASTORS REPORT BY TERM
  async getCopastorsByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { searchType, searchSubType, order, churchId } =
      searchTypeAndPaginationDto;

    try {
      const copastors: Copastor[] = await this.copastorService.findByTerm(
        term,
        searchTypeAndPaginationDto,
      );

      if (!copastors) {
        throw new NotFoundException(
          `No se encontraron co-pastores con estos términos de búsqueda.`,
        );
      }

      let newTerm: string;
      if (term.includes('-')) {
        const firstNames = term.split('-')[0].replace(/\+/g, ' ');
        const lastNames = term.split('-')[1].replace(/\+/g, ' ');
        newTerm = `${firstNames} ${lastNames}`;
      } else {
        newTerm = term.replace(/\+/g, ' ');
      }

      //* By Birth Date
      if (searchType === SearchType.BirthDate) {
        const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
        const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

        newTerm = `${formattedFromDate} - ${formattedToDate}`;
      }

      //* By Birth Month
      if (searchType === SearchType.BirthMonth) {
        const monthNames = {
          january: 'Enero',
          february: 'Febrero',
          march: 'Marzo',
          april: 'Abril',
          may: 'Mayo',
          june: 'Junio',
          july: 'Julio',
          august: 'Agosto',
          september: 'Septiembre',
          october: 'Octubre',
          november: 'Noviembre',
          december: 'Diciembre',
        };

        newTerm = monthNames[term.toLowerCase()] ?? term;
      }

      //* By Gender
      if (searchType === SearchType.Gender) {
        const genderTerm = term.toLowerCase();
        const validGenders = ['male', 'female'];

        if (!validGenders.includes(genderTerm)) {
          throw new BadRequestException(`Género no válido: ${term}`);
        }

        newTerm = `${GenderNames[genderTerm]}`;
      }

      //* By Marital Status
      if (searchType === SearchType.MaritalStatus) {
        const maritalStatusTerm = term.toLowerCase();
        const validMaritalStatus = [
          'single',
          'married',
          'widowed',
          'divorced',
          'other',
        ];

        if (!validMaritalStatus.includes(maritalStatusTerm)) {
          throw new BadRequestException(`Estado Civil no válido: ${term}`);
        }

        newTerm = `${MaritalStatusNames[maritalStatusTerm]}`;
      }

      //* By Record Status
      if (searchType === SearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        const validRecordStatus = ['active', 'inactive'];

        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        newTerm = `${RecordStatusNames[recordStatusTerm]} `;
      }

      const docDefinition = getMembersReport({
        title: 'Reporte de Co-Pastores',
        subTitle: 'Resultados de Búsqueda de Co-Pastores',
        description: 'co-pastores',
        searchTerm: newTerm,
        searchType: SearchTypeNames[searchType],
        searchSubType: SearchSubTypeNames[searchSubType] ?? 'S/N',
        orderSearch: RecordOrderNames[order],
        churchName: churchId
          ? copastors[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: copastors,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //? SUPERVISORS
  //* GENERAL SUPERVISORS REPORT
  async getGeneralSupervisors(paginationDto: PaginationDto) {
    const { order, churchId } = paginationDto;

    try {
      const supervisors: Supervisor[] =
        await this.supervisorService.findAll(paginationDto);

      if (!supervisors) {
        throw new NotFoundException(
          `No se encontraron supervisores con estos términos de búsqueda.`,
        );
      }

      const docDefinition = getMembersReport({
        title: 'Reporte de Supervisores',
        subTitle: 'Resultados de Búsqueda de Supervisores',
        description: 'supervisores',
        orderSearch: order,
        churchName: churchId
          ? supervisors[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: supervisors,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* SUPERVISORS REPORT BY TERM
  async getSupervisorsByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { searchType, searchSubType, order, churchId } =
      searchTypeAndPaginationDto;

    try {
      const supervisors: Supervisor[] = await this.supervisorService.findByTerm(
        term,
        searchTypeAndPaginationDto,
      );

      if (!supervisors) {
        throw new NotFoundException(
          `No se encontraron supervisores con estos términos de búsqueda.`,
        );
      }

      let newTerm: string;
      if (term.includes('-')) {
        const firstNames = term.split('-')[0].replace(/\+/g, ' ');
        const lastNames = term.split('-')[1].replace(/\+/g, ' ');
        newTerm = `${firstNames} ${lastNames}`;
      } else {
        newTerm = term.replace(/\+/g, ' ');
      }

      //* By birth Date
      if (searchType === SearchType.BirthDate) {
        const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
        const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

        newTerm = `${formattedFromDate} - ${formattedToDate}`;
      }

      //* By Birth Month
      if (searchType === SearchType.BirthMonth) {
        const monthNames = {
          january: 'Enero',
          february: 'Febrero',
          march: 'Marzo',
          april: 'Abril',
          may: 'Mayo',
          june: 'Junio',
          july: 'Julio',
          august: 'Agosto',
          september: 'Septiembre',
          october: 'Octubre',
          november: 'Noviembre',
          december: 'Diciembre',
        };

        newTerm = monthNames[term.toLowerCase()] ?? term;
      }

      //* By Gender
      if (searchType === SearchType.Gender) {
        const genderTerm = term.toLowerCase();
        const validGenders = ['male', 'female'];

        if (!validGenders.includes(genderTerm)) {
          throw new BadRequestException(`Género no válido: ${term}`);
        }

        newTerm = `${GenderNames[genderTerm]}`;
      }

      //* By Marital Status
      if (searchType === SearchType.MaritalStatus) {
        const maritalStatusTerm = term.toLowerCase();
        const validMaritalStatus = [
          'single',
          'married',
          'widowed',
          'divorced',
          'other',
        ];

        if (!validMaritalStatus.includes(maritalStatusTerm)) {
          throw new BadRequestException(`Estado Civil no válido: ${term}`);
        }

        newTerm = `${MaritalStatusNames[maritalStatusTerm]}`;
      }

      //* By Record Status
      if (searchType === SearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        const validRecordStatus = ['active', 'inactive'];

        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        newTerm = `${RecordStatusNames[recordStatusTerm]} `;
      }

      const docDefinition = getMembersReport({
        title: 'Reporte de Supervisores',
        subTitle: 'Resultados de Búsqueda de Supervisores',
        description: 'supervisores',
        searchTerm: newTerm,
        searchType: SearchTypeNames[searchType],
        searchSubType: SearchSubTypeNames[searchSubType] ?? 'S/N',
        orderSearch: RecordOrderNames[order],
        churchName: churchId
          ? supervisors[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: supervisors,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //? PREACHERS
  //* GENERAL PREACHERS REPORT
  async getGeneralPreachers(paginationDto: PaginationDto) {
    const { order, churchId } = paginationDto;

    try {
      const preachers: Preacher[] =
        await this.preacherService.findAll(paginationDto);

      if (!preachers) {
        throw new NotFoundException(
          `No se encontraron predicadores con estos términos de búsqueda.`,
        );
      }

      const docDefinition = getMembersReport({
        title: 'Reporte de Predicadores',
        subTitle: 'Resultados de Búsqueda de Predicadores',
        description: 'predicadores',
        orderSearch: order,
        churchName: churchId
          ? preachers[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: preachers,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* PREACHERS REPORT BY TERM
  async getPreachersByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { searchType, searchSubType, order, churchId } =
      searchTypeAndPaginationDto;

    try {
      const preachers: Preacher[] = await this.preacherService.findByTerm(
        term,
        searchTypeAndPaginationDto,
      );

      if (!preachers) {
        throw new NotFoundException(
          `No se encontraron predicadores con estos términos de búsqueda.`,
        );
      }

      let newTerm: string;
      if (term.includes('-')) {
        const firstNames = term.split('-')[0].replace(/\+/g, ' ');
        const lastNames = term.split('-')[1].replace(/\+/g, ' ');
        newTerm = `${firstNames} ${lastNames}`;
      } else {
        newTerm = term.replace(/\+/g, ' ');
      }

      //* By Birth Date
      if (searchType === SearchType.BirthDate) {
        const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
        const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

        newTerm = `${formattedFromDate} - ${formattedToDate}`;
      }

      //* By Birth Month
      if (searchType === SearchType.BirthMonth) {
        const monthNames = {
          january: 'Enero',
          february: 'Febrero',
          march: 'Marzo',
          april: 'Abril',
          may: 'Mayo',
          june: 'Junio',
          july: 'Julio',
          august: 'Agosto',
          september: 'Septiembre',
          october: 'Octubre',
          november: 'Noviembre',
          december: 'Diciembre',
        };

        newTerm = monthNames[term.toLowerCase()] ?? term;
      }

      //* By Gender
      if (searchType === SearchType.Gender) {
        const genderTerm = term.toLowerCase();
        const validGenders = ['male', 'female'];

        if (!validGenders.includes(genderTerm)) {
          throw new BadRequestException(`Género no válido: ${term}`);
        }

        newTerm = `${GenderNames[genderTerm]}`;
      }

      //* By Marital Status
      if (searchType === SearchType.MaritalStatus) {
        const maritalStatusTerm = term.toLowerCase();
        const validMaritalStatus = [
          'single',
          'married',
          'widowed',
          'divorced',
          'other',
        ];

        if (!validMaritalStatus.includes(maritalStatusTerm)) {
          throw new BadRequestException(`Estado Civil no válido: ${term}`);
        }

        newTerm = `${MaritalStatusNames[maritalStatusTerm]}`;
      }

      //* By Record Status
      if (searchType === SearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        const validRecordStatus = ['active', 'inactive'];

        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        newTerm = `${RecordStatusNames[recordStatusTerm]} `;
      }

      const docDefinition = getMembersReport({
        title: 'Reporte de Predicadores',
        subTitle: 'Resultados de Búsqueda de Predicadores',
        description: 'predicadores',
        searchTerm: newTerm,
        searchType: SearchTypeNames[searchType],
        searchSubType: SearchSubTypeNames[searchSubType] ?? 'S/N',
        orderSearch: RecordOrderNames[order],
        churchName: churchId
          ? preachers[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: preachers,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //? DISCIPLES
  //* GENERAL DISCIPLES REPORT
  async getGeneralDisciples(paginationDto: PaginationDto) {
    const { order, churchId } = paginationDto;

    try {
      const disciples: Disciple[] =
        await this.discipleService.findAll(paginationDto);

      if (!disciples) {
        throw new NotFoundException(
          `No se encontraron discípulos con estos términos de búsqueda.`,
        );
      }

      const docDefinition = getMembersReport({
        title: 'Reporte de Discípulos',
        subTitle: 'Resultados de Búsqueda de Discípulos',
        description: 'discípulos',
        orderSearch: order,
        churchName: churchId
          ? disciples[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: disciples,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* DISCIPLES REPORT BY TERM
  async getDisciplesByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { searchType, searchSubType, order, churchId } =
      searchTypeAndPaginationDto;

    try {
      const disciples: Disciple[] = await this.discipleService.findByTerm(
        term,
        searchTypeAndPaginationDto,
      );

      if (!disciples) {
        throw new NotFoundException(
          `No se encontraron discípulos con estos términos de búsqueda.`,
        );
      }

      let newTerm: string;
      if (term.includes('-')) {
        const firstNames = term.split('-')[0].replace(/\+/g, ' ');
        const lastNames = term.split('-')[1].replace(/\+/g, ' ');
        newTerm = `${firstNames} ${lastNames}`;
      } else {
        newTerm = term.replace(/\+/g, ' ');
      }

      //* By Birth Date
      if (searchType === SearchType.BirthDate) {
        const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
        const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

        newTerm = `${formattedFromDate} - ${formattedToDate}`;
      }

      //* By Birth Month
      if (searchType === SearchType.BirthMonth) {
        const monthNames = {
          january: 'Enero',
          february: 'Febrero',
          march: 'Marzo',
          april: 'Abril',
          may: 'Mayo',
          june: 'Junio',
          july: 'Julio',
          august: 'Agosto',
          september: 'Septiembre',
          october: 'Octubre',
          november: 'Noviembre',
          december: 'Diciembre',
        };

        newTerm = monthNames[term.toLowerCase()] ?? term;
      }

      //* By Gender
      if (searchType === SearchType.Gender) {
        const genderTerm = term.toLowerCase();
        const validGenders = ['male', 'female'];

        if (!validGenders.includes(genderTerm)) {
          throw new BadRequestException(`Género no válido: ${term}`);
        }

        newTerm = `${GenderNames[genderTerm]}`;
      }

      //* By Marital Status
      if (searchType === SearchType.MaritalStatus) {
        const maritalStatusTerm = term.toLowerCase();
        const validMaritalStatus = [
          'single',
          'married',
          'widowed',
          'divorced',
          'other',
        ];

        if (!validMaritalStatus.includes(maritalStatusTerm)) {
          throw new BadRequestException(`Estado Civil no válido: ${term}`);
        }

        newTerm = `${MaritalStatusNames[maritalStatusTerm]}`;
      }

      //* By Record Status
      if (searchType === SearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        const validRecordStatus = ['active', 'inactive'];

        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        newTerm = `${RecordStatusNames[recordStatusTerm]} `;
      }

      const docDefinition = getMembersReport({
        title: 'Reporte de Discípulos',
        subTitle: 'Resultados de Búsqueda de Discípulos',
        description: 'discípulos',
        searchTerm: newTerm,
        searchType: SearchTypeNames[searchType],
        searchSubType: SearchSubTypeNames[searchSubType] ?? 'S/N',
        orderSearch: RecordOrderNames[order],
        churchName: churchId
          ? disciples[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: disciples,
        isDiscipleModule: true,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //? ZONES
  //* GENERAL ZONES REPORT
  async getGeneralZones(paginationDto: PaginationDto) {
    const { order, churchId } = paginationDto;

    try {
      const zones: Zone[] = await this.zoneService.findAll(paginationDto);

      if (!zones) {
        throw new NotFoundException(
          `No se encontraron zonas con estos términos de búsqueda.`,
        );
      }

      const docDefinition = getZonesReport({
        title: 'Reporte de Zonas',
        subTitle: 'Resultados de Búsqueda de Zonas',
        description: 'zonas',
        orderSearch: order,
        churchName: churchId
          ? zones[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: zones,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* ZONES REPORT BY TERM
  async getZonesByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { searchType, searchSubType, order, churchId } =
      searchTypeAndPaginationDto;

    try {
      const zones: Zone[] = await this.zoneService.findByTerm(
        term,
        searchTypeAndPaginationDto,
      );

      if (!zones) {
        throw new NotFoundException(
          `No se encontraron zonas con estos términos de búsqueda.`,
        );
      }

      let newTerm: string;
      if (term.includes('-')) {
        const firstNames = term.split('-')[0].replace(/\+/g, ' ');
        const lastNames = term.split('-')[1].replace(/\+/g, ' ');
        newTerm = `${firstNames} ${lastNames}`;
      } else {
        newTerm = term.replace(/\+/g, ' ');
      }

      //* By Record Status
      if (searchType === SearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        const validRecordStatus = ['active', 'inactive'];

        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        newTerm = `${RecordStatusNames[recordStatusTerm]} `;
      }

      const docDefinition = getZonesReport({
        title: 'Reporte de Zonas',
        subTitle: 'Resultados de Búsqueda de Zonas',
        description: 'zonas',
        searchTerm: newTerm,
        searchType: SearchTypeNames[searchType],
        searchSubType: SearchSubTypeNames[searchSubType] ?? 'S/N',
        orderSearch: RecordOrderNames[order],
        churchName: churchId
          ? zones[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: zones,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //? FAMILY GROUPS
  //* GENERAL FAMILY GROUPS REPORT
  async getGeneralFamilyGroups(paginationDto: PaginationDto) {
    const { order, churchId } = paginationDto;

    try {
      const familyGroups: FamilyGroup[] =
        await this.familyGroupService.findAll(paginationDto);

      if (!familyGroups) {
        throw new NotFoundException(
          `No se encontraron grupos familiares con estos términos de búsqueda.`,
        );
      }

      const docDefinition = getFamilyGroupsReport({
        title: 'Reporte de Grupos Familiares',
        subTitle: 'Resultados de Búsqueda de Grupos Familiares',
        description: 'grupos familiares',
        churchName: churchId
          ? familyGroups[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        orderSearch: order,
        data: familyGroups,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* FAMILY GROUPS REPORT BY TERM
  async getFamilyGroupsByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { searchType, searchSubType, order, churchId } =
      searchTypeAndPaginationDto;

    try {
      const familyGroups: FamilyGroup[] =
        await this.familyGroupService.findByTerm(
          term,
          searchTypeAndPaginationDto,
        );

      if (!familyGroups) {
        throw new NotFoundException(
          `No se encontraron grupos familiares con estos términos de búsqueda.`,
        );
      }

      let newTerm: string;
      if (term.includes('-')) {
        const firstNames = term.split('-')[0].replace(/\+/g, ' ');
        const lastNames = term.split('-')[1].replace(/\+/g, ' ');
        newTerm = `${firstNames} ${lastNames}`;
      } else {
        newTerm = term.replace(/\+/g, ' ');
      }

      //* By Record Status
      if (searchType === SearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        const validRecordStatus = ['active', 'inactive'];

        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        newTerm = `${RecordStatusNames[recordStatusTerm]} `;
      }

      const docDefinition = getFamilyGroupsReport({
        title: 'Reporte de Grupos Familiares',
        subTitle: 'Resultados de Búsqueda de Grupos Familiares',
        description: 'grupos familiares',
        searchTerm: newTerm,
        searchType: SearchTypeNames[searchType],
        searchSubType: SearchSubTypeNames[searchSubType] ?? 'S/N',
        orderSearch: RecordOrderNames[order],
        churchName: churchId
          ? familyGroups[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: familyGroups,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //? OFFERING INCOME
  //* GENERAL OFFERING INCOME REPORT
  async getGeneralOfferingIncome(paginationDto: PaginationDto) {
    const { order, churchId, searchDate } = paginationDto;

    let newTerm: string = '';
    if (searchDate) {
      const [fromTimestamp, toTimestamp] = searchDate.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
      const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

      newTerm = `${formattedFromDate} - ${formattedToDate}`;
    }

    try {
      const offeringIncome: OfferingIncome[] =
        await this.offeringIncomeService.findAll(paginationDto);

      if (!offeringIncome) {
        throw new NotFoundException(
          `No se encontraron ingresos de ofrenda con estos términos de búsqueda.`,
        );
      }

      const docDefinition = getOfferingIncomeReport({
        title: 'Reporte de Ingresos de Ofrenda',
        subTitle: 'Resultados de Búsqueda de Ingresos de Ofrenda',
        description: 'registros',
        searchTerm: newTerm,
        churchName: churchId
          ? offeringIncome[0]?.church?.abbreviatedChurchName
          : undefined,
        orderSearch: order,
        data: offeringIncome,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* OFFERING INCOME REPORT BY TERM
  async getOfferingIncomeByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { searchType, searchSubType, order, churchId } =
      searchTypeAndPaginationDto;

    try {
      const offeringIncome: OfferingIncome[] =
        await this.offeringIncomeService.findByTerm(
          term,
          searchTypeAndPaginationDto,
        );

      if (!offeringIncome) {
        throw new NotFoundException(
          `No se encontraron ingresos de ofrenda con estos términos de búsqueda.`,
        );
      }

      let newTerm: string;
      newTerm = term.split('-').join(' ');

      //* By Date
      if (
        (searchType === SearchType.SundayService ||
          searchType === SearchType.SundaySchool ||
          searchType === SearchType.FamilyGroup ||
          searchType === SearchType.ZonalFasting ||
          searchType === SearchType.ZonalVigil ||
          searchType === SearchType.ZonalEvangelism ||
          searchType === SearchType.GeneralFasting ||
          searchType === SearchType.GeneralVigil ||
          searchType === SearchType.GeneralEvangelism ||
          searchType === SearchType.YouthService ||
          searchType === SearchType.UnitedService ||
          searchType === SearchType.ZonalUnitedService ||
          searchType === SearchType.Activities ||
          searchType === SearchType.Special ||
          searchType === SearchType.ChurchGround ||
          searchType === SearchType.IncomeAdjustment) &&
        searchSubType === SearchSubType.OfferingByDate
      ) {
        const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
        const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

        newTerm = `${formattedFromDate} - ${formattedToDate}`;
      }

      //* By Shift
      if (
        (searchType === SearchType.SundayService ||
          searchType === SearchType.SundaySchool) &&
        searchSubType === SearchSubType.OfferingByShift
      ) {
        const shiftTerm = term.toLowerCase();
        const validShifts = ['day', 'afternoon'];

        if (!validShifts.includes(shiftTerm)) {
          throw new BadRequestException(`Turno no válido: ${term}`);
        }

        newTerm = `${OfferingIncomeCreationShiftTypeNames[term.toLowerCase()]}`;
      }

      //* By Shift and Date
      if (
        (searchType === SearchType.SundayService ||
          searchType === SearchType.SundaySchool) &&
        searchSubType === SearchSubType.OfferingByShiftDate
      ) {
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

        const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
        const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

        newTerm = `${OfferingIncomeCreationShiftTypeNames[shift.toLowerCase()]} ~ ${formattedFromDate} - ${formattedToDate}`;
      }

      //* By Zone and Date
      if (
        (searchType === SearchType.FamilyGroup ||
          searchType === SearchType.ZonalEvangelism ||
          searchType === SearchType.ZonalFasting ||
          searchType === SearchType.ZonalVigil ||
          searchType === SearchType.ZonalUnitedService) &&
        searchSubType === SearchSubType.OfferingByZoneDate
      ) {
        const [zone, date] = term.split('&');

        const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
        const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

        newTerm = `${zone} ~ ${formattedFromDate} - ${formattedToDate}`;
      }

      //* By Code and Date
      if (
        searchType === SearchType.FamilyGroup &&
        searchSubType === SearchSubType.OfferingByGroupCodeDate
      ) {
        const [code, date] = term.split('&');

        const [fromTimestamp, toTimestamp] = date.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
        const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

        newTerm = `${code} ~ ${formattedFromDate} - ${formattedToDate}`;
      }

      //* By Contributor names
      if (
        (searchType === SearchType.Special ||
          searchType === SearchType.ChurchGround) &&
        searchSubType === SearchSubType.OfferingByContributorFirstNames
      ) {
        const [memberType, names] = term.split('&');
        const firstNames = names.replace(/\+/g, ' ');

        newTerm = `${MemberTypeNames[memberType]} ~ ${firstNames}`;
      }

      //* By Contributor last names
      if (
        (searchType === SearchType.Special ||
          searchType === SearchType.ChurchGround) &&
        searchSubType === SearchSubType.OfferingByContributorLastNames
      ) {
        const [memberType, names] = term.split('&');
        const lastNames = names.split('-')[0].replace(/\+/g, ' ');

        newTerm = `${MemberTypeNames[memberType]} ~ ${lastNames}`;
      }

      //* By Contributor full names
      if (
        (searchType === SearchType.Special ||
          searchType === SearchType.ChurchGround) &&
        searchSubType === SearchSubType.OfferingByContributorFullNames
      ) {
        const [memberType, names] = term.split('&');
        const firstNames = names.split('-')[0].replace(/\+/g, ' ');
        const lastNames = names.split('-')[1].replace(/\+/g, ' ');

        newTerm = `${MemberTypeNames[memberType]} ~ ${firstNames} ${lastNames}`;
      }

      //* By Record Status
      if (searchType === SearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        const validRecordStatus = ['active', 'inactive'];

        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        newTerm = `${RecordStatusNames[recordStatusTerm]} `;
      }

      const docDefinition = getOfferingIncomeReport({
        title: 'Reporte de Ingresos de Ofrenda',
        subTitle: 'Resultados de Búsqueda de Ingresos de Ofrenda',
        description: 'registros',
        searchTerm: newTerm,
        searchType: SearchTypeNames[searchType],
        searchSubType: SearchSubTypeNames[searchSubType] ?? 'S/N',
        orderSearch: RecordOrderNames[order],
        churchName: churchId
          ? offeringIncome[0]?.church?.abbreviatedChurchName
          : undefined,
        data: offeringIncome,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //? OFFERING EXPENSES
  //* GENERAL EXPENSES REPORT
  async getGeneralOfferingExpenses(paginationDto: PaginationDto) {
    const { order, churchId, searchDate } = paginationDto;

    let newTerm: string = '';
    if (searchDate) {
      const [fromTimestamp, toTimestamp] = searchDate.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
      const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

      newTerm = `${formattedFromDate} - ${formattedToDate}`;
    }

    try {
      const offeringExpenses: OfferingExpense[] =
        await this.offeringExpenseService.findAll(paginationDto);

      if (!offeringExpenses) {
        throw new NotFoundException(
          `No se encontraron salidas de ofrenda con estos términos de búsqueda.`,
        );
      }

      const docDefinition = getOfferingExpensesReport({
        title: 'Reporte de Salidas de Ofrenda',
        subTitle: 'Resultados de Búsqueda de Salidas de Ofrenda',
        description: 'registros',
        searchTerm: newTerm,
        churchName: churchId
          ? offeringExpenses[0]?.church?.abbreviatedChurchName
          : undefined,
        orderSearch: order,
        data: offeringExpenses,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* OFFERING EXPENSES REPORT BY TERM
  async getOfferingExpensesByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const { searchType, searchSubType, order, churchId } =
      searchTypeAndPaginationDto;

    try {
      const offeringExpenses: OfferingExpense[] =
        await this.offeringExpenseService.findByTerm(
          term,
          searchTypeAndPaginationDto,
        );

      if (!offeringExpenses) {
        throw new NotFoundException(
          `No se encontraron salidas de ofrenda con estos términos de búsqueda.`,
        );
      }

      let newTerm: string;
      newTerm = term;

      //* By date and church
      if (
        searchType === SearchType.PlaningEventsExpenses ||
        searchType === SearchType.DecorationExpenses ||
        searchType === SearchType.EquipmentAndTechnologyExpenses ||
        searchType === SearchType.MaintenanceAndRepairExpenses ||
        searchType === SearchType.OperationalExpenses ||
        searchType === SearchType.SuppliesExpenses ||
        searchType === SearchType.ExpensesAdjustment
      ) {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
          },
        });

        if (!church) {
          throw new NotFoundException(
            `No se encontró ninguna iglesia con este ID: ${churchId}.`,
          );
        }

        const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const formattedFromDate = format(fromTimestamp, 'dd/MM/yyyy');
        const formattedToDate = format(toTimestamp, 'dd/MM/yyyy');

        newTerm = `${church.abbreviatedChurchName} ~ ${formattedFromDate} - ${formattedToDate}`;
      }

      //* By Record Status
      if (searchType === SearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        const validRecordStatus = ['active', 'inactive'];

        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        newTerm = `${RecordStatusNames[recordStatusTerm]}`;
      }

      const docDefinition = getOfferingExpensesReport({
        title: 'Reporte de Salidas de Ofrenda',
        subTitle: 'Resultados de Búsqueda de Salidas de Ofrenda',
        description: 'registros',
        searchTerm: newTerm,
        searchType: SearchTypeNames[searchType],
        searchSubType: SearchSubTypeNames[searchSubType] ?? 'S/N',
        orderSearch: RecordOrderNames[order],
        churchName: churchId
          ? offeringExpenses[0]?.church?.abbreviatedChurchName
          : undefined,
        data: offeringExpenses,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //? USERS
  //* GENERAL USERS REPORT
  async getGeneralUsers(paginationDto: PaginationDto) {
    const { order } = paginationDto;

    try {
      const users: User[] = await this.userService.findAll(paginationDto);

      if (!users) {
        throw new NotFoundException(
          `No se encontraron usuarios con estos términos de búsqueda.`,
        );
      }

      const docDefinition = getUsersReport({
        title: 'Reporte de Usuarios',
        subTitle: 'Resultados de Búsqueda de Usuarios',
        description: 'usuarios',
        orderSearch: order,
        data: users,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* USERS REPORT BY TERM
  async getUsersByFilters(query: UserSearchAndPaginationDto) {
    const { searchType, order, term } = query;

    try {
      const users: User[] = await this.userService.findByFilters(query);

      if (!users) {
        throw new NotFoundException(
          `No se encontraron usuarios con estos términos de búsqueda.`,
        );
      }

      let newTerm: string;
      newTerm = term;

      if (searchType === UserSearchType.Gender) {
        const genderTerm = term.toLowerCase();
        const validGenders = ['male', 'female'];

        if (!validGenders.includes(genderTerm)) {
          throw new BadRequestException(`Género no válido: ${term}`);
        }

        newTerm = `${GenderNames[genderTerm]}`;
      }

      if (searchType === UserSearchType.Roles) {
        const rolesArray = term.split('+');

        const rolesInSpanish = rolesArray
          .map((role) => UserRoleNames[role] ?? role)
          .join(' ~ ');

        if (rolesArray.length === 0) {
          throw new NotFoundException(
            `No se encontraron usuarios con estos roles: ${rolesInSpanish}`,
          );
        }

        newTerm = `${rolesInSpanish}`;
      }

      if (searchType === UserSearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        const validRecordStatus = ['active', 'inactive'];

        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        newTerm = `${RecordStatusNames[recordStatusTerm]} `;
      }

      const docDefinition = getUsersReport({
        title: 'Reporte de Usuarios',
        subTitle: 'Resultados de Búsqueda de Usuarios',
        description: 'usuarios',
        searchTerm: newTerm,
        searchType: SearchTypeNames[searchType],
        searchSubType: 'S/N',
        orderSearch: RecordOrderNames[order],
        data: users,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //? METRICS
  //* MEMBER METRICS REPORT
  async getMemberMetrics(metricsPaginationDto: ReportPaginationDto) {
    const { year, churchId, types } = metricsPaginationDto;

    try {
      const church = await this.churchRepository.findOne({
        where: {
          id: churchId,
        },
      });

      if (!church) {
        throw new NotFoundException(
          `No se encontró ninguna iglesia con este ID: ${churchId}.`,
        );
      }

      const metricsTypesArray = types.split('+');

      //? Search and Set Data
      //*Members fluctuation by year
      let membersFluctuationByYearDataResult: MonthlyMemberFluctuationDataResult[];
      if (
        metricsTypesArray.includes(MetricSearchType.MembersFluctuationByYear)
      ) {
        membersFluctuationByYearDataResult =
          await this.metricsService.findByTerm(`${churchId}&${year}`, {
            searchType: MetricSearchType.MembersFluctuationByYear,
          });
      }

      //*Members by birth month
      let membersByBirthMonthDataResult: MonthlyMemberDataResult[];
      if (metricsTypesArray.includes(MetricSearchType.MembersByBirthMonth)) {
        membersByBirthMonthDataResult = await this.metricsService.findByTerm(
          churchId,
          {
            searchType: MetricSearchType.MembersByBirthMonth,
          },
        );
      }

      //*Members by category
      let membersByCategoryDataResult: MembersByCategoryDataResult;
      if (metricsTypesArray.includes(MetricSearchType.MembersByCategory)) {
        membersByCategoryDataResult = await this.metricsService.findByTerm(
          churchId,
          {
            searchType: MetricSearchType.MembersByCategory,
          },
        );
      }

      //*Members by category and gender
      let membersByCategoryAndGenderDataResult: MembersByCategoryAndGenderDataResult;
      if (
        metricsTypesArray.includes(MetricSearchType.MembersByCategoryAndGender)
      ) {
        membersByCategoryAndGenderDataResult =
          await this.metricsService.findByTerm(churchId, {
            searchType: MetricSearchType.MembersByCategoryAndGender,
          });
      }

      //*Members by role and gender
      let membersByRoleAndGenderDataResult: MemberByRoleAndGenderDataResult;
      if (metricsTypesArray.includes(MetricSearchType.MembersByRoleAndGender)) {
        membersByRoleAndGenderDataResult = await this.metricsService.findByTerm(
          churchId,
          {
            searchType: MetricSearchType.MembersByRoleAndGender,
          },
        );
      }

      //*Members by marital status
      let membersByMaritalStatusDataResult: MembersByMaritalStatusDataResult;
      if (metricsTypesArray.includes(MetricSearchType.MembersByMaritalStatus)) {
        membersByMaritalStatusDataResult = await this.metricsService.findByTerm(
          churchId,
          {
            searchType: MetricSearchType.MembersByMaritalStatus,
          },
        );
      }

      //*Members by zone and gender
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

      //*Preacher by zone and gender
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

      //*Members by district and gender
      let membersByDistrictAndGenderDataResult: MembersByDistrictAndGenderDataResult;
      if (
        metricsTypesArray.includes(MetricSearchType.MembersByDistrictAndGender)
      ) {
        membersByDistrictAndGenderDataResult =
          await this.metricsService.findByTerm(churchId, {
            searchType: MetricSearchType.MembersByDistrictAndGender,
          });
      }

      //*Members by record status
      let membersByRecordStatusDataResult: MembersByRecordStatusDataResult;
      if (metricsTypesArray.includes(MetricSearchType.MembersByRecordStatus)) {
        membersByRecordStatusDataResult = await this.metricsService.findByTerm(
          churchId,
          {
            searchType: MetricSearchType.MembersByRecordStatus,
          },
        );
      }

      const docDefinition = getMemberMetricsReport({
        title: 'Reporte de Métricas de Miembro',
        subTitle: 'Resultados de Búsqueda de Métricas de Miembros',
        metricsTypesArray: metricsTypesArray,
        year: year,
        church: church,
        membersFluctuationByYearDataResult: membersFluctuationByYearDataResult,
        membersByBirthMonthDataResult: membersByBirthMonthDataResult,
        membersByCategoryDataResult: membersByCategoryDataResult,
        membersByCategoryAndGenderDataResult:
          membersByCategoryAndGenderDataResult,
        membersByRoleAndGenderDataResult: membersByRoleAndGenderDataResult,
        membersByMaritalStatusDataResult: membersByMaritalStatusDataResult,
        disciplesByZoneAndGenderDataResult: disciplesByZoneAndGenderDataResult,
        preachersByZoneAndGenderDataResult: preachersByZoneAndGenderDataResult,
        membersByDistrictAndGenderDataResult:
          membersByDistrictAndGenderDataResult,
        membersByRecordStatusDataResult: membersByRecordStatusDataResult,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* FAMILY GROUP METRICS REPORT
  async getFamilyGroupMetrics(metricsPaginationDto: ReportPaginationDto) {
    const { year, churchId, types } = metricsPaginationDto;

    try {
      const church = await this.churchRepository.findOne({
        where: {
          id: churchId,
        },
      });

      if (!church) {
        throw new NotFoundException(
          `No se encontró ninguna iglesia con este ID: ${churchId}.`,
        );
      }

      const metricsTypesArray = types.split('+');

      //? Search and Set Data
      //* Family groups by year
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

      //* Family groups by zone
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

      //* Family groups by copastor and zone
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

      //* Family groups by district
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

      //* Family groups by service time
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

      //* Family groups by record status
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
        metricsTypesArray: metricsTypesArray,
        year: year,
        familyGroupsFluctuationByYearDataResult:
          familyGroupsFluctuationByYearDataResult,
        familyGroupsByZoneDataResult: familyGroupsByZoneDataResult,
        familyGroupsByCopastorAndZoneDataResult:
          familyGroupsByCopastorAndZoneDataResult,
        familyGroupsByDistrictDataResult: familyGroupsByDistrictDataResult,
        familyGroupsByServiceTimeDataResult:
          familyGroupsByServiceTimeDataResult,
        familyGroupsByRecordStatusDataResult:
          familyGroupsByRecordStatusDataResult,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* OFFERING INCOME METRICS REPORT
  async getOfferingIncomeMetrics(metricsPaginationDto: ReportPaginationDto) {
    const { year, startMonth, endMonth, churchId, types } =
      metricsPaginationDto;

    try {
      const church = await this.churchRepository.findOne({
        where: {
          id: churchId,
        },
      });

      if (!church) {
        throw new NotFoundException(
          `No se encontró ninguna iglesia con este ID: ${churchId}.`,
        );
      }

      const metricsTypesArray = types.split('+');

      //? Search and Set Data
      //* Offering Income by Sunday Service
      let offeringIncomeBySundayServiceDataResult: OfferingIncomeBySundayServiceDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.OfferingIncomeBySundayService,
        )
      ) {
        offeringIncomeBySundayServiceDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.OfferingIncomeBySundayService,
              isSingleMonth: false,
            },
          );
      }

      //* Offering Income by Family group
      let offeringIncomeByFamilyGroupDataResult: OfferingIncomeByFamilyGroupDataResult[][];
      if (
        metricsTypesArray.includes(MetricSearchType.OfferingIncomeByFamilyGroup)
      ) {
        const resultData = await this.metricsService.findByTerm(
          `${churchId}&${startMonth}&${endMonth}&${year}`,
          {
            searchType: MetricSearchType.OfferingIncomeByFamilyGroup,
            isSingleMonth: false,
          },
        );

        //* Formatear el array
        const groupByZone = (data: any[]): any[][] => {
          const grouped: Record<string, any[]> = {};

          for (const item of data) {
            const zoneName = item.zone.zoneName;

            if (!grouped[zoneName]) {
              grouped[zoneName] = [];
            }

            grouped[zoneName].push(item);
          }

          return Object.values(grouped);
        };

        const resultGroup = groupByZone(resultData);

        offeringIncomeByFamilyGroupDataResult = resultGroup;
      }

      //* Offering Income by Sunday School
      let offeringIncomeBySundaySchoolDataResult: OfferingIncomeBySundaySchoolDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.OfferingIncomeBySundaySchool,
        )
      ) {
        offeringIncomeBySundaySchoolDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.OfferingIncomeBySundaySchool,
              isSingleMonth: false,
            },
          );
      }

      //* Offering Income by United Service
      let offeringIncomeByUnitedServiceDataResult: OfferingIncomeByUnitedServiceDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.OfferingIncomeByUnitedService,
        )
      ) {
        offeringIncomeByUnitedServiceDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.OfferingIncomeByUnitedService,
              isSingleMonth: false,
            },
          );
      }

      //* Offering Income by Fasting And Vigil
      let offeringIncomeByFastingAndVigilDataResult: OfferingIncomeByFastingAndVigilAndEvangelismDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.OfferingIncomeByFastingAndVigilAndEvangelism,
        )
      ) {
        offeringIncomeByFastingAndVigilDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType:
                MetricSearchType.OfferingIncomeByFastingAndVigilAndEvangelism,
              isSingleMonth: false,
            },
          );
      }

      //* Offering Income by Youth Service
      let offeringIncomeByYouthServiceDataResult: OfferingIncomeByYouthServiceDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.OfferingIncomeByYouthService,
        )
      ) {
        offeringIncomeByYouthServiceDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.OfferingIncomeByYouthService,
              isSingleMonth: false,
            },
          );
      }

      //* Offering Income by Special Offering
      let offeringIncomeBySpecialOfferingDataResult: OfferingIncomeBySpecialOfferingDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.OfferingIncomeBySpecialOffering,
        )
      ) {
        offeringIncomeBySpecialOfferingDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.OfferingIncomeBySpecialOffering,
              isSingleMonth: false,
            },
          );
      }

      //* Offering Income by Church Ground
      let offeringIncomeByChurchGroundDataResult: OfferingIncomeByChurchGroundDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.OfferingIncomeByChurchGround,
        )
      ) {
        offeringIncomeByChurchGroundDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.OfferingIncomeByChurchGround,
              isSingleMonth: false,
            },
          );
      }

      //* Offering Income by Activities
      let offeringIncomeByActivitiesDataResult: OfferingIncomeByActivitiesDataResult[];
      if (
        metricsTypesArray.includes(MetricSearchType.OfferingIncomeByActivities)
      ) {
        offeringIncomeByActivitiesDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.OfferingIncomeByActivities,
              isSingleMonth: false,
            },
          );
      }

      //* Offering Income by Income Adjustment
      let offeringIncomeByIncomeAdjustmentDataResult: OfferingIncomeByIncomeAdjustmentDataResult[];
      if (
        metricsTypesArray.includes(MetricSearchType.OfferingIncomeAdjustment)
      ) {
        offeringIncomeByIncomeAdjustmentDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.OfferingIncomeAdjustment,
              isSingleMonth: false,
            },
          );
      }

      const docDefinition = getOfferingIncomeMetricsReport({
        title: 'Reporte de Métricas de Ingresos de Ofrenda',
        subTitle: 'Resultados de Búsqueda de Métricas de Ingresos de Ofrendas',
        metricsTypesArray: metricsTypesArray,
        year: year,
        startMonth: startMonth,
        endMonth: endMonth,
        offeringIncomeBySundayServiceDataResult:
          offeringIncomeBySundayServiceDataResult,
        offeringIncomeByFamilyGroupDataResult:
          offeringIncomeByFamilyGroupDataResult,
        offeringIncomeBySundaySchoolDataResult:
          offeringIncomeBySundaySchoolDataResult,
        offeringIncomeByUnitedServiceDataResult:
          offeringIncomeByUnitedServiceDataResult,
        offeringIncomeByFastingAndVigilDataResult:
          offeringIncomeByFastingAndVigilDataResult,
        offeringIncomeByYouthServiceDataResult:
          offeringIncomeByYouthServiceDataResult,
        offeringIncomeBySpecialOfferingDataResult:
          offeringIncomeBySpecialOfferingDataResult,
        offeringIncomeByChurchGroundDataResult:
          offeringIncomeByChurchGroundDataResult,
        offeringIncomeByActivitiesDataResult:
          offeringIncomeByActivitiesDataResult,
        offeringIncomeByIncomeAdjustmentDataResult:
          offeringIncomeByIncomeAdjustmentDataResult,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* OFFERING EXPENSE METRICS REPORT
  async getOfferingExpenseMetrics(metricsPaginationDto: ReportPaginationDto) {
    const { year, startMonth, endMonth, churchId, types } =
      metricsPaginationDto;

    try {
      const church = await this.churchRepository.findOne({
        where: {
          id: churchId,
        },
      });

      if (!church) {
        throw new NotFoundException(
          `No se encontró ninguna iglesia con este ID: ${churchId}.`,
        );
      }

      const metricsTypesArray = types.split('+');

      //? Search and Set Data
      //* Offering Expense by Operational Expenses
      let operationalOfferingExpensesDataResult: OfferingExpenseDataResult[];
      if (
        metricsTypesArray.includes(MetricSearchType.OperationalOfferingExpenses)
      ) {
        operationalOfferingExpensesDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.OperationalOfferingExpenses,
              isSingleMonth: false,
            },
          );
      }

      //* Offering Expense by Maintenance and Repair
      let maintenanceAndRepairOfferingExpensesDataResult: OfferingExpenseDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.MaintenanceAndRepairOfferingExpenses,
        )
      ) {
        maintenanceAndRepairOfferingExpensesDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.MaintenanceAndRepairOfferingExpenses,
              isSingleMonth: false,
            },
          );
      }

      //* Offering Expense by Decoration Expenses
      let decorationOfferingExpensesDataResult: OfferingExpenseDataResult[];
      if (
        metricsTypesArray.includes(MetricSearchType.DecorationOfferingExpenses)
      ) {
        decorationOfferingExpensesDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.DecorationOfferingExpenses,
              isSingleMonth: false,
            },
          );
      }

      //* Offering Expense by Equipment Expenses
      let equipmentAndTechnologyOfferingExpensesDataResult: OfferingExpenseDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.EquipmentAndTechnologyOfferingExpenses,
        )
      ) {
        equipmentAndTechnologyOfferingExpensesDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType:
                MetricSearchType.EquipmentAndTechnologyOfferingExpenses,
              isSingleMonth: false,
            },
          );
      }

      //* Offering Expense by Supplies
      let suppliesOfferingExpensesDataResult: OfferingExpenseDataResult[];
      if (
        metricsTypesArray.includes(MetricSearchType.SuppliesOfferingExpenses)
      ) {
        suppliesOfferingExpensesDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.SuppliesOfferingExpenses,
              isSingleMonth: false,
            },
          );
      }

      //* Offering Expense by Planning Events
      let planingEventsOfferingExpensesDataResult: OfferingExpenseDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.PlaningEventsOfferingExpenses,
        )
      ) {
        planingEventsOfferingExpensesDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.PlaningEventsOfferingExpenses,
              isSingleMonth: false,
            },
          );
      }

      //* Others Offering Expense
      let othersOfferingExpensesDataResult: OfferingExpenseDataResult[];
      if (metricsTypesArray.includes(MetricSearchType.OtherOfferingExpenses)) {
        othersOfferingExpensesDataResult = await this.metricsService.findByTerm(
          `${churchId}&${startMonth}&${endMonth}&${year}`,
          {
            searchType: MetricSearchType.OtherOfferingExpenses,
            isSingleMonth: false,
          },
        );
      }

      //* Offering Expense by Adjustment
      let offeringExpensesAdjustmentsDataResult: OfferingExpensesAdjustmentDataResult[];
      if (
        metricsTypesArray.includes(MetricSearchType.OfferingExpensesAdjustment)
      ) {
        offeringExpensesAdjustmentsDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.OfferingExpensesAdjustment,
              isSingleMonth: false,
            },
          );
      }

      const docDefinition = getOfferingExpensesMetricsReport({
        title: 'Reporte de Métricas de Salida de Ofrenda',
        subTitle: 'Resultados de Búsqueda de Métricas de Salida de Ofrendas',
        metricsTypesArray: metricsTypesArray,
        year: year,
        startMonth: startMonth,
        endMonth: endMonth,
        operationalOfferingExpensesDataResult:
          operationalOfferingExpensesDataResult,
        maintenanceAndRepairOfferingExpensesDataResult:
          maintenanceAndRepairOfferingExpensesDataResult,
        decorationOfferingExpensesDataResult:
          decorationOfferingExpensesDataResult,
        equipmentAndTechnologyOfferingExpensesDataResult:
          equipmentAndTechnologyOfferingExpensesDataResult,
        suppliesOfferingExpensesDataResult: suppliesOfferingExpensesDataResult,
        planingEventsOfferingExpensesDataResult:
          planingEventsOfferingExpensesDataResult,
        othersOfferingExpensesDataResult: othersOfferingExpensesDataResult,
        offeringExpensesAdjustmentsDataResult:
          offeringExpensesAdjustmentsDataResult,
      });

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* FINANCIAL BALANCE COMPARATIVE METRICS REPORT
  async getFinancialBalanceComparativeMetrics(
    metricsPaginationDto: ReportPaginationDto,
  ) {
    const { year, startMonth, endMonth, churchId, types } =
      metricsPaginationDto;

    try {
      const church = await this.churchRepository.findOne({
        where: {
          id: churchId,
        },
      });

      if (!church) {
        throw new NotFoundException(
          `No se encontró ninguna iglesia con este ID: ${churchId}.`,
        );
      }

      const metricsTypesArray = types.split('+');

      // ? Search and Set Data
      //* Income vs Expenses (PEN)
      let yearlyIncomeExpenseComparativePenDataResult: YearlyIncomeExpenseComparativeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.IncomeAndExpensesComparativeByYear,
        )
      ) {
        yearlyIncomeExpenseComparativePenDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${CurrencyType.PEN}&${year}`,
            {
              searchType: MetricSearchType.IncomeAndExpensesComparativeByYear,
            },
          );
      }

      //* Income vs Expenses (USD)
      let yearlyIncomeExpenseComparativeUsdDataResult: YearlyIncomeExpenseComparativeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.IncomeAndExpensesComparativeByYear,
        )
      ) {
        yearlyIncomeExpenseComparativeUsdDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${CurrencyType.USD}&${year}`,
            {
              searchType: MetricSearchType.IncomeAndExpensesComparativeByYear,
            },
          );
      }

      //* Income vs Expenses (EUR)
      let yearlyIncomeExpenseComparativeEurDataResult: YearlyIncomeExpenseComparativeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.IncomeAndExpensesComparativeByYear,
        )
      ) {
        yearlyIncomeExpenseComparativeEurDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${CurrencyType.EUR}&${year}`,
            {
              searchType: MetricSearchType.IncomeAndExpensesComparativeByYear,
            },
          );
      }

      //? General Income Comparative
      let generalOfferingIncomeComparativeDataResult: GeneralOfferingIncomeComparativeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.GeneralComparativeOfferingIncome,
        )
      ) {
        generalOfferingIncomeComparativeDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.GeneralComparativeOfferingIncome,
              order: RecordOrder.Ascending,
            },
          );
      }

      //? Income Comparative By Type
      //* Family Group
      let offeringIncomeComparativeByFamilyGroupDataResult: OfferingIncomeComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingIncomeByType,
        )
      ) {
        offeringIncomeComparativeByFamilyGroupDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingIncomeCreationSubType.FamilyGroup}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingIncomeByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Sunday Service
      let offeringIncomeComparativeBySundayServiceDataResult: OfferingIncomeComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingIncomeByType,
        )
      ) {
        offeringIncomeComparativeBySundayServiceDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingIncomeCreationSubType.SundayService}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingIncomeByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Sunday School
      let offeringIncomeComparativeBySundaySchoolDataResult: OfferingIncomeComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingIncomeByType,
        )
      ) {
        offeringIncomeComparativeBySundaySchoolDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingIncomeCreationSubType.SundaySchool}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingIncomeByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* General Fasting
      let offeringIncomeComparativeByGeneralFastingDataResult: OfferingIncomeComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingIncomeByType,
        )
      ) {
        offeringIncomeComparativeByGeneralFastingDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingIncomeCreationSubType.GeneralFasting}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingIncomeByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* General Vigil
      let offeringIncomeComparativeByGeneralVigilDataResult: OfferingIncomeComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingIncomeByType,
        )
      ) {
        offeringIncomeComparativeByGeneralVigilDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingIncomeCreationSubType.GeneralVigil}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingIncomeByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Zonal Vigil
      let offeringIncomeComparativeByZonalVigilDataResult: OfferingIncomeComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingIncomeByType,
        )
      ) {
        offeringIncomeComparativeByZonalVigilDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingIncomeCreationSubType.ZonalVigil}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingIncomeByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Zonal Fasting
      let offeringIncomeComparativeByZonalFastingDataResult: OfferingIncomeComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingIncomeByType,
        )
      ) {
        offeringIncomeComparativeByZonalFastingDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingIncomeCreationSubType.ZonalFasting}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingIncomeByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Youth Service
      let offeringIncomeComparativeByYouthServiceDataResult: OfferingIncomeComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingIncomeByType,
        )
      ) {
        offeringIncomeComparativeByYouthServiceDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingIncomeCreationSubType.YouthService}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingIncomeByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* United Service
      let offeringIncomeComparativeByUnitedServiceDataResult: OfferingIncomeComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingIncomeByType,
        )
      ) {
        offeringIncomeComparativeByUnitedServiceDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingIncomeCreationSubType.UnitedService}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingIncomeByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Special
      let offeringIncomeComparativeBySpecialOfferingDataResult: OfferingIncomeComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingIncomeByType,
        )
      ) {
        offeringIncomeComparativeBySpecialOfferingDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingIncomeCreationSubType.Special}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingIncomeByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Activities
      let offeringIncomeComparativeByActivitiesDataResult: OfferingIncomeComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingIncomeByType,
        )
      ) {
        offeringIncomeComparativeByActivitiesDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingIncomeCreationSubType.Activities}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingIncomeByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Church Ground
      let offeringIncomeComparativeByChurchGroundDataResult: OfferingIncomeComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingIncomeByType,
        )
      ) {
        offeringIncomeComparativeByChurchGroundDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingIncomeCreationSubType.ChurchGround}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingIncomeByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Income Adjustment
      let offeringIncomeComparativeByIncomeAdjustmentDataResult: OfferingIncomeComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingIncomeByType,
        )
      ) {
        offeringIncomeComparativeByIncomeAdjustmentDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingIncomeCreationType.IncomeAdjustment}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingIncomeByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //? General Expense Comparative
      let generalOfferingExpensesComparativeDataResult: GeneralOfferingExpensesComparativeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.GeneralComparativeOfferingExpenses,
        )
      ) {
        generalOfferingExpensesComparativeDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.GeneralComparativeOfferingExpenses,
              order: RecordOrder.Ascending,
            },
          );
      }

      //? Expenses Comparative By Type
      //* Operational
      let offeringOperationalExpensesComparativeDataResult: OfferingExpenseComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesByType,
        )
      ) {
        offeringOperationalExpensesComparativeDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.OperationalExpenses}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Maintenance and RepairExpenses
      let offeringExpensesComparativeByMaintenanceAndRepairDataResult: OfferingExpenseComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesByType,
        )
      ) {
        offeringExpensesComparativeByMaintenanceAndRepairDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.MaintenanceAndRepairExpenses}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Decoration
      let offeringExpensesComparativeByDecorationDataResult: OfferingExpenseComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesByType,
        )
      ) {
        offeringExpensesComparativeByDecorationDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.DecorationExpenses}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Equipment and Technology
      let offeringExpensesComparativeByEquipmentAndTechnologyDataResult: OfferingExpenseComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesByType,
        )
      ) {
        offeringExpensesComparativeByEquipmentAndTechnologyDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.EquipmentAndTechnologyExpenses}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Supplies
      let offeringExpensesComparativeBySuppliesDataResult: OfferingExpenseComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesByType,
        )
      ) {
        offeringExpensesComparativeBySuppliesDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.SuppliesExpenses}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Planing Events
      let offeringExpensesComparativeByPlaningEventsDataResult: OfferingExpenseComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesByType,
        )
      ) {
        offeringExpensesComparativeByPlaningEventsDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.PlaningEventsExpenses}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Other Expenses
      let offeringExpensesComparativeByOtherExpensesDataResult: OfferingExpenseComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesByType,
        )
      ) {
        offeringExpensesComparativeByOtherExpensesDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.OtherExpenses}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Expenses Adjustment
      let offeringExpensesComparativeByExpenseAdjustmentDataResult: OfferingExpenseComparativeByTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesByType,
        )
      ) {
        offeringExpensesComparativeByExpenseAdjustmentDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.ExpensesAdjustment}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesByType,
              order: RecordOrder.Descending,
            },
          );
      }

      //? Expenses Comparative By Sub-Type
      //* Operational
      let offeringOperationalExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesBySubType,
        )
      ) {
        offeringOperationalExpensesBySubTypeComparativeDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.OperationalExpenses}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesBySubType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Maintenance and RepairExpenses
      let offeringMaintenanceAndRepairExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesBySubType,
        )
      ) {
        offeringMaintenanceAndRepairExpensesBySubTypeComparativeDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.MaintenanceAndRepairExpenses}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesBySubType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Decoration
      let offeringDecorationExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesBySubType,
        )
      ) {
        offeringDecorationExpensesBySubTypeComparativeDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.DecorationExpenses}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesBySubType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Equipment And Technology
      let offeringEquipmentAndTechnologyExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesBySubType,
        )
      ) {
        offeringEquipmentAndTechnologyExpensesBySubTypeComparativeDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.EquipmentAndTechnologyExpenses}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesBySubType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Supplies
      let offeringSuppliesExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesBySubType,
        )
      ) {
        offeringSuppliesExpensesBySubTypeComparativeDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.SuppliesExpenses}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesBySubType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Planing Events
      let offeringPlaningEventsExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesBySubType,
        )
      ) {
        offeringPlaningEventsExpensesBySubTypeComparativeDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.PlaningEventsExpenses}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesBySubType,
              order: RecordOrder.Descending,
            },
          );
      }

      //* Other Expenses
      let offeringOtherExpensesBySubTypeComparativeDataResult: OfferingExpenseComparativeBySubTypeDataResult[];
      if (
        metricsTypesArray.includes(
          MetricSearchType.ComparativeOfferingExpensesBySubType,
        )
      ) {
        offeringOtherExpensesBySubTypeComparativeDataResult =
          await this.metricsService.findByTerm(
            `${churchId}&${OfferingExpenseSearchType.OtherExpenses}&${startMonth}&${endMonth}&${year}`,
            {
              searchType: MetricSearchType.ComparativeOfferingExpensesBySubType,
              order: RecordOrder.Descending,
            },
          );
      }

      const docDefinition = getFinancialBalanceComparativeMetricsReport({
        title: 'Reporte de Métricas Comparativas Balance Financiero',
        subTitle:
          'Resultados de Búsqueda de Métricas Comparativas Balance Financiero',
        metricsTypesArray: metricsTypesArray,
        year: year,
        church: church,
        startMonth: startMonth,
        endMonth: endMonth,
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

      const doc = this.printerService.createPdf(docDefinition);

      return doc;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //? PRIVATE METHODS
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
