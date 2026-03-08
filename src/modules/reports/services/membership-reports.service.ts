import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { format } from 'date-fns';

import { RecordOrderNames } from '@/common/enums/record-order.enum';
import { SearchSubTypeNames } from '@/common/enums/search-sub-type.enum';
import { GenderNames } from '@/common/enums/gender.enum';
import { RecordStatusNames } from '@/common/enums/record-status.enum';
import { MaritalStatusNames } from '@/common/enums/marital-status.enum';
import { SearchType, SearchTypeNames } from '@/common/enums/search-types.enum';
import { MemberSearchType } from '@/common/enums/member-search-type.enum';
import { UserRoleNames } from '@/common/enums/user-role.enum';

import { PaginationDto } from '@/common/dtos/pagination.dto';

import { UserSearchType } from '@/modules/user/enums/user-search-type.enum';
import { UserSearchAndPaginationDto } from '@/modules/user/dto/user-search-and-pagination.dto';

import { ChurchSearchType } from '@/modules/church/enums/church-search-type.enum';
import { ChurchSearchAndPaginationDto } from '@/modules/church/dto/church-search-and-pagination.dto';

import { MinistrySearchAndPaginationDto } from '@/modules/ministry/dto/ministry-search-and-pagination.dto';
import { PastorSearchAndPaginationDto } from '@/modules/pastor/dto/pastor-search-and-pagination.dto';
import { CoPastorSearchAndPaginationDto } from '@/modules/copastor/dto/copastor-search-and-pagination.dto';
import { PreacherSearchAndPaginationDto } from '@/modules/preacher/dto/preacher-search-and-pagination.dto';
import { ZoneSearchAndPaginationDto } from '@/modules/zone/dto/zone-search-and-pagination.dto';
import { FamilyGroupSearchAndPaginationDto } from '@/modules/family-group/dto/family-group-search-and-pagination.dto';
import { DiscipleSearchAndPaginationDto } from '@/modules/disciple/dto/disciple-search-and-pagination.dto';
import { SupervisorSearchAndPaginationDto } from '@/modules/supervisor/dto/supervisor-search-and-pagination.dto';

import { PrinterService } from '@/modules/printer/printer.service';

import { UserService } from '@/modules/user/user.service';
import { ZoneService } from '@/modules/zone/zone.service';
import { PastorService } from '@/modules/pastor/pastor.service';
import { ChurchService } from '@/modules/church/church.service';
import { DiscipleService } from '@/modules/disciple/disciple.service';
import { CopastorService } from '@/modules/copastor/copastor.service';
import { PreacherService } from '@/modules/preacher/preacher.service';
import { MinistryService } from '@/modules/ministry/ministry.service';
import { SupervisorService } from '@/modules/supervisor/supervisor.service';
import { FamilyGroupService } from '@/modules/family-group/family-group.service';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { User } from '@/modules/user/entities/user.entity';

import { getUsersReport } from '@/modules/reports/reports-types/user/user.report';
import { getZonesReport } from '@/modules/reports/reports-types/zone/zones.report';
import { getChurchesReport } from '@/modules/reports/reports-types/church/churches.report';
import { getMembersReport } from '@/modules/reports/reports-types/membership/members.report';
import { getMinistriesReport } from '@/modules/reports/reports-types/ministry/ministry.report';
import { getFamilyGroupsReport } from '@/modules/reports/reports-types/family-group/family-groups.report';

@Injectable()
export class MembershipReportsService {
  private readonly logger = new Logger('MembershipReportsService');

  constructor(
    private readonly printerService: PrinterService,

    private readonly churchService: ChurchService,
    private readonly ministryService: MinistryService,
    private readonly pastorService: PastorService,
    private readonly copastorService: CopastorService,
    private readonly supervisorService: SupervisorService,
    private readonly preacherService: PreacherService,
    private readonly discipleService: DiscipleService,
    private readonly zoneService: ZoneService,
    private readonly familyGroupService: FamilyGroupService,
    private readonly userService: UserService,
  ) {}

  //* CHURCHES
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  async getChurchesByFilters(query: ChurchSearchAndPaginationDto) {
    const { searchType, order, churchId, term } = query;

    try {
      const churches: Church[] = await this.churchService.findByFilters(query);

      if (!churches) {
        throw new NotFoundException(
          `No se encontraron iglesias con estos términos de búsqueda.`,
        );
      }

      let newTerm: string = term;

      if (searchType === ChurchSearchType.FoundingDate) {
        const [fromTimestamp, toTimestamp] = term.split('+').map(Number);
        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }
        newTerm = `${format(fromTimestamp, 'dd/MM/yyyy')} - ${format(toTimestamp, 'dd/MM/yyyy')}`;
      }

      if (searchType === ChurchSearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        if (!['active', 'inactive'].includes(recordStatusTerm)) {
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* MINISTRIES
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  async getMinistriesByFilters(query: MinistrySearchAndPaginationDto) {
    const { searchType, searchSubType, order, churchId, term } = query;

    try {
      const ministries: Ministry[] =
        await this.ministryService.findByFilters(query);

      if (!ministries) {
        throw new NotFoundException(
          `No se encontraron ministerios con estos términos de búsqueda.`,
        );
      }

      let newTerm: string = term;

      if (searchType === MemberSearchType.FoundingDate) {
        const [fromTimestamp, toTimestamp] = term.split('+').map(Number);
        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }
        newTerm = `${format(fromTimestamp, 'dd/MM/yyyy')} - ${format(toTimestamp, 'dd/MM/yyyy')}`;
      }

      if (searchType === MemberSearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        if (!['active', 'inactive'].includes(recordStatusTerm)) {
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* PASTORS
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  async getPastorsByFilters(dto: PastorSearchAndPaginationDto) {
    const { searchType, order, churchId, term } = dto;

    try {
      const pastors: Pastor[] = await this.pastorService.findByFilters(dto);

      if (!pastors) {
        throw new NotFoundException(
          `No se encontraron pastores con estos términos de búsqueda.`,
        );
      }

      let newTerm: string = term.includes('-')
        ? `${term.split('-')[0].replace(/\+/g, ' ')} ${term.split('-')[1].replace(/\+/g, ' ')}`
        : term.replace(/\+/g, ' ');

      newTerm = this.formatMemberSearchTerm(searchType, term, newTerm);

      const docDefinition = getMembersReport({
        title: 'Reporte de Pastores',
        subTitle: 'Resultados de Búsqueda de Pastores',
        description: 'pastores',
        searchTerm: newTerm,
        searchType: SearchTypeNames[searchType],
        searchSubType: 'S/N',
        orderSearch: RecordOrderNames[order],
        churchName: churchId
          ? pastors[0]?.theirChurch?.abbreviatedChurchName
          : undefined,
        data: pastors,
      });

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* COPASTORS
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  async getCopastorsByFilters(dto: CoPastorSearchAndPaginationDto) {
    const { searchType, searchSubType, order, churchId, term } = dto;

    try {
      const copastors: Copastor[] =
        await this.copastorService.findByFilters(dto);

      if (!copastors) {
        throw new NotFoundException(
          `No se encontraron co-pastores con estos términos de búsqueda.`,
        );
      }

      let newTerm: string = term.includes('-')
        ? `${term.split('-')[0].replace(/\+/g, ' ')} ${term.split('-')[1].replace(/\+/g, ' ')}`
        : term.replace(/\+/g, ' ');

      newTerm = this.formatMemberSearchTerm(searchType, term, newTerm);

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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* SUPERVISORS
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  async getSupervisorsByFilters(dto: SupervisorSearchAndPaginationDto) {
    const { searchType, searchSubType, order, churchId, term } = dto;

    try {
      const supervisors: Supervisor[] =
        await this.supervisorService.findByFilters(dto);

      if (!supervisors) {
        throw new NotFoundException(
          `No se encontraron supervisores con estos términos de búsqueda.`,
        );
      }

      let newTerm: string = term.includes('-')
        ? `${term.split('-')[0].replace(/\+/g, ' ')} ${term.split('-')[1].replace(/\+/g, ' ')}`
        : term.replace(/\+/g, ' ');

      newTerm = this.formatMemberSearchTerm(searchType, term, newTerm);

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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* PREACHERS
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  async getPreachersByFilters(dto: PreacherSearchAndPaginationDto) {
    const { searchType, searchSubType, order, churchId, term } = dto;

    try {
      const preachers: Preacher[] =
        await this.preacherService.findByFilters(dto);

      if (!preachers) {
        throw new NotFoundException(
          `No se encontraron predicadores con estos términos de búsqueda.`,
        );
      }

      let newTerm: string = term.includes('-')
        ? `${term.split('-')[0].replace(/\+/g, ' ')} ${term.split('-')[1].replace(/\+/g, ' ')}`
        : term.replace(/\+/g, ' ');

      newTerm = this.formatMemberSearchTerm(searchType, term, newTerm);

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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* DISCIPLES
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  async getDisciplesByFilters(dto: DiscipleSearchAndPaginationDto) {
    const { searchType, searchSubType, order, churchId, term } = dto;

    try {
      const disciples: Disciple[] =
        await this.discipleService.findByFilters(dto);

      if (!disciples) {
        throw new NotFoundException(
          `No se encontraron discípulos con estos términos de búsqueda.`,
        );
      }

      let newTerm: string = term.includes('-')
        ? `${term.split('-')[0].replace(/\+/g, ' ')} ${term.split('-')[1].replace(/\+/g, ' ')}`
        : term.replace(/\+/g, ' ');

      newTerm = this.formatMemberSearchTerm(searchType, term, newTerm);

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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* ZONES
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  async getZonesByFilters(dto: ZoneSearchAndPaginationDto) {
    const { searchType, searchSubType, order, term, churchId } = dto;

    try {
      const zones: Zone[] = await this.zoneService.findByFilters(dto);

      if (!zones) {
        throw new NotFoundException(
          `No se encontraron zonas con estos términos de búsqueda.`,
        );
      }

      let newTerm: string = term.includes('-')
        ? `${term.split('-')[0].replace(/\+/g, ' ')} ${term.split('-')[1].replace(/\+/g, ' ')}`
        : term.replace(/\+/g, ' ');

      if (searchType === MemberSearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        if (!['active', 'inactive'].includes(recordStatusTerm)) {
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* FAMILY GROUPS
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  async getFamilyGroupsByTerm(dto: FamilyGroupSearchAndPaginationDto) {
    const { searchType, searchSubType, order, churchId, term } = dto;

    try {
      const familyGroups: FamilyGroup[] =
        await this.familyGroupService.findByFilters(dto);

      if (!familyGroups) {
        throw new NotFoundException(
          `No se encontraron grupos familiares con estos términos de búsqueda.`,
        );
      }

      let newTerm: string = term.includes('-')
        ? `${term.split('-')[0].replace(/\+/g, ' ')} ${term.split('-')[1].replace(/\+/g, ' ')}`
        : term.replace(/\+/g, ' ');

      if (searchType === MemberSearchType.RecordStatus) {
        const recordStatusTerm = term.toLowerCase();
        if (!['active', 'inactive'].includes(recordStatusTerm)) {
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* USERS
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  async getUsersByFilters(query: UserSearchAndPaginationDto) {
    const { searchType, order, term } = query;

    try {
      const users: User[] = await this.userService.findByFilters(query);

      if (!users) {
        throw new NotFoundException(
          `No se encontraron usuarios con estos términos de búsqueda.`,
        );
      }

      let newTerm: string = term;

      if (searchType === UserSearchType.Gender) {
        const genderTerm = term.toLowerCase();
        if (!['male', 'female'].includes(genderTerm)) {
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
        if (!['active', 'inactive'].includes(recordStatusTerm)) {
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

      return this.printerService.createPdf(docDefinition);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* PRIVATE HELPERS
  private formatMemberSearchTerm(
    searchType: SearchType | MemberSearchType | string,
    term: string,
    currentTerm: string,
  ): string {
    if (searchType === MemberSearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);
      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }
      return `${format(fromTimestamp, 'dd/MM/yyyy')} - ${format(toTimestamp, 'dd/MM/yyyy')}`;
    }

    if (searchType === MemberSearchType.BirthMonth) {
      const monthNames: Record<string, string> = {
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
      return monthNames[term.toLowerCase()] ?? term;
    }

    if (searchType === MemberSearchType.Gender) {
      const genderTerm = term.toLowerCase();
      if (!['male', 'female'].includes(genderTerm)) {
        throw new BadRequestException(`Género no válido: ${term}`);
      }
      return `${GenderNames[genderTerm]}`;
    }

    if (searchType === MemberSearchType.MaritalStatus) {
      const maritalStatusTerm = term.toLowerCase();
      if (
        !['single', 'married', 'widowed', 'divorced', 'other'].includes(
          maritalStatusTerm,
        )
      ) {
        throw new BadRequestException(`Estado Civil no válido: ${term}`);
      }
      return `${MaritalStatusNames[maritalStatusTerm]}`;
    }

    if (searchType === MemberSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      if (!['active', 'inactive'].includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }
      return `${RecordStatusNames[recordStatusTerm]} `;
    }

    return currentTerm;
  }

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
