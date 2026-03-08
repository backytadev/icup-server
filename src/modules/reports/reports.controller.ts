import {
  Get,
  Res,
  Param,
  Query,
  Controller,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { ReportPaginationDto } from '@/common/dtos/report-pagination.dto';

import { Auth } from '@/common/decorators/auth.decorator';

import { UserSearchAndPaginationDto } from '@/modules/user/dto/user-search-and-pagination.dto';
import { ZoneSearchAndPaginationDto } from '@/modules/zone/dto/zone-search-and-pagination.dto';
import { ChurchSearchAndPaginationDto } from '@/modules/church/dto/church-search-and-pagination.dto';
import { PastorSearchAndPaginationDto } from '@/modules/pastor/dto/pastor-search-and-pagination.dto';
import { MinistrySearchAndPaginationDto } from '@/modules/ministry/dto/ministry-search-and-pagination.dto';
import { CoPastorSearchAndPaginationDto } from '@/modules/copastor/dto/copastor-search-and-pagination.dto';
import { PreacherSearchAndPaginationDto } from '@/modules/preacher/dto/preacher-search-and-pagination.dto';
import { DiscipleSearchAndPaginationDto } from '@/modules/disciple/dto/disciple-search-and-pagination.dto';
import { SupervisorSearchAndPaginationDto } from '@/modules/supervisor/dto/supervisor-search-and-pagination.dto';
import { FamilyGroupSearchAndPaginationDto } from '@/modules/family-group/dto/family-group-search-and-pagination.dto';
import { OfferingExpenseSearchAndPaginationDto } from '@/modules/offering/expense/dto/offering-expense-search-and-pagination.dto';

import { MembershipReportsService } from '@/modules/reports/services/membership-reports.service';
import { OfferingReportsService } from '@/modules/reports/services/offering-reports.service';
import { MetricsReportsService } from '@/modules/reports/services/metrics-reports.service';

import {
  ReportByIdSwagger,
  ReportGeneralSwagger,
  ReportSearchSwagger,
} from '@/modules/reports/decorators/report-swagger.decorator';

import { SearchType } from '@/common/enums/search-types.enum';
import { UserSearchType } from '@/modules/user/enums/user-search-type.enum';
import { ChurchSearchType } from '@/modules/church/enums/church-search-type.enum';
import { ZoneSearchSubType } from '@/modules/zone/enums/zone-search-sub-type.enum';
import { CopastorSearchSubType } from '@/modules/copastor/enums/copastor-search-sub-type.enum';
import { DiscipleSearchSubType } from '@/modules/disciple/enums/disciple-search-sub-type.enum';
import { PreacherSearchSubType } from '@/modules/preacher/enums/preacher-search-sub-type.enum';
import { SupervisorSearchSubType } from '@/modules/supervisor/enums/supervisor-search-sub-type.enum';
import { FamilyGroupSearchSubType } from '@/modules/family-group/enums/family-group-search-sub-type.enum';
import { OfferingIncomeSearchType } from '@/modules/offering/income/enums/offering-income-search-type.enum';
import { OfferingExpenseSearchType } from '@/modules/offering/expense/enums/offering-expense-search-type.enum';
import { OfferingIncomeSearchSubType } from '@/modules/offering/income/enums/offering-income-search-sub-type.enum';
import { OfferingExpenseSearchSubType } from '@/modules/offering/expense/enums/offering-expense-search-sub-type.enum';
import { OfferingIncomeSearchAndPaginationDto } from '../offering/income/dto/offering-income-search-and-pagination.dto';

@ApiTags('Reports')
@ApiBearerAuth()
@SkipThrottle()
@Controller('reports')
export class ReportsController {
  constructor(
    private readonly membershipReportsService: MembershipReportsService,
    private readonly offeringReportsService: OfferingReportsService,
    private readonly metricsReportsService: MetricsReportsService,
  ) {}

  //* STUDENT CERTIFICATE
  @Get('student-certificate/:id')
  @Auth()
  @ReportByIdSwagger({
    description: 'Student certificate retrieved successfully.',
    paramDescription:
      'Unique identifier of the student for whom the certificate is requested.',
    paramExample: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
  })
  async getStudyCertificateById(
    @Res() response: Response,
    @Param('id', ParseUUIDPipe) studentId: string,
  ) {
    const pdfDoc =
      await this.offeringReportsService.getStudyCertificateById(studentId);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="student-certificate.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* OFFERING INCOME RECEIPT
  @Get('offering-income/:id/receipt')
  @Auth()
  @ReportByIdSwagger({
    description: 'Offering income receipt generated successfully.',
    paramDescription:
      'Unique identifier of the offering income record for which the receipt is being generated.',
    paramExample: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
  })
  async generateReceipt(
    @Res() response: Response,
    @Param('id', ParseUUIDPipe) recordId: string,
    @Query() queryParams: { generationType: string },
  ) {
    const pdfDoc =
      await this.offeringReportsService.generateReceiptByOfferingIncomeId(
        recordId,
        queryParams,
      );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="offering-income-receipt.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? CHURCHES
  @Get('churches')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Churches report generated successfully.',
  })
  async getGeneralChurches(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.membershipReportsService.getGeneralChurches(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-churches-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('churches/search')
  @Auth()
  @ReportSearchSwagger({
    description: 'Churches report by filters generated successfully.',
    searchTypeEnum: ChurchSearchType,
    searchTypeExample: ChurchSearchType.ChurchName,
  })
  async getChurchesByTerm(
    @Res() response: Response,
    @Query() query: ChurchSearchAndPaginationDto,
  ) {
    const pdfDoc =
      await this.membershipReportsService.getChurchesByFilters(query);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="churches-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? MINISTRIES
  @Get('ministries')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Ministries report generated successfully.',
  })
  async getGeneralMinistries(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.membershipReportsService.getGeneralMinistries(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-ministries-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('ministries/search')
  @Auth()
  @ReportSearchSwagger({
    description: 'Ministries report by filters generated successfully.',
    searchTypeEnum: SearchType,
    searchTypeExample: SearchType.MinistryType,
  })
  async getMinistriesByTerm(
    @Res() response: Response,
    @Query() query: MinistrySearchAndPaginationDto,
  ) {
    const pdfDoc =
      await this.membershipReportsService.getMinistriesByFilters(query);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="ministries-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? PASTORS
  @Get('pastors')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Pastors report generated successfully.',
    showChurchId: true,
  })
  async getGeneralPastors(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.membershipReportsService.getGeneralPastors(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-pastors-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('pastors/search')
  @Auth()
  @ReportSearchSwagger({
    description: 'Pastors report by filters generated successfully.',
    searchTypeEnum: SearchType,
    searchTypeExample: SearchType.FirstNames,
    showChurchId: true,
  })
  async getPastorsByTerm(
    @Res() response: Response,
    @Query() searchTypeAndPaginationDto: PastorSearchAndPaginationDto,
  ) {
    const pdfDoc = await this.membershipReportsService.getPastorsByFilters(
      searchTypeAndPaginationDto,
    );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="pastors-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? COPASTORS
  @Get('copastors')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Co-pastors report generated successfully.',
    showChurchId: true,
  })
  async getGeneralCopastors(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.membershipReportsService.getGeneralCopastors(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-copastors-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('copastors/search')
  @Auth()
  @ReportSearchSwagger({
    description: 'Co-pastors report by filters generated successfully.',
    searchTypeEnum: SearchType,
    searchTypeExample: SearchType.FirstNames,
    searchSubTypeEnum: CopastorSearchSubType,
    searchSubTypeExample: CopastorSearchSubType.CopastorByPastorFirstNames,
    showChurchId: true,
  })
  async getCopastorsByFilters(
    @Res() response: Response,
    @Query() searchTypeAndPaginationDto: CoPastorSearchAndPaginationDto,
  ) {
    const pdfDoc = await this.membershipReportsService.getCopastorsByFilters(
      searchTypeAndPaginationDto,
    );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="copastors-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? SUPERVISORS
  @Get('supervisors')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Supervisors report generated successfully.',
    showChurchId: true,
  })
  async getGeneralSupervisors(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.membershipReportsService.getGeneralSupervisors(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-supervisors-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('supervisors/search')
  @Auth()
  @ReportSearchSwagger({
    description: 'Supervisors report by filters generated successfully.',
    searchTypeEnum: SearchType,
    searchTypeExample: SearchType.FirstNames,
    searchSubTypeEnum: SupervisorSearchSubType,
    searchSubTypeExample: SupervisorSearchSubType.SupervisorByPastorFirstNames,
    showChurchId: true,
  })
  async getSupervisorsByTerm(
    @Res() response: Response,
    @Query() searchTypeAndPaginationDto: SupervisorSearchAndPaginationDto,
  ) {
    const pdfDoc = await this.membershipReportsService.getSupervisorsByFilters(
      searchTypeAndPaginationDto,
    );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="supervisors-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? PREACHERS
  @Get('preachers')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Preachers report generated successfully.',
    showChurchId: true,
  })
  async getGeneralPreachers(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.membershipReportsService.getGeneralPreachers(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-preachers-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('preachers/search')
  @Auth()
  @ReportSearchSwagger({
    description: 'Preachers report by filters generated successfully.',
    searchTypeEnum: SearchType,
    searchTypeExample: SearchType.FirstNames,
    searchSubTypeEnum: PreacherSearchSubType,
    searchSubTypeExample: PreacherSearchSubType.PreacherByPastorFirstNames,
    showChurchId: true,
  })
  async getPreachersByTerm(
    @Res() response: Response,
    @Query() searchTypeAndPaginationDto: PreacherSearchAndPaginationDto,
  ) {
    const pdfDoc = await this.membershipReportsService.getPreachersByFilters(
      searchTypeAndPaginationDto,
    );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="preachers-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? DISCIPLES
  @Get('disciples')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Disciples report generated successfully.',
    showChurchId: true,
  })
  async getGeneralDisciples(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.membershipReportsService.getGeneralDisciples(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-disciples-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('disciples/search')
  @Auth()
  @ReportSearchSwagger({
    description: 'Disciples report by filters generated successfully.',
    searchTypeEnum: SearchType,
    searchTypeExample: SearchType.FirstNames,
    searchSubTypeEnum: DiscipleSearchSubType,
    searchSubTypeExample: DiscipleSearchSubType.DiscipleByPastorFirstNames,
    showChurchId: true,
  })
  async getDisciplesByFilters(
    @Res() response: Response,
    @Query() searchTypeAndPaginationDto: DiscipleSearchAndPaginationDto,
  ) {
    const pdfDoc = await this.membershipReportsService.getDisciplesByFilters(
      searchTypeAndPaginationDto,
    );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="disciples-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? ZONES
  @Get('zones')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Zones report generated successfully.',
    showChurchId: true,
  })
  async getGeneralZones(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.membershipReportsService.getGeneralZones(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-zones-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('zones/search')
  @Auth()
  @ReportSearchSwagger({
    description: 'Zones report by filters generated successfully.',
    searchTypeEnum: SearchType,
    searchTypeExample: SearchType.FirstNames,
    searchSubTypeEnum: ZoneSearchSubType,
    searchSubTypeExample: ZoneSearchSubType.ZoneByPastorFirstNames,
    showChurchId: true,
  })
  async getZonesByFilters(
    @Res() response: Response,
    @Query() searchTypeAndPaginationDto: ZoneSearchAndPaginationDto,
  ) {
    const pdfDoc = await this.membershipReportsService.getZonesByFilters(
      searchTypeAndPaginationDto,
    );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="zones-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? FAMILY GROUPS
  @Get('family-groups')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Family groups report generated successfully.',
    showChurchId: true,
  })
  async getGeneralFamilyGroups(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.membershipReportsService.getGeneralFamilyGroups(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-family-groups-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('family-groups/search')
  @Auth()
  @ReportSearchSwagger({
    description: 'Family groups report by filters generated successfully.',
    searchTypeEnum: SearchType,
    searchTypeExample: SearchType.FirstNames,
    searchSubTypeEnum: FamilyGroupSearchSubType,
    searchSubTypeExample:
      FamilyGroupSearchSubType.FamilyGroupByPastorFirstNames,
    showChurchId: true,
  })
  async getFamilyGroupsByTerm(
    @Res() response: Response,
    @Query() searchTypeAndPaginationDto: FamilyGroupSearchAndPaginationDto,
  ) {
    const pdfDoc = await this.membershipReportsService.getFamilyGroupsByTerm(
      searchTypeAndPaginationDto,
    );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="family-groups-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? OFFERING INCOME
  @Get('offering-income')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Offering income report generated successfully.',
    showChurchId: true,
  })
  async getGeneralOfferingIncome(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.offeringReportsService.getGeneralOfferingIncome(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-offering-income-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('offering-income/search')
  @Auth()
  @ReportSearchSwagger({
    description: 'Offering income report by filters generated successfully.',
    searchTypeEnum: OfferingIncomeSearchType,
    searchTypeExample: OfferingIncomeSearchType.FamilyGroup,
    searchSubTypeEnum: OfferingIncomeSearchSubType,
    searchSubTypeExample: OfferingIncomeSearchSubType.OfferingByDate,
    showChurchId: true,
  })
  async getOfferingIncomeByTerm(
    @Res() response: Response,
    @Query() searchTypeAndPaginationDto: OfferingIncomeSearchAndPaginationDto,
  ) {
    const pdfDoc = await this.offeringReportsService.getOfferingIncomeByFilters(
      searchTypeAndPaginationDto,
    );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="offering-income-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? OFFERING EXPENSES
  @Get('offering-expenses')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Offering expenses report generated successfully.',
    showChurchId: true,
  })
  async getGeneralOfferingExpenses(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.offeringReportsService.getGeneralOfferingExpenses(
        paginationDto,
      );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-offering-expenses-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('offering-expenses/search')
  @Auth()
  @ReportSearchSwagger({
    description: 'Offering expenses report by filters generated successfully.',
    searchTypeEnum: OfferingExpenseSearchType,
    searchTypeExample: OfferingExpenseSearchType.OperationalExpenses,
    searchSubTypeEnum: OfferingExpenseSearchSubType,
    searchSubTypeExample: OfferingExpenseSearchSubType.VenueRental,
    showChurchId: true,
  })
  async getOfferingExpensesByTerm(
    @Res() response: Response,
    @Query() searchTypeAndPaginationDto: OfferingExpenseSearchAndPaginationDto,
  ) {
    const pdfDoc =
      await this.offeringReportsService.getOfferingExpensesByFilters(
        searchTypeAndPaginationDto,
      );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="offering-expenses-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? USERS
  @Get('users')
  @Auth()
  @ReportGeneralSwagger({ description: 'Users report generated successfully.' })
  async getGeneralUsers(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.membershipReportsService.getGeneralUsers(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-users-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('users/search')
  @Auth()
  @ReportSearchSwagger({
    description: 'Users report by filters generated successfully.',
    searchTypeEnum: UserSearchType,
    searchTypeExample: UserSearchType.FirstNames,
  })
  async getUsersByTerm(
    @Res() response: Response,
    @Query() query: UserSearchAndPaginationDto,
  ) {
    const pdfDoc = await this.membershipReportsService.getUsersByFilters(query);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="users-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? METRICS
  @Get('member-metrics')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Member metrics report generated successfully.',
  })
  async getMemberMetrics(
    @Res() response: Response,
    @Query() paginationDto: ReportPaginationDto,
  ) {
    const pdfDoc =
      await this.metricsReportsService.getMemberMetrics(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="member-metrics-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('family-group-metrics')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Family group metrics report generated successfully.',
  })
  async getFamilyGroupMetrics(
    @Res() response: Response,
    @Query() paginationDto: ReportPaginationDto,
  ) {
    const pdfDoc =
      await this.metricsReportsService.getFamilyGroupMetrics(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="family-groups-metrics-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('offering-income-metrics')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Offering income metrics report generated successfully.',
  })
  async getOfferingIncomeMetrics(
    @Res() response: Response,
    @Query() paginationDto: ReportPaginationDto,
  ) {
    const pdfDoc =
      await this.metricsReportsService.getOfferingIncomeMetrics(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="offering-income-metrics-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('offering-expense-metrics')
  @Auth()
  @ReportGeneralSwagger({
    description: 'Offering expense metrics report generated successfully.',
  })
  async getOfferingExpenseMetrics(
    @Res() response: Response,
    @Query() paginationDto: ReportPaginationDto,
  ) {
    const pdfDoc =
      await this.metricsReportsService.getOfferingExpenseMetrics(paginationDto);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="offering-expenses-metrics-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('financial-balance-comparative-metrics')
  @Auth()
  @ReportGeneralSwagger({
    description:
      'Financial balance comparative metrics report generated successfully.',
  })
  async getFinancialBalanceComparativeMetrics(
    @Res() response: Response,
    @Query() paginationDto: ReportPaginationDto,
  ) {
    const pdfDoc =
      await this.metricsReportsService.getFinancialBalanceComparativeMetrics(
        paginationDto,
      );
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="financial-balance-comparative-metrics-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }
}
