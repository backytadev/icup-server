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

import {
  ApiTags,
  ApiParam,
  ApiQuery,
  ApiProduces,
  ApiBearerAuth,
  ApiOkResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { ReportPaginationDto } from '@/common/dtos/report-pagination.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { Auth } from '@/common/decorators/auth.decorator';

import { UserSearchAndPaginationDto } from '@/modules/user/dto/user-search-and-pagination.dto';
import { ChurchSearchAndPaginationDto } from '@/modules/church/dto/church-search-and-pagination.dto';
import { PastorSearchAndPaginationDto } from '@/modules/pastor/dto/pastor-search-and-pagination.dto';
import { MinistrySearchAndPaginationDto } from '@/modules/ministry/dto/ministry-search-and-pagination.dto';
import { CoPastorSearchAndPaginationDto } from '@/modules/copastor/dto/copastor-search-and-pagination.dto';

import { ReportsService } from '@/modules/reports/reports.service';

import { UserSearchType } from '@/modules/user/enums/user-search-type.enum';
import { ZoneSearchType } from '@/modules/zone/enums/zone-search-type.enum';
import { ChurchSearchType } from '@/modules/church/enums/church-search-type.enum';
import { PastorSearchType } from '@/modules/pastor/enums/pastor-search-type.enum';
import { ZoneSearchSubType } from '@/modules/zone/enums/zone-search-sub-type.enum';
import { MinistrySearchType } from '@/modules/ministry/enums/ministry-search-type.enum';
import { PreacherSearchType } from '@/modules/preacher/enums/preacher-search-type.enum';
import { CopastorSearchType } from '@/modules/copastor/enums/copastor-search-type.enum';
import { DiscipleSearchType } from '@/modules/disciple/enums/disciple-search-type.enum';
import { SupervisorSearchType } from '@/modules/supervisor/enums/supervisor-search-type.enum';
import { CopastorSearchSubType } from '@/modules/copastor/enums/copastor-search-sub-type.enum';
import { DiscipleSearchSubType } from '@/modules/disciple/enums/disciple-search-sub-type.enum';
import { PreacherSearchSubType } from '@/modules/preacher/enums/preacher-search-sub-type.enum';
import { FamilyGroupSearchType } from '@/modules/family-group/enums/family-group-search-type.enum';
import { SupervisorSearchSubType } from '@/modules/supervisor/enums/supervisor-search-sub-type.num';
import { FamilyGroupSearchSubType } from '@/modules/family-group/enums/family-group-search-sub-type.enum';
import { OfferingIncomeSearchType } from '@/modules/offering/income/enums/offering-income-search-type.enum';
import { OfferingExpenseSearchType } from '@/modules/offering/expense/enums/offering-expense-search-type.enum';
import { OfferingIncomeSearchSubType } from '@/modules/offering/income/enums/offering-income-search-sub-type.enum';
import { OfferingExpenseSearchSubType } from '@/modules/offering/expense/enums/offering-expense-search-sub-type.enum';

//  todo: use and replace for common decorator for this controller
@ApiTags('Reports')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description:
    '🔒 Unauthorized: Missing or invalid Bearer Token. Please provide a valid token to access this resource.',
})
@ApiInternalServerErrorResponse({
  description:
    '🚨 Internal Server Error: An unexpected error occurred on the server. Please check the server logs for more details.',
})
@ApiBadRequestResponse({
  description:
    '❌ Bad Request: The request contains invalid data or parameters. Please verify the input and try again.',
})
@ApiForbiddenResponse({
  description:
    '🚫 Forbidden: You do not have the necessary permissions to access this resource.',
})
@SkipThrottle()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  //* STUDENT CERTIFICATE
  @Get('student-certificate/:id')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested student certificate has been successfully retrieved. The response includes the certificate as a downloadable PDF file.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Unique identifier of the student for whom the certificate is requested. This ID is used to fetch the specific study certificate from the database.',
    example: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
  })
  @ApiProduces('application/pdf')
  async getStudyCertificateById(
    @Res() response: Response,
    @Param('id', ParseUUIDPipe) studentId: string,
  ) {
    const pdfDoc = await this.reportsService.getStudyCertificateById(studentId);

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
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested offering income receipt has been successfully generated. The response includes the receipt as a downloadable PDF file.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Unique identifier of the offering income record for which the receipt is being generated. This ID is used to retrieve the corresponding data from the database.',
    example: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
  })
  @ApiProduces('application/pdf')
  async generateReceipt(
    @Res() response: Response,
    @Param('id', ParseUUIDPipe) recordId: string,
    @Query() queryParams: { generationType: string },
  ) {
    const pdfDoc = await this.reportsService.generateReceiptByOfferingIncomeId(
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
  //* CHURCHES GENERAL REPORT
  @Get('churches')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of churches has been successfully retrieved. The response includes a downloadable PDF report of the churches.',
  })
  @ApiProduces('application/pdf')
  async getGeneralChurches(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getGeneralChurches(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-churches-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* CHURCHES BY TERM REPORT
  @Get('churches/search')
  @Auth()
  @ApiParam({
    name: 'term',
    description:
      'Could be church name, department, province, district, urbanSector, address, foundingDate and record status.',
    example: 'Iglesia Cristiana de Paz',
  })
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of churches has been successfully retrieved. The response includes a downloadable PDF report of the churches.',
  })
  @ApiQuery({
    name: 'searchType',
    enum: ChurchSearchType,
    description: 'Choose one of the types to perform a search.',
    example: ChurchSearchType.ChurchName,
  })
  @ApiProduces('application/pdf')
  async getChurchesByTerm(
    @Res() response: Response,
    @Query() query: ChurchSearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getChurchesByFilters(query);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="churches-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? MINISTRIES
  //* MINISTRIES GENERAL REPORT
  @Get('ministries')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of ministries has been successfully retrieved. The response includes a downloadable PDF report of the ministries.',
  })
  @ApiProduces('application/pdf')
  async getGeneralMinistries(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getGeneralMinistries(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-ministries-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* CHURCHES BY TERM REPORT
  @Get('ministries/search')
  @Auth()
  @ApiParam({
    name: 'term',
    description:
      'Could be church name, department, province, district, urbanSector, address, foundingDate and record status.',
    example: 'Ministerio de Jóvenes',
  })
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of ministries has been successfully retrieved. The response includes a downloadable PDF report of the ministries.',
  })
  @ApiQuery({
    name: 'searchType',
    enum: MinistrySearchType,
    description: 'Choose one of the types to perform a search.',
    example: MinistrySearchType.MinistryType,
  })
  @ApiProduces('application/pdf')
  async getMinistriesByTerm(
    @Res() response: Response,
    @Query() query: MinistrySearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getMinistriesByFilters(query);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="ministries-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? PASTORS
  //* PASTORS GENERAL REPORT
  @Get('pastors')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of pastors has been successfully retrieved. The response includes a downloadable PDF report of the pastors.',
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getGeneralPastors(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getGeneralPastors(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-pastors-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* PASTORS BY TERM REPORT
  @Get('pastors/:term')
  @Auth()
  @ApiParam({
    name: 'term',
    description:
      'Could be first names, last Names, full names, birth date, birth month, gender, marital status, origin country, residence country, residence department, residence province, residence district, residence urban sector, residence address and record status.',
    example: 'Rolando Martin',
  })
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of pastors has been successfully retrieved. The response includes a downloadable PDF report of the pastors.',
  })
  @ApiQuery({
    name: 'searchType',
    enum: PastorSearchType,
    description: 'Choose one of the types to perform a search.',
    example: PastorSearchType.FirstNames,
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getPastorsByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: PastorSearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getPastorsByFilters(
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
  //* COPASTORS GENERAL REPORT
  @Get('copastors')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of co-pastors has been successfully retrieved. The response includes a downloadable PDF report of the co-pastors.',
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getGeneralCopastors(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getGeneralCopastors(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-copastors-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* COPASTORS BY TERM REPORT
  @Get('copastors/:term')
  @Auth()
  @ApiParam({
    name: 'term',
    description:
      'Could be first names, last Names, full names, birth date, birth month, gender, marital status, origin country, residence country, residence department, residence province, residence district, residence urban sector, residence address and record status.',
    example: 'Rolando Martin',
  })
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of co-pastors has been successfully retrieved. The response includes a downloadable PDF report of the co-pastors.',
  })
  @ApiQuery({
    name: 'searchType',
    enum: CopastorSearchType,
    description: 'Choose one of the types to perform a search.',
    example: CopastorSearchType.FirstNames,
  })
  @ApiQuery({
    name: 'searchSubType',
    enum: CopastorSearchSubType,
    required: false,
    description: 'Choose one of the types to perform a search.',
    example: CopastorSearchSubType.CopastorByPastorFirstNames,
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getCopastorsByFilters(
    @Res() response: Response,
    @Query() searchTypeAndPaginationDto: CoPastorSearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getCopastorsByFilters(
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
  //* SUPERVISORS GENERAL REPORT
  @Get('supervisors')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of supervisors has been successfully retrieved. The response includes a downloadable PDF report of the supervisors.',
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getGeneralSupervisors(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getGeneralSupervisors(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-supervisors-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* SUPERVISORS BY TERM REPORT
  @Get('supervisors/:term')
  @Auth()
  @ApiParam({
    name: 'term',
    description:
      'Could be first names, last Names, full names, birth date, birth month, gender, zone name, marital status, origin country, residence country, residence department, residence province, residence district, residence urban sector, residence address and record status.',
    example: 'Rolando Martin',
  })
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of supervisors has been successfully retrieved. The response includes a downloadable PDF report of the supervisors.',
  })
  @ApiQuery({
    name: 'searchType',
    enum: SupervisorSearchType,
    description: 'Choose one of the types to perform a search.',
    example: SupervisorSearchType.FirstNames,
  })
  @ApiQuery({
    name: 'searchSubType',
    enum: SupervisorSearchSubType,
    required: false,
    description: 'Choose one of the types to perform a search.',
    example: SupervisorSearchSubType.SupervisorByPastorFirstNames,
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getSupervisorsByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getSupervisorsByTerm(
      term,
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
  //* PREACHERS GENERAL REPORT
  @Get('preachers')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of preachers has been successfully retrieved. The response includes a downloadable PDF report of the preachers.',
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getGeneralPreachers(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getGeneralPreachers(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-preachers-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* PREACHERS BY TERM REPORT
  @Get('preachers/:term')
  @Auth()
  @ApiParam({
    name: 'term',
    description:
      'Could be first names, last Names, full names, birth date, birth month, zone name, family group code, family group name, gender, marital status, origin country, residence country, residence department, residence province, residence district, residence urban sector, residence address and record status.',
    example: 'Rolando Martin',
  })
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of preacher has been successfully retrieved. The response includes a downloadable PDF report of the preachers.',
  })
  @ApiQuery({
    name: 'searchType',
    enum: PreacherSearchType,
    description: 'Choose one of the types to perform a search.',
    example: PreacherSearchType.FirstNames,
  })
  @ApiQuery({
    name: 'searchSubType',
    enum: PreacherSearchSubType,
    required: false,
    description: 'Choose one of the types to perform a search.',
    example: PreacherSearchSubType.PreacherByPastorFirstNames,
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getPreachersByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getPreachersByTerm(
      term,
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
  //* DISCIPLES GENERAL REPORT
  @Get('disciples')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of disciples has been successfully retrieved. The response includes a downloadable PDF report of the disciples.',
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getGeneralDisciples(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getGeneralDisciples(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-disciples-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* DISCIPLES BY TERM REPORT
  @Get('disciples/:term')
  @Auth()
  @ApiParam({
    name: 'term',
    description:
      'Could be first names, last Names, full names, birth date, birth month, zone name, family group code, family group name, gender, marital status, origin country, residence country, residence department, residence province, residence district, residence urban sector, residence address and record status.',
    example: 'Rolando Martin',
  })
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of disciples has been successfully retrieved. The response includes a downloadable PDF report of the disciples.',
  })
  @ApiQuery({
    name: 'searchType',
    enum: DiscipleSearchType,
    description: 'Choose one of the types to perform a search.',
    example: DiscipleSearchType.FirstNames,
  })
  @ApiQuery({
    name: 'searchSubType',
    enum: DiscipleSearchSubType,
    required: false,
    description: 'Choose one of the types to perform a search.',
    example: DiscipleSearchSubType.DiscipleByPastorFirstNames,
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getDisciplesByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getDisciplesByTerm(
      term,
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
  //* ZONES GENERAL REPORT
  @Get('zones')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of zones has been successfully retrieved. The response includes a downloadable PDF report of the zones.',
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getGeneralZones(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getGeneralZones(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-zones-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* ZONES BY TERM REPORT
  @Get('zones/:term')
  @Auth()
  @ApiParam({
    name: 'term',
    description:
      'Could be first names, last names, full names, zone name, country, department, province, district, record status.',
    example: 'Rolando Martin',
  })
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of zones has been successfully retrieved. The response includes a downloadable PDF report of the zones.',
  })
  @ApiQuery({
    name: 'searchType',
    enum: ZoneSearchType,
    description: 'Choose one of the types to perform a search.',
    example: ZoneSearchType.FirstNames,
  })
  @ApiQuery({
    name: 'searchSubType',
    enum: ZoneSearchSubType,
    required: false,
    description: 'Choose one of the types to perform a search.',
    example: ZoneSearchSubType.ZoneByPastorFirstNames,
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getZonesByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getZonesByTerm(
      term,
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
  //* FAMILY GROUPS GENERAL REPORT
  @Get('family-groups')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of family groups has been successfully retrieved. The response includes a downloadable PDF report of the family groups.',
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getGeneralFamilyGroups(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getGeneralFamilyGroups(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-family-groups-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* FAMILY GROUPS BY TERM REPORT
  @Get('family-groups/:term')
  @Auth()
  @ApiParam({
    name: 'term',
    description:
      'Could be first names, last names, full names, zone name, family group code, family group name, country, department, province, district, record status.',
    example: 'Rolando Martin',
  })
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of family groups has been successfully retrieved. The response includes a downloadable PDF report of the family groups.',
  })
  @ApiQuery({
    name: 'searchType',
    enum: FamilyGroupSearchType,
    description: 'Choose one of the types to perform a search.',
    example: FamilyGroupSearchType.FirstNames,
  })
  @ApiQuery({
    name: 'searchSubType',
    enum: FamilyGroupSearchSubType,
    required: false,
    description: 'Choose one of the types to perform a search.',
    example: FamilyGroupSearchSubType.FamilyGroupByPastorFirstNames,
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getFamilyGroupsByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getFamilyGroupsByTerm(
      term,
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
  //* OFFERING INCOME GENERAL REPORT
  @Get('offering-income')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of offering income has been successfully retrieved. The response includes a downloadable PDF report of the offering income.',
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getGeneralOfferingIncome(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getGeneralOfferingIncome(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-offering-income-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* OFFERING INCOME BY TERM REPORT
  @Get('offering-income/:term')
  @Auth()
  @ApiParam({
    name: 'term',
    description:
      'Could be date or range dates(timestamp), first names, last names, full names, zone names, shift, family group code and active or inactive.',
    example: '1735707600000+1738299600000',
  })
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of offering income has been successfully retrieved. The response includes a downloadable PDF report of the offering income.',
  })
  @ApiQuery({
    name: 'searchType',
    enum: OfferingIncomeSearchType,
    description: 'Choose one of the types to perform a search.',
    example: OfferingIncomeSearchType.FamilyGroup,
  })
  @ApiQuery({
    name: 'searchSubType',
    enum: OfferingIncomeSearchSubType,
    required: false,
    description: 'Choose one of the types to perform a search.',
    example: OfferingIncomeSearchSubType.OfferingByDate,
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getOfferingIncomeByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getOfferingIncomeByTerm(
      term,
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
  //* OFFERING EXPENSES GENERAL REPORT
  @Get('offering-expenses')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of offering expenses has been successfully retrieved. The response includes a downloadable PDF report of the offering expenses.',
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getGeneralOfferingExpenses(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getGeneralOfferingExpenses(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-offering-expenses-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* OFFERING EXPENSES BY TERM REPORT
  @Get('offering-expenses/:term')
  @Auth()
  @ApiParam({
    name: 'term',
    description:
      'Could be date o range dates (timestamp), and active or inactive.',
    example: '1735707600000+1738299600000',
  })
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of offering expenses has been successfully retrieved. The response includes a downloadable PDF report of the offering expenses.',
  })
  @ApiQuery({
    name: 'searchType',
    enum: OfferingExpenseSearchType,
    description: 'Choose one of the types to perform a search.',
    example: OfferingExpenseSearchType.OperationalExpenses,
  })
  @ApiQuery({
    name: 'searchSubType',
    enum: OfferingExpenseSearchSubType,
    required: false,
    description: 'Choose one of the types to perform a search.',
    example: OfferingExpenseSearchSubType.VenueRental,
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @ApiProduces('application/pdf')
  async getOfferingExpensesByTerm(
    @Res() response: Response,
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getOfferingExpensesByTerm(
      term,
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
  //* USERS GENERAL REPORT
  @Get('users')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of users has been successfully retrieved. The response includes a downloadable PDF report of the users.',
  })
  @ApiProduces('application/pdf')
  async getGeneralUsers(
    @Res() response: Response,
    @Query() paginationDto: PaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getGeneralUsers(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="general-users-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* USERS BY TERM REPORT
  @Get('users/search')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested list of users has been successfully retrieved. The response includes a downloadable PDF report of the users.',
  })
  @ApiParam({
    name: 'term',
    description:
      'Could be first names, last names, full names, roles, gender, etc.',
    example: 'User Test 1',
  })
  @ApiQuery({
    name: 'searchType',
    enum: UserSearchType,
    description: 'Choose one of the types to perform a search.',
    example: UserSearchType.FirstNames,
  })
  @ApiProduces('application/pdf')
  async getUsersByTerm(
    @Res() response: Response,
    @Query() query: UserSearchAndPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getUsersByFilters(query);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="users-by-term-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //? METRICS
  //* MEMBER METRICS REPORT
  @Get('member-metrics')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested member metrics report has been successfully generated and includes a downloadable PDF.',
  })
  @ApiProduces('application/pdf')
  async getMemberMetrics(
    @Res() response: Response,
    @Query() paginationDto: ReportPaginationDto,
  ) {
    const pdfDoc = await this.reportsService.getMemberMetrics(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="member-metrics-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* FAMILY GROUP METRICS REPORT
  @Get('family-group-metrics')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested family groups metrics report has been successfully generated and includes a downloadable PDF.',
  })
  @ApiProduces('application/pdf')
  async getFamilyGroupMetrics(
    @Res() response: Response,
    @Query() paginationDto: ReportPaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getFamilyGroupMetrics(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="family-groups-metrics-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* OFFERING INCOME METRICS REPORT
  @Get('offering-income-metrics')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested offering income metrics report has been successfully generated and includes a downloadable PDF.',
  })
  @ApiProduces('application/pdf')
  async getOfferingIncomeMetrics(
    @Res() response: Response,
    @Query() paginationDto: ReportPaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getOfferingIncomeMetrics(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="offering-income-metrics-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* OFFERING EXPENSE METRICS REPORT
  @Get('offering-expense-metrics')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested offering expenses metrics report has been successfully generated and includes a downloadable PDF.',
  })
  @ApiProduces('application/pdf')
  async getOfferingExpenseMetrics(
    @Res() response: Response,
    @Query() paginationDto: ReportPaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getOfferingExpenseMetrics(paginationDto);

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="offering-expenses-metrics-report.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //* FINANCIAL BALANCE COMPARATIVE METRICS REPORT
  @Get('financial-balance-comparative-metrics')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Operation Successful: The requested financial balance comparative metrics report has been successfully generated and includes a downloadable PDF.',
  })
  @ApiProduces('application/pdf')
  async getFinancialBalanceComparativeMetrics(
    @Res() response: Response,
    @Query() paginationDto: ReportPaginationDto,
  ) {
    const pdfDoc =
      await this.reportsService.getFinancialBalanceComparativeMetrics(
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
