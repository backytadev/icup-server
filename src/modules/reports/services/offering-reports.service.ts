import {
  Inject,
  Logger,
  Injectable,
  forwardRef,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { format } from 'date-fns';

import { RecordOrderNames } from '@/common/enums/record-order.enum';
import { SearchSubTypeNames } from '@/common/enums/search-sub-type.enum';
import { RecordStatusNames } from '@/common/enums/record-status.enum';
import { SearchTypeNames } from '@/common/enums/search-types.enum';

import { PaginationDto } from '@/common/dtos/pagination.dto';

import {
  MemberOfferingType,
  MemberOfferingTypeNames,
} from '@/modules/offering/income/enums/member-offering-type.enum';
import { OfferingIncomeCreationSubType } from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';
import { OfferingIncomeCreationShiftTypeNames } from '@/modules/offering/income/enums/offering-income-creation-shift-type.enum';
import { OfferingIncomeSearchAndPaginationDto } from '@/modules/offering/income/dto/offering-income-search-and-pagination.dto';

import { OfferingExpenseSearchType } from '@/modules/offering/expense/enums/offering-expense-search-type.enum';
import { OfferingExpenseSearchAndPaginationDto } from '@/modules/offering/expense/dto/offering-expense-search-and-pagination.dto';

import { PrinterService } from '@/modules/printer/printer.service';
import { DateFormatter } from '@/modules/reports/helpers/date-formatter';

import { OfferingIncomeService } from '@/modules/offering/income/offering-income.service';
import { OfferingExpenseService } from '@/modules/offering/expense/offering-expense.service';

import { Member } from '@/modules/member/entities/member.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';

import { getOfferingIncomeReport } from '@/modules/reports/reports-types/offering/offering-income.report';
import { getOfferingExpensesReport } from '@/modules/reports/reports-types/offering/offering-expenses.report';
import { getStudyCertificateByIdReport } from '@/modules/reports/reports-types/others/study-certificate-by-id.report';
import { generateReceiptByOfferingIncomeId } from '@/modules/reports/reports-types/receipts/generate-receipt-by-offering-income-id';
import { OfferingIncomeSearchType } from '@/modules/offering/income/enums/offering-income-search-type.enum';
import { OfferingIncomeSearchSubType } from '@/modules/offering/income/enums/offering-income-search-sub-type.enum';

@Injectable()
export class OfferingReportsService {
  private readonly logger = new Logger('OfferingReportsService');

  constructor(
    private readonly printerService: PrinterService,

    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,

    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,

    @Inject(forwardRef(() => OfferingIncomeService))
    private readonly offeringIncomeService: OfferingIncomeService,

    private readonly offeringExpenseService: OfferingExpenseService,
  ) {}

  //* STUDENT CERTIFICATE
  async getStudyCertificateById(studentId: string) {
    try {
      const student = await this.memberRepository.findOne({
        where: { id: studentId },
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* OFFERING INCOME RECEIPT
  async generateReceiptByOfferingIncomeId(
    recordId: string,
    queryParams: { generationType: string },
  ) {
    try {
      const offeringIncome = await this.offeringIncomeRepository.findOne({
        where: { id: recordId },
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
          offeringIncome?.memberType === MemberOfferingType.Pastor
            ? `${offeringIncome?.pastor?.member?.firstNames} ${offeringIncome?.pastor?.member?.lastNames}`
            : offeringIncome?.memberType === MemberOfferingType.Copastor
              ? `${offeringIncome?.copastor?.member?.firstNames} ${offeringIncome?.copastor?.member?.lastNames}`
              : offeringIncome?.memberType === MemberOfferingType.Supervisor
                ? `${offeringIncome?.supervisor?.member?.firstNames} ${offeringIncome?.supervisor?.member?.lastNames}`
                : offeringIncome?.memberType === MemberOfferingType.Preacher
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* OFFERING INCOME
  async getGeneralOfferingIncome(paginationDto: PaginationDto) {
    const { order, churchId, searchDate } = paginationDto;

    let newTerm: string = '';
    if (searchDate) {
      const [fromTimestamp, toTimestamp] = searchDate.split('+').map(Number);
      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }
      newTerm = `${format(fromTimestamp, 'dd/MM/yyyy')} - ${format(toTimestamp, 'dd/MM/yyyy')}`;
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  async getOfferingIncomeByFilters(
    searchTypeAndPaginationDto: OfferingIncomeSearchAndPaginationDto,
  ) {
    const { searchType, searchSubType, order, churchId, term } =
      searchTypeAndPaginationDto;

    try {
      const offeringIncome: OfferingIncome[] =
        await this.offeringIncomeService.findByFilters({
          ...searchTypeAndPaginationDto,
          term,
        });

      if (!offeringIncome) {
        throw new NotFoundException(
          `No se encontraron ingresos de ofrenda con estos términos de búsqueda.`,
        );
      }

      let newTerm: string = term.split('-').join(' ');

      //* By Date
      if (
        (searchType === OfferingIncomeSearchType.SundayService ||
          searchType === OfferingIncomeSearchType.SundaySchool ||
          searchType === OfferingIncomeSearchType.FamilyGroup ||
          searchType === OfferingIncomeSearchType.ZonalFasting ||
          searchType === OfferingIncomeSearchType.ZonalVigil ||
          searchType === OfferingIncomeSearchType.ZonalEvangelism ||
          searchType === OfferingIncomeSearchType.GeneralFasting ||
          searchType === OfferingIncomeSearchType.GeneralVigil ||
          searchType === OfferingIncomeSearchType.GeneralEvangelism ||
          searchType === OfferingIncomeSearchType.YouthService ||
          searchType === OfferingIncomeSearchType.UnitedService ||
          searchType === OfferingIncomeSearchType.ZonalUnitedService ||
          searchType === OfferingIncomeSearchType.Activities ||
          searchType === OfferingIncomeSearchType.Special ||
          searchType === OfferingIncomeSearchType.ChurchGround ||
          searchType === OfferingIncomeSearchType.IncomeAdjustment) &&
        searchSubType === OfferingIncomeSearchSubType.OfferingByDate
      ) {
        const [fromTimestamp, toTimestamp] = term.split('+').map(Number);
        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }
        newTerm = `${format(fromTimestamp, 'dd/MM/yyyy')} - ${format(toTimestamp, 'dd/MM/yyyy')}`;
      }

      //* By Shift
      if (
        (searchType === OfferingIncomeSearchType.SundayService ||
          searchType === OfferingIncomeSearchType.SundaySchool) &&
        searchSubType === OfferingIncomeSearchSubType.OfferingByShift
      ) {
        const shiftTerm = term.toLowerCase();
        if (!['day', 'afternoon'].includes(shiftTerm)) {
          throw new BadRequestException(`Turno no válido: ${term}`);
        }
        newTerm = `${OfferingIncomeCreationShiftTypeNames[term.toLowerCase()]}`;
      }

      //* By Shift and Date
      if (
        (searchType === OfferingIncomeSearchType.SundayService ||
          searchType === OfferingIncomeSearchType.SundaySchool) &&
        searchSubType === OfferingIncomeSearchSubType.OfferingByShiftDate
      ) {
        const [shift, date] = term.split('&');
        const shiftTerm = shift.toLowerCase();
        if (!['day', 'afternoon'].includes(shiftTerm)) {
          throw new BadRequestException(`Turno no válido: ${term}`);
        }
        const [fromTimestamp, toTimestamp] = date.split('+').map(Number);
        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }
        newTerm = `${OfferingIncomeCreationShiftTypeNames[shift.toLowerCase()]} ~ ${format(fromTimestamp, 'dd/MM/yyyy')} - ${format(toTimestamp, 'dd/MM/yyyy')}`;
      }

      //* By Zone and Date
      if (
        (searchType === OfferingIncomeSearchType.FamilyGroup ||
          searchType === OfferingIncomeSearchType.ZonalEvangelism ||
          searchType === OfferingIncomeSearchType.ZonalFasting ||
          searchType === OfferingIncomeSearchType.ZonalVigil ||
          searchType === OfferingIncomeSearchType.ZonalUnitedService) &&
        searchSubType === OfferingIncomeSearchSubType.OfferingByZoneDate
      ) {
        const [zone, date] = term.split('&');
        const [fromTimestamp, toTimestamp] = date.split('+').map(Number);
        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }
        newTerm = `${zone} ~ ${format(fromTimestamp, 'dd/MM/yyyy')} - ${format(toTimestamp, 'dd/MM/yyyy')}`;
      }

      //* By Code and Date
      if (
        searchType === OfferingIncomeSearchType.FamilyGroup &&
        searchSubType === OfferingIncomeSearchSubType.OfferingByGroupCodeDate
      ) {
        const [code, date] = term.split('&');
        const [fromTimestamp, toTimestamp] = date.split('+').map(Number);
        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }
        newTerm = `${code} ~ ${format(fromTimestamp, 'dd/MM/yyyy')} - ${format(toTimestamp, 'dd/MM/yyyy')}`;
      }

      //* By Contributor names
      if (
        (searchType === OfferingIncomeSearchType.Special ||
          searchType === OfferingIncomeSearchType.ChurchGround) &&
        searchSubType ===
          OfferingIncomeSearchSubType.OfferingByContributorFirstNames
      ) {
        const [memberType, names] = term.split('&');
        newTerm = `${MemberOfferingTypeNames[memberType]} ~ ${names.replace(/\+/g, ' ')}`;
      }

      //* By Contributor last names
      if (
        (searchType === OfferingIncomeSearchType.Special ||
          searchType === OfferingIncomeSearchType.ChurchGround) &&
        searchSubType ===
          OfferingIncomeSearchSubType.OfferingByContributorLastNames
      ) {
        const [memberType, names] = term.split('&');
        newTerm = `${MemberOfferingTypeNames[memberType]} ~ ${names.split('-')[0].replace(/\+/g, ' ')}`;
      }

      //* By Contributor full names
      if (
        (searchType === OfferingIncomeSearchType.Special ||
          searchType === OfferingIncomeSearchType.ChurchGround) &&
        searchSubType ===
          OfferingIncomeSearchSubType.OfferingByContributorFullNames
      ) {
        const [memberType, names] = term.split('&');
        const firstNames = names.split('-')[0].replace(/\+/g, ' ');
        const lastNames = names.split('-')[1].replace(/\+/g, ' ');
        newTerm = `${MemberOfferingTypeNames[memberType]} ~ ${firstNames} ${lastNames}`;
      }

      //* By Record Status
      if (searchType === OfferingIncomeSearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        if (!['active', 'inactive'].includes(recordStatusTerm)) {
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* OFFERING EXPENSES
  async getGeneralOfferingExpenses(paginationDto: PaginationDto) {
    const { order, churchId, searchDate } = paginationDto;

    let newTerm: string = '';
    if (searchDate) {
      const [fromTimestamp, toTimestamp] = searchDate.split('+').map(Number);
      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }
      newTerm = `${format(fromTimestamp, 'dd/MM/yyyy')} - ${format(toTimestamp, 'dd/MM/yyyy')}`;
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  async getOfferingExpensesByFilters(
    dto: OfferingExpenseSearchAndPaginationDto,
  ) {
    const { searchType, searchSubType, order, churchId, term } = dto;

    try {
      const offeringExpenses: OfferingExpense[] =
        await this.offeringExpenseService.findByFilters(dto);

      if (!offeringExpenses) {
        throw new NotFoundException(
          `No se encontraron salidas de ofrenda con estos términos de búsqueda.`,
        );
      }

      let newTerm: string = term;

      //* By date and church
      if (
        searchType === OfferingExpenseSearchType.PlaningEventsExpenses ||
        searchType === OfferingExpenseSearchType.DecorationExpenses ||
        searchType ===
          OfferingExpenseSearchType.EquipmentAndTechnologyExpenses ||
        searchType === OfferingExpenseSearchType.MaintenanceAndRepairExpenses ||
        searchType === OfferingExpenseSearchType.OperationalExpenses ||
        searchType === OfferingExpenseSearchType.SuppliesExpenses ||
        searchType === OfferingExpenseSearchType.ExpensesAdjustment
      ) {
        const church = await this.churchRepository.findOne({
          where: { id: churchId },
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

        newTerm = `${church.abbreviatedChurchName} ~ ${format(fromTimestamp, 'dd/MM/yyyy')} - ${format(toTimestamp, 'dd/MM/yyyy')}`;
      }

      //* By Record Status
      if (searchType === OfferingExpenseSearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        if (!['active', 'inactive'].includes(recordStatusTerm)) {
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
