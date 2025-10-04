import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  In,
  ILike,
  IsNull,
  Between,
  Repository,
  FindOptionsOrderValue,
} from 'typeorm';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateSupervisorDto } from '@/modules/supervisor/dto/create-supervisor.dto';
import { UpdateSupervisorDto } from '@/modules/supervisor/dto/update-supervisor.dto';

import {
  SupervisorSearchType,
  SupervisorSearchTypeNames,
} from '@/modules/supervisor/enums/supervisor-search-type.enum';
import { SupervisorSearchSubType } from '@/modules/supervisor/enums/supervisor-search-sub-type.num';

import { supervisorDataFormatter } from '@/modules/supervisor/helpers/supervisor-data-formatter.helper';

import { GenderNames } from '@/common/enums/gender.enum';
import { MemberRole } from '@/common/enums/member-role.enum';
import { RelationType } from '@/common/enums/relation-type.enum';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { MaritalStatusNames } from '@/common/enums/marital-status.enum';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { InactivateMemberDto } from '@/common/dtos/inactivate-member.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { updateMinistryMember } from '@/common/helpers/update-ministry-member';
import { createMinistryMember } from '@/common/helpers/create-ministry-member';
import { getBirthDateByMonth } from '@/common/helpers/get-birth-date-by-month.helper';
import { raiseLevelMinistryMember } from '@/common/helpers/raise-level-ministry-member';
import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';
import { validationExistsChangesMinistryMember } from '@/common/helpers/validation-exists-changes-ministry-member';

import { MemberType } from '@/modules/offering/income/enums/member-type.enum';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Member } from '@/modules/member/entities/member.entity';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { MinistryMember } from '@/modules/ministry/entities/ministry-member.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';

@Injectable()
export class SupervisorService {
  private readonly logger = new Logger('CopastorService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(MinistryMember)
    private readonly ministryMemberRepository: Repository<MinistryMember>,

    @InjectRepository(Ministry)
    private readonly ministryRepository: Repository<Ministry>,

    @InjectRepository(Pastor)
    private readonly pastorRepository: Repository<Pastor>,

    @InjectRepository(Copastor)
    private readonly copastorRepository: Repository<Copastor>,

    @InjectRepository(Supervisor)
    private readonly supervisorRepository: Repository<Supervisor>,

    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,

    @InjectRepository(Preacher)
    private readonly preacherRepository: Repository<Preacher>,

    @InjectRepository(FamilyGroup)
    private readonly familyGroupRepository: Repository<FamilyGroup>,

    @InjectRepository(Disciple)
    private readonly discipleRepository: Repository<Disciple>,

    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,

    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,
  ) {}

  //* CREATE SUPERVISOR
  async create(
    createSupervisorDto: CreateSupervisorDto,
    user: User,
  ): Promise<Supervisor> {
    const {
      roles,
      theirPastorRelationDirect,
      theirPastorOnlyMinistries,
      theirCopastor,
      theirMinistries,
      relationType,
      // isDirectRelationToPastor,
    } = createSupervisorDto;

    if (!roles.includes(MemberRole.Supervisor)) {
      throw new BadRequestException(`El rol "Supervisor" deben ser incluidos.`);
    }

    if (
      roles.includes(MemberRole.Pastor) ||
      roles.includes(MemberRole.Copastor) ||
      roles.includes(MemberRole.Preacher) ||
      roles.includes(MemberRole.Disciple)
    ) {
      throw new BadRequestException(
        `Para crear un Supervisor, solo se requiere los roles: "Supervisor" o también "Tesorero."`,
      );
    }

    let copastor: Copastor | null = null;
    let pastor: Pastor | null = null;
    let church: Church | null = null;

    //? Validate and assign copastor

    //* If is direct relation to pastor is false (create with copastor)
    if (
      (relationType === RelationType.OnlyRelatedHierarchicalCover ||
        relationType ===
          RelationType.RelatedBothMinistriesAndHierarchicalCover) &&
      !theirPastorOnlyMinistries &&
      !theirPastorRelationDirect &&
      theirCopastor
    ) {
      if (!theirCopastor) {
        throw new NotFoundException(
          `Para crear un nuevo Supervisor se debe asigna un Co-Pastor.`,
        );
      }

      copastor = await this.copastorRepository.findOne({
        where: { id: theirCopastor },
        relations: ['theirPastor', 'theirChurch'],
      });

      if (!copastor) {
        throw new NotFoundException(
          `No se encontró Co-Pastor con el id: ${theirCopastor}`,
        );
      }

      if (copastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
        );
      }

      //* Validate and assign pastor according copastor
      if (!copastor?.theirPastor) {
        throw new NotFoundException(
          `Pastor no fue encontrado, verifica que Co-Pastor tenga un Pastor asignado.`,
        );
      }

      pastor = await this.pastorRepository.findOne({
        where: { id: copastor?.theirPastor?.id },
      });

      if (pastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
        );
      }

      //* Validate and assign church according copastor
      if (!copastor?.theirChurch) {
        throw new NotFoundException(
          `No se encontró la Iglesia, verifica que Co-Pastor tenga una Iglesia asignada`,
        );
      }

      church = await this.churchRepository.findOne({
        where: { id: copastor?.theirChurch?.id },
      });

      if (church?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en la Iglesia debe ser "Activo"`,
        );
      }
    }

    if (
      relationType === RelationType.OnlyRelatedMinistries &&
      !theirCopastor &&
      !theirPastorRelationDirect &&
      theirPastorOnlyMinistries
    ) {
      pastor = await this.pastorRepository.findOne({
        where: { id: theirPastorOnlyMinistries },
        relations: ['theirChurch'],
      });

      if (!pastor?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
        );
      }

      church = await this.churchRepository.findOne({
        where: { id: pastor?.theirChurch?.id },
      });

      if (!church?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
        );
      }
    }

    if (
      relationType === RelationType.RelatedDirectToPastor &&
      !theirCopastor &&
      !theirPastorOnlyMinistries &&
      theirPastorRelationDirect
    ) {
      //* Validate and assign pastor
      if (!theirPastorRelationDirect) {
        throw new NotFoundException(
          `Para crear un nuevo supervisor de forma directa, debe asignar un Pastor.`,
        );
      }

      pastor = await this.pastorRepository.findOne({
        where: { id: theirPastorRelationDirect },
        relations: ['theirChurch'],
      });

      if (!pastor) {
        throw new NotFoundException(
          `No se encontró Pastor con id: ${theirCopastor}`,
        );
      }

      if (pastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo"`,
        );
      }

      //* Validate and assign pastor according copastor
      if (!pastor?.theirChurch) {
        throw new NotFoundException(
          `No se encontró la Iglesia, verifica que el Pastor tenga una Iglesia asignada.`,
        );
      }

      church = await this.churchRepository.findOne({
        where: { id: pastor?.theirChurch?.id },
      });

      if (pastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
        );
      }
    }

    //* Create new instance member and assign to new supervisor instance
    try {
      const newMember = this.memberRepository.create({
        firstNames: createSupervisorDto.firstNames,
        lastNames: createSupervisorDto.lastNames,
        gender: createSupervisorDto.gender,
        originCountry: createSupervisorDto.originCountry,
        birthDate: createSupervisorDto.birthDate,
        maritalStatus: createSupervisorDto.maritalStatus,
        numberChildren: +createSupervisorDto.numberChildren,
        conversionDate: createSupervisorDto.conversionDate ?? null,
        email: createSupervisorDto.email ?? null,
        phoneNumber: createSupervisorDto.phoneNumber ?? null,
        residenceCountry: createSupervisorDto.residenceCountry,
        residenceDepartment: createSupervisorDto.residenceDepartment,
        residenceProvince: createSupervisorDto.residenceProvince,
        residenceDistrict: createSupervisorDto.residenceDistrict,
        residenceUrbanSector: createSupervisorDto.residenceUrbanSector,
        residenceAddress: createSupervisorDto.residenceAddress,
        referenceAddress: createSupervisorDto.referenceAddress,
        roles: createSupervisorDto.roles,
      });

      await this.memberRepository.save(newMember);

      const newSupervisor = this.supervisorRepository.create({
        member: newMember,
        // isDirectRelationToPastor: isDirectRelationToPastor,
        theirChurch: church,
        theirPastor: pastor,
        theirCopastor: copastor,
        relationType: relationType ?? null,
        createdAt: new Date(),
        createdBy: user,
      });

      //* Create Ministries
      if (theirMinistries && theirMinistries.length > 0) {
        await createMinistryMember({
          theirMinistries,
          ministryRepository: this.ministryRepository,
          ministryMemberRepository: this.ministryMemberRepository,
          newMember,
          user,
        });
      }

      return await this.supervisorRepository.save(newSupervisor);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const {
      limit,
      offset = 0,
      order = 'ASC',
      isNullZone,
      isSimpleQuery,
      churchId,
    } = paginationDto;

    if (isSimpleQuery) {
      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            recordStatus: RecordStatus.Active,
            theirZone: isNullZone ? IsNull() : null,
          },
          order: { createdAt: order as FindOptionsOrderValue },
          relations: [
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirCopastor.member',
            'theirPastor.member',
            'theirChurch',
          ],
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return supervisors;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    try {
      let church: Church;
      if (churchId) {
        church = await this.churchRepository.findOne({
          where: { id: churchId, recordStatus: RecordStatus.Active },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) {
          throw new NotFoundException(
            `Iglesia con id ${churchId} no fue encontrada.`,
          );
        }
      }

      const supervisors = await this.supervisorRepository.find({
        where: {
          theirChurch: church,
          recordStatus: RecordStatus.Active,
          theirZone: isNullZone ? IsNull() : null,
        },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'member',
          'member.ministries',
          'member.ministries.ministry',
          'member.ministries.ministry.theirChurch',
          'theirChurch',
          'theirPastor.member',
          'theirCopastor.member',
          'familyGroups',
          'theirZone',
          'preachers.member',
          'disciples.member',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (supervisors.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return supervisorDataFormatter({ supervisors }) as any;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* FIND BY TERM
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<Supervisor[]> {
    const {
      searchType,
      searchSubType,
      limit,
      offset = 0,
      order,
      isNullZone = 'false',
      churchId,
    } = searchTypeAndPaginationDto;

    if (!term) {
      throw new BadRequestException(`El termino de búsqueda es requerido.`);
    }

    if (!searchType) {
      throw new BadRequestException(`El tipo de búsqueda es requerido.`);
    }

    //* Search Church
    let church: Church;
    if (churchId) {
      church = await this.churchRepository.findOne({
        where: { id: churchId, recordStatus: RecordStatus.Active },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (!church) {
        throw new NotFoundException(
          `Iglesia con id ${churchId} no fue encontrada.`,
        );
      }
    }

    //? Find by first name --> Many
    //* Supervisors by supervisor names
    if (
      term &&
      searchType === SupervisorSearchType.FirstNames &&
      searchSubType === SupervisorSearchSubType.BySupervisorFirstNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              firstNames: ILike(`%${firstNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con estos nombres: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Supervisors by co-pastor names
    if (
      term &&
      searchType === SupervisorSearchType.FirstNames &&
      searchSubType === SupervisorSearchSubType.SupervisorByCopastorFirstNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              firstNames: ILike(`%${firstNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const copastorsId = copastors.map((copastor) => copastor?.id);

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            theirCopastor: In(copastorsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con los nombres de su co-pastor: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Supervisors by pastor names
    if (
      term &&
      searchType === SupervisorSearchType.FirstNames &&
      searchSubType === SupervisorSearchSubType.SupervisorByPastorFirstNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              firstNames: ILike(`%${firstNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const pastorsId = pastors.map((pastor) => pastor?.id);

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            theirPastor: In(pastorsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con los nombres de su pastor: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by last name --> Many
    //* Supervisors by last names
    if (
      term &&
      searchType === SupervisorSearchType.LastNames &&
      searchSubType === SupervisorSearchSubType.BySupervisorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              lastNames: ILike(`%${lastNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con estos apellidos: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Supervisors by co-pastor last names
    if (
      term &&
      searchType === SupervisorSearchType.LastNames &&
      searchSubType === SupervisorSearchSubType.SupervisorByCopastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              lastNames: ILike(`%${lastNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const copastorsId = copastors.map((copastor) => copastor?.id);

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            theirCopastor: In(copastorsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con los apellidos de su co-pastor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Supervisors by pastor last names
    if (
      term &&
      searchType === SupervisorSearchType.LastNames &&
      searchSubType === SupervisorSearchSubType.SupervisorByPastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              lastNames: ILike(`%${lastNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const pastorsId = pastors.map((pastor) => pastor?.id);

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            theirPastor: In(pastorsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con los apellidos de su pastor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by full name --> Many
    //* Supervisors by full names
    if (
      term &&
      searchType === SupervisorSearchType.FullNames &&
      searchSubType === SupervisorSearchSubType.BySupervisorFullNames
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              firstNames: ILike(`%${firstNames}%`),
              lastNames: ILike(`%${lastNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con estos nombres y apellidos: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Supervisors by co-pastor full names
    if (
      term &&
      searchType === SupervisorSearchType.FullNames &&
      searchSubType === SupervisorSearchSubType.SupervisorByCopastorFullNames
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              firstNames: ILike(`%${firstNames}%`),
              lastNames: ILike(`%${lastNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const copastorsId = copastors.map((copastor) => copastor?.id);

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            theirCopastor: In(copastorsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con los nombres y apellidos de su co-pastor: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Supervisors by pastor full names
    if (
      term &&
      searchType === SupervisorSearchType.FullNames &&
      searchSubType === SupervisorSearchSubType.SupervisorByPastorFullNames
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              firstNames: ILike(`%${firstNames}%`),
              lastNames: ILike(`%${lastNames}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const pastorsId = pastors.map((pastor) => pastor?.id);

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            theirPastor: In(pastorsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con los nombres y apellidos de su pastor: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by birth date --> Many
    if (term && searchType === SupervisorSearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      try {
        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const fromDate = new Date(fromTimestamp);
        const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              birthDate: Between(fromDate, toDate),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron supervisores(as) con este rango de fechas de nacimiento: ${fromDate} - ${toDate} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by month birth --> Many
    if (term && searchType === SupervisorSearchType.BirthMonth) {
      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const resultSupervisors = getBirthDateByMonth({
          month: term,
          data: supervisors,
        });

        if (resultSupervisors.length === 0) {
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

          const monthInSpanish = monthNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron supervisores(as) con este mes de nacimiento: ${monthInSpanish} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({
          supervisors: resultSupervisors as Supervisor[],
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by zone name --> Many
    if (term && searchType === SupervisorSearchType.ZoneName) {
      try {
        const zones = await this.zoneRepository.find({
          where: {
            theirChurch: church,
            zoneName: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const zonesId = zones.map((zone) => zone?.id);

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            theirZone: In(zonesId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con este nombre de zona: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by gender --> Many
    if (term && searchType === SupervisorSearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      try {
        if (!validGenders.includes(genderTerm)) {
          throw new BadRequestException(`Género no válido: ${term}`);
        }

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              gender: genderTerm,
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          const genderInSpanish = GenderNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron supervisores(as) con este género: ${genderInSpanish} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by marital status --> Many
    if (term && searchType === SupervisorSearchType.MaritalStatus) {
      const maritalStatusTerm = term.toLowerCase();
      const validMaritalStatus = [
        'single',
        'married',
        'widowed',
        'divorced',
        'other',
      ];

      try {
        if (!validMaritalStatus.includes(maritalStatusTerm)) {
          throw new BadRequestException(`Estado Civil no válido: ${term}`);
        }

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              maritalStatus: maritalStatusTerm,
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          const maritalStatusInSpanish =
            MaritalStatusNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron supervisores(as) con este estado civil: ${maritalStatusInSpanish} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by origin country --> Many
    if (term && searchType === SupervisorSearchType.OriginCountry) {
      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              originCountry: ILike(`%${term}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con este país de origen: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence country --> Many
    if (term && searchType === SupervisorSearchType.ResidenceCountry) {
      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              residenceCountry: ILike(`%${term}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con este país de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence department --> Many
    if (term && searchType === SupervisorSearchType.ResidenceDepartment) {
      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              residenceDepartment: ILike(`%${term}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con este departamento de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence province --> Many
    if (term && searchType === SupervisorSearchType.ResidenceProvince) {
      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              residenceProvince: ILike(`%${term}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervises(as) con esta provincia de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence district --> Many
    if (term && searchType === SupervisorSearchType.ResidenceDistrict) {
      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              residenceDistrict: ILike(`%${term}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con este distrito de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence urban sector --> Many
    if (term && searchType === SupervisorSearchType.ResidenceUrbanSector) {
      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              residenceUrbanSector: ILike(`%${term}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con este sector urbano de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence address --> Many
    if (term && searchType === SupervisorSearchType.ResidenceAddress) {
      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              residenceAddress: ILike(`%${term}%`),
            },
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          throw new NotFoundException(
            `No se encontraron supervisores(as) con esta dirección de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by status --> Many
    if (term && searchType === SupervisorSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      try {
        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            recordStatus: recordStatusTerm,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'familyGroups',
            'theirZone',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (supervisors.length === 0) {
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron supervisores(as) con este estado de registro: ${value} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return supervisorDataFormatter({ supervisors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by copastor id --> Many
    if (term && searchType === SupervisorSearchType.CopastorId) {
      try {
        const copastor = await this.copastorRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const supervisors = await this.supervisorRepository.find({
          where: {
            theirCopastor: copastor,
            theirZone: isNullZone ? IsNull() : null,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
          relations: ['member', 'theirZone'],
        });

        return supervisors;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //! General Exceptions
    if (
      term &&
      !Object.values(SupervisorSearchType).includes(
        searchType as SupervisorSearchType,
      )
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(SupervisorSearchTypeNames).join(', ')}`,
      );
    }

    if (
      term &&
      (SupervisorSearchType.FirstNames ||
        SupervisorSearchType.LastNames ||
        SupervisorSearchType.FullNames) &&
      !searchSubType
    ) {
      throw new BadRequestException(
        `Para buscar por nombres o apellidos el sub-tipo es requerido.`,
      );
    }
  }

  //* UPDATE SUPERVISOR
  async update(
    id: string,
    updateSupervisorDto: UpdateSupervisorDto,
    user: User,
  ): Promise<Supervisor | Copastor> {
    const {
      roles,
      recordStatus,
      relationType,
      theirPastorRelationDirect,
      theirPastorOnlyMinistries,
      theirCopastor,
      theirMinistries,
      // isDirectRelationToPastor,
      memberInactivationReason,
      memberInactivationCategory,
    } = updateSupervisorDto;

    if (!roles) {
      throw new BadRequestException(
        `Los roles son requeridos para actualizar el Supervisor.`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    //* Validation supervisor
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: id },
      relations: [
        'theirCopastor',
        'theirPastor',
        'theirChurch',
        'member',
        'member.ministries',
        'member.ministries.ministry',
        'member.ministries.ministry.theirChurch',
      ],
    });

    if (!supervisor) {
      throw new NotFoundException(
        `Supervisor con id: ${id} no fue encontrado.`,
      );
    }

    if (!roles.some((role) => ['supervisor', 'copastor'].includes(role))) {
      throw new BadRequestException(
        `Los roles deben incluir "Supervisor" o "Co-Pastor".`,
      );
    }

    if (
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        !supervisor.member.roles.includes(MemberRole.Treasurer) &&
        (roles.includes(MemberRole.Pastor) ||
          roles.includes(MemberRole.Preacher) ||
          roles.includes(MemberRole.Disciple))) ||
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        supervisor.member.roles.includes(MemberRole.Treasurer) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        (roles.includes(MemberRole.Pastor) ||
          roles.includes(MemberRole.Preacher) ||
          roles.includes(MemberRole.Disciple)))
    ) {
      throw new BadRequestException(
        `No se puede asignar un rol inferior o superior sin pasar por la jerarquía: [discípulo, predicador, supervisor, copastor, pastor].`,
      );
    }

    //* Update info about Supervisor
    if (
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        !supervisor.member.roles.includes(MemberRole.Treasurer) &&
        roles.includes(MemberRole.Supervisor) &&
        !roles.includes(MemberRole.Disciple) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Preacher) &&
        !roles.includes(MemberRole.Treasurer)) ||
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        supervisor.member.roles.includes(MemberRole.Treasurer) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        roles.includes(MemberRole.Supervisor) &&
        roles.includes(MemberRole.Treasurer) &&
        !roles.includes(MemberRole.Disciple) &&
        !roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Preacher)) ||
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        !supervisor.member.roles.includes(MemberRole.Treasurer) &&
        roles.includes(MemberRole.Supervisor) &&
        roles.includes(MemberRole.Treasurer) &&
        !roles.includes(MemberRole.Disciple) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Preacher)) ||
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        supervisor.member.roles.includes(MemberRole.Treasurer) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        roles.includes(MemberRole.Supervisor) &&
        !roles.includes(MemberRole.Disciple) &&
        !roles.includes(MemberRole.Treasurer) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Preacher))
    ) {
      if (
        supervisor?.recordStatus === RecordStatus.Active &&
        recordStatus === RecordStatus.Inactive
      ) {
        throw new BadRequestException(
          `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
        );
      }

      //? UPDATE WITH COPASTOR
      if (
        !theirPastorOnlyMinistries &&
        !theirPastorOnlyMinistries &&
        theirCopastor &&
        (relationType === RelationType.OnlyRelatedHierarchicalCover ||
          relationType ===
            RelationType.RelatedBothMinistriesAndHierarchicalCover)
      ) {
        //* Validate copastor
        if (!theirCopastor) {
          throw new NotFoundException(
            `Para poder actualizar un Supervisor relacionado jerarquicamente o con ministerios, se le debe asignar un Co-Pastor.`,
          );
        }

        const newCopastor = await this.copastorRepository.findOne({
          where: { id: theirCopastor },
          relations: ['theirPastor', 'theirChurch'],
        });

        if (!newCopastor) {
          throw new NotFoundException(
            `Co-Pastor con id: ${theirCopastor} no fue encontrado.`,
          );
        }

        if (newCopastor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
          );
        }

        //* Validate Pastor according copastor
        if (!newCopastor?.theirPastor) {
          throw new BadRequestException(
            `No se encontró el Pastor, verifica que Co-Pastor tenga un Pastor asignado.`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: newCopastor?.theirPastor?.id },
        });

        if (newPastor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
          );
        }

        //* Validate Church according copastor
        if (!newCopastor?.theirChurch) {
          throw new BadRequestException(
            `No se encontró la Iglesia, verifica que Co-Pastor tenga una Iglesia asignado.`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newCopastor?.theirChurch?.id },
        });

        if (newChurch?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        //* Update and save
        let savedMember: Member;
        try {
          const updatedMember = await this.memberRepository.preload({
            id: supervisor.member.id,
            firstNames: updateSupervisorDto.firstNames,
            lastNames: updateSupervisorDto.lastNames,
            gender: updateSupervisorDto.gender,
            originCountry: updateSupervisorDto.originCountry,
            birthDate: updateSupervisorDto.birthDate,
            maritalStatus: updateSupervisorDto.maritalStatus,
            numberChildren: +updateSupervisorDto.numberChildren,
            conversionDate: updateSupervisorDto.conversionDate ?? null,
            email: updateSupervisorDto.email ?? null,
            phoneNumber: updateSupervisorDto.phoneNumber ?? null,
            residenceCountry: updateSupervisorDto.residenceCountry,
            residenceDepartment: updateSupervisorDto.residenceDepartment,
            residenceProvince: updateSupervisorDto.residenceProvince,
            residenceDistrict: updateSupervisorDto.residenceDistrict,
            residenceUrbanSector: updateSupervisorDto.residenceUrbanSector,
            residenceAddress: updateSupervisorDto.residenceAddress,
            referenceAddress: updateSupervisorDto.referenceAddress,
            roles: updateSupervisorDto.roles,
          });

          savedMember = await this.memberRepository.save(updatedMember);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        let savedSupervisor: Supervisor;
        try {
          let updatedSupervisor: Supervisor;

          if (supervisor?.theirCopastor?.id !== theirCopastor) {
            updatedSupervisor = await this.supervisorRepository.preload({
              id: supervisor.id,
              member: savedMember,
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: newCopastor,
              // isDirectRelationToPastor: isDirectRelationToPastor,
              updatedAt: new Date(),
              updatedBy: user,
              relationType: relationType ?? null,
              inactivationCategory:
                recordStatus === RecordStatus.Active
                  ? null
                  : memberInactivationCategory,
              inactivationReason:
                recordStatus === RecordStatus.Active
                  ? null
                  : memberInactivationReason,
              recordStatus: recordStatus,
            });
          } else {
            updatedSupervisor = await this.supervisorRepository.preload({
              id: supervisor.id,
              member: savedMember,
              theirChurch: supervisor.theirChurch,
              theirPastor: supervisor.theirPastor,
              theirCopastor: supervisor.theirCopastor,
              relationType: relationType ?? null,
              // isDirectRelationToPastor: isDirectRelationToPastor,
              updatedAt: new Date(),
              updatedBy: user,
              inactivationCategory:
                recordStatus === RecordStatus.Active
                  ? null
                  : memberInactivationCategory,
              inactivationReason:
                recordStatus === RecordStatus.Active
                  ? null
                  : memberInactivationReason,
              recordStatus: recordStatus,
            });
          }

          //* Validate if there is any equal record or deleted records
          const hasChangesInMinistries = validationExistsChangesMinistryMember({
            memberEntity: supervisor,
            theirMinistries,
          });

          //* Update Ministry Member
          if (hasChangesInMinistries) {
            await updateMinistryMember({
              theirMinistries,
              ministryRepository: this.ministryRepository,
              ministryMemberRepository: this.ministryMemberRepository,
              savedMember,
              user,
            });
          }

          savedSupervisor =
            await this.supervisorRepository.save(updatedSupervisor);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        //? Update in subordinate relations
        if (supervisor?.theirCopastor?.id !== theirCopastor) {
          const allZones = await this.zoneRepository.find({
            relations: ['theirSupervisor'],
          });
          const allPreachers = await this.preacherRepository.find({
            relations: ['theirSupervisor'],
          });
          const allFamilyGroups = await this.familyGroupRepository.find({
            relations: ['theirSupervisor'],
          });
          const allDisciples = await this.discipleRepository.find({
            relations: ['theirSupervisor'],
          });

          try {
            //* Update and set new relationships in Zone
            const zonesBySupervisor = allZones.filter(
              (zone) => zone?.theirSupervisor?.id === supervisor?.id,
            );

            await Promise.all(
              zonesBySupervisor.map(async (zone) => {
                await this.zoneRepository.update(zone?.id, {
                  theirChurch: newChurch,
                  theirPastor: newPastor,
                  theirCopastor: newCopastor,
                  updatedAt: new Date(),
                  updatedBy: user,
                });
              }),
            );

            //* Update and set new relationships in Preacher
            const preachersBySupervisor = allPreachers.filter(
              (preacher) => preacher?.theirSupervisor?.id === supervisor?.id,
            );

            await Promise.all(
              preachersBySupervisor.map(async (preacher) => {
                await this.preacherRepository.update(preacher?.id, {
                  theirChurch: newChurch,
                  theirPastor: newPastor,
                  theirCopastor: newCopastor,
                  updatedAt: new Date(),
                  updatedBy: user,
                });
              }),
            );

            //* Update and set new relationships in Family Group
            const familyGroupsBySupervisor = allFamilyGroups.filter(
              (familyGroup) =>
                familyGroup?.theirSupervisor?.id === supervisor?.id,
            );

            await Promise.all(
              familyGroupsBySupervisor.map(async (familyGroup) => {
                await this.familyGroupRepository.update(familyGroup?.id, {
                  theirChurch: newChurch,
                  theirPastor: newPastor,
                  theirCopastor: newCopastor,
                  updatedAt: new Date(),
                  updatedBy: user,
                });
              }),
            );

            //* Update and set new relationships in Disciple
            const disciplesBySupervisor = allDisciples.filter(
              (disciple) => disciple?.theirSupervisor?.id === supervisor?.id,
            );

            await Promise.all(
              disciplesBySupervisor.map(async (disciple) => {
                await this.discipleRepository.update(disciple?.id, {
                  theirChurch: newChurch,
                  theirPastor: newPastor,
                  theirCopastor: newCopastor,
                  updatedAt: new Date(),
                  updatedBy: user,
                });
              }),
            );
          } catch (error) {
            this.handleDBExceptions(error);
          }
        }

        return savedSupervisor;
      }

      //? RELATION TYPE WITH ONLY MINISTRIES
      if (relationType === RelationType.OnlyRelatedMinistries) {
        //* Validate family Group
        if (!theirPastorOnlyMinistries) {
          throw new NotFoundException(
            `Para poder actualizar un Supervisor relacionado a Ministerios, se debe asignar un Pastor.`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: theirPastorOnlyMinistries },
          relations: ['theirChurch'],
        });

        if (!newPastor) {
          throw new NotFoundException(
            `Pastor con id: ${theirPastorOnlyMinistries} no fue encontrado.`,
          );
        }

        if (!newPastor?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Grupo Familiar debe ser "Activo".`,
          );
        }

        //* Validate Church according family Group
        if (!newPastor?.theirChurch) {
          throw new BadRequestException(
            `No se encontró la Iglesia, verifica que Grupo Familiar tenga una Iglesia asignada.`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newPastor?.theirChurch?.id },
        });

        if (!newChurch?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        //* Update and save
        let savedMember: Member;
        try {
          const updatedMember = await this.memberRepository.preload({
            id: supervisor.member.id,
            firstNames: updateSupervisorDto.firstNames,
            lastNames: updateSupervisorDto.lastNames,
            gender: updateSupervisorDto.gender,
            originCountry: updateSupervisorDto.originCountry,
            birthDate: updateSupervisorDto.birthDate,
            maritalStatus: updateSupervisorDto.maritalStatus,
            numberChildren: +updateSupervisorDto.numberChildren,
            conversionDate: updateSupervisorDto.conversionDate ?? null,
            email: updateSupervisorDto.email ?? null,
            phoneNumber: updateSupervisorDto.phoneNumber ?? null,
            residenceCountry: updateSupervisorDto.residenceCountry,
            residenceDepartment: updateSupervisorDto.residenceDepartment,
            residenceProvince: updateSupervisorDto.residenceProvince,
            residenceDistrict: updateSupervisorDto.residenceDistrict,
            residenceUrbanSector: updateSupervisorDto.residenceUrbanSector,
            residenceAddress: updateSupervisorDto.residenceAddress,
            referenceAddress: updateSupervisorDto.referenceAddress,
            roles: updateSupervisorDto.roles,
          });

          savedMember = await this.memberRepository.save(updatedMember);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        try {
          let updatedSupervisor: Supervisor;
          if (supervisor?.theirPastor?.id !== theirPastorOnlyMinistries) {
            updatedSupervisor = await this.supervisorRepository.preload({
              id: supervisor.id,
              member: savedMember,
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: null,
              theirZone: null,
              relationType: relationType ?? null,
              updatedAt: new Date(),
              updatedBy: user,
              inactivationCategory:
                recordStatus === RecordStatus.Active
                  ? null
                  : memberInactivationCategory,
              inactivationReason:
                recordStatus === RecordStatus.Active
                  ? null
                  : memberInactivationReason,
              recordStatus: recordStatus,
            });
          } else {
            updatedSupervisor = await this.supervisorRepository.preload({
              id: supervisor.id,
              member: savedMember,
              theirChurch: supervisor.theirChurch,
              theirPastor: supervisor.theirPastor,
              theirCopastor: null,
              theirZone: null,
              relationType: relationType ?? null,
              updatedAt: new Date(),
              updatedBy: user,
              inactivationCategory:
                recordStatus === RecordStatus.Active
                  ? null
                  : memberInactivationCategory,
              inactivationReason:
                recordStatus === RecordStatus.Active
                  ? null
                  : memberInactivationReason,
              recordStatus: recordStatus,
            });
          }

          //* Validate if there is any equal record or deleted records
          const hasChangesInMinistries = validationExistsChangesMinistryMember({
            memberEntity: supervisor,
            theirMinistries,
          });

          //* Update Ministry Member
          if (hasChangesInMinistries) {
            await updateMinistryMember({
              theirMinistries,
              ministryRepository: this.ministryRepository,
              ministryMemberRepository: this.ministryMemberRepository,
              savedMember,
              user,
            });
          }

          //? Update in subordinate relations
          if (supervisor?.theirPastor?.id !== theirPastorOnlyMinistries) {
            const allZones = await this.zoneRepository.find({
              relations: ['theirSupervisor'],
            });
            const allPreachers = await this.preacherRepository.find({
              relations: ['theirSupervisor'],
            });
            const allFamilyGroups = await this.familyGroupRepository.find({
              relations: ['theirSupervisor'],
            });
            const allDisciples = await this.discipleRepository.find({
              relations: ['theirSupervisor'],
            });

            try {
              //* Update and set new relationships in Zone
              const zonesBySupervisor = allZones.filter(
                (zone) => zone?.theirSupervisor?.id === supervisor?.id,
              );

              await Promise.all(
                zonesBySupervisor.map(async (zone) => {
                  await this.zoneRepository.update(zone?.id, {
                    theirSupervisor: null,
                    updatedAt: new Date(),
                    updatedBy: user,
                  });
                }),
              );

              //* Update and set new relationships in Preacher
              const preachersBySupervisor = allPreachers.filter(
                (preacher) => preacher?.theirSupervisor?.id === supervisor?.id,
              );

              await Promise.all(
                preachersBySupervisor.map(async (preacher) => {
                  await this.preacherRepository.update(preacher?.id, {
                    theirSupervisor: null,
                    updatedAt: new Date(),
                    updatedBy: user,
                  });
                }),
              );

              //* Update and set new relationships in Family Group
              const familyGroupsBySupervisor = allFamilyGroups.filter(
                (familyGroup) =>
                  familyGroup?.theirSupervisor?.id === supervisor?.id,
              );

              await Promise.all(
                familyGroupsBySupervisor.map(async (familyGroup) => {
                  await this.familyGroupRepository.update(familyGroup?.id, {
                    theirSupervisor: null,
                    updatedAt: new Date(),
                    updatedBy: user,
                  });
                }),
              );

              //* Update and set new relationships in Disciple
              const disciplesBySupervisor = allDisciples.filter(
                (disciple) => disciple?.theirSupervisor?.id === supervisor?.id,
              );

              await Promise.all(
                disciplesBySupervisor.map(async (disciple) => {
                  await this.discipleRepository.update(disciple?.id, {
                    theirSupervisor: null,
                    updatedAt: new Date(),
                    updatedBy: user,
                  });
                }),
              );
            } catch (error) {
              this.handleDBExceptions(error);
            }
          }

          return await this.supervisorRepository.save(updatedSupervisor);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //? UPDATE WITH DIRECT RELATION TO PASTOR
      if (relationType === RelationType.RelatedDirectToPastor) {
        //* Validate pastor
        if (!theirPastorRelationDirect) {
          throw new NotFoundException(
            `Para vincular directamente un Supervisor con un Pastor, debe asignar un Pastor.`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: theirPastorRelationDirect },
          relations: ['theirChurch'],
        });

        if (!newPastor) {
          throw new NotFoundException(
            `Pastor con id: ${theirPastorRelationDirect} no fue encontrado.`,
          );
        }

        if (newPastor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
          );
        }

        //* Validate Church according pastor
        if (!newPastor?.theirChurch) {
          throw new BadRequestException(
            `No se encontró la Iglesia, verifica que Pastor tenga una Iglesia asignado.`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newPastor?.theirChurch?.id },
        });

        if (newChurch?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        //* Update and save
        let savedMember: Member;
        try {
          const updatedMember = await this.memberRepository.preload({
            id: supervisor.member.id,
            firstNames: updateSupervisorDto.firstNames,
            lastNames: updateSupervisorDto.lastNames,
            gender: updateSupervisorDto.gender,
            originCountry: updateSupervisorDto.originCountry,
            birthDate: updateSupervisorDto.birthDate,
            maritalStatus: updateSupervisorDto.maritalStatus,
            numberChildren: +updateSupervisorDto.numberChildren,
            conversionDate: updateSupervisorDto.conversionDate ?? null,
            email: updateSupervisorDto.email ?? null,
            phoneNumber: updateSupervisorDto.phoneNumber ?? null,
            residenceCountry: updateSupervisorDto.residenceCountry,
            residenceDepartment: updateSupervisorDto.residenceDepartment,
            residenceProvince: updateSupervisorDto.residenceProvince,
            residenceDistrict: updateSupervisorDto.residenceDistrict,
            residenceUrbanSector: updateSupervisorDto.residenceUrbanSector,
            residenceAddress: updateSupervisorDto.residenceAddress,
            referenceAddress: updateSupervisorDto.referenceAddress,
            roles: updateSupervisorDto.roles,
          });

          savedMember = await this.memberRepository.save(updatedMember);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        let savedSupervisor: Supervisor;
        try {
          let updatedSupervisor: Supervisor;

          if (supervisor?.theirPastor?.id !== theirPastorOnlyMinistries) {
            updatedSupervisor = await this.supervisorRepository.preload({
              id: supervisor.id,
              member: savedMember,
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: null,
              theirZone: null,
              relationType: relationType ?? null,
              updatedAt: new Date(),
              updatedBy: user,
              inactivationCategory:
                recordStatus === RecordStatus.Active
                  ? null
                  : memberInactivationCategory,
              inactivationReason:
                recordStatus === RecordStatus.Active
                  ? null
                  : memberInactivationReason,
              recordStatus: recordStatus,
            });
          } else {
            updatedSupervisor = await this.supervisorRepository.preload({
              id: supervisor.id,
              member: savedMember,
              theirChurch: supervisor.theirChurch,
              theirPastor: supervisor.theirPastor,
              theirCopastor: null,
              theirZone: null,
              relationType: relationType ?? null,
              updatedAt: new Date(),
              updatedBy: user,
              inactivationCategory:
                recordStatus === RecordStatus.Active
                  ? null
                  : memberInactivationCategory,
              inactivationReason:
                recordStatus === RecordStatus.Active
                  ? null
                  : memberInactivationReason,
              recordStatus: recordStatus,
            });
          }

          //* Validate if there is any equal record or deleted records
          const hasChangesInMinistries = validationExistsChangesMinistryMember({
            memberEntity: supervisor,
            theirMinistries,
          });

          //* Update Ministry Member
          if (hasChangesInMinistries) {
            await updateMinistryMember({
              theirMinistries,
              ministryRepository: this.ministryRepository,
              ministryMemberRepository: this.ministryMemberRepository,
              savedMember,
              user,
            });
          }

          savedSupervisor =
            await this.supervisorRepository.save(updatedSupervisor);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        if (supervisor?.theirPastor?.id !== theirPastorRelationDirect) {
          const allZones = await this.zoneRepository.find({
            relations: ['theirSupervisor'],
          });
          const allPreachers = await this.preacherRepository.find({
            relations: ['theirSupervisor'],
          });
          const allFamilyGroups = await this.familyGroupRepository.find({
            relations: ['theirSupervisor'],
          });
          const allDisciples = await this.discipleRepository.find({
            relations: ['theirSupervisor'],
          });

          try {
            //* Update and set new relationships in Zone
            const zonesBySupervisor = allZones.filter(
              (zone) => zone?.theirSupervisor?.id === supervisor?.id,
            );

            await Promise.all(
              zonesBySupervisor.map(async (zone) => {
                await this.zoneRepository.update(zone?.id, {
                  theirSupervisor: null,
                  updatedAt: new Date(),
                  updatedBy: user,
                });
              }),
            );

            //* Update and set new relationships in Preacher
            const preachersBySupervisor = allPreachers.filter(
              (preacher) => preacher?.theirSupervisor?.id === supervisor?.id,
            );

            await Promise.all(
              preachersBySupervisor.map(async (preacher) => {
                await this.preacherRepository.update(preacher?.id, {
                  theirSupervisor: null,
                  updatedAt: new Date(),
                  updatedBy: user,
                });
              }),
            );

            //* Update and set new relationships in Family Group
            const familyGroupsBySupervisor = allFamilyGroups.filter(
              (familyGroup) =>
                familyGroup?.theirSupervisor?.id === supervisor?.id,
            );

            await Promise.all(
              familyGroupsBySupervisor.map(async (familyGroup) => {
                await this.familyGroupRepository.update(familyGroup?.id, {
                  theirSupervisor: null,
                  updatedAt: new Date(),
                  updatedBy: user,
                });
              }),
            );

            //* Update and set new relationships in Disciple
            const disciplesBySupervisor = allDisciples.filter(
              (disciple) => disciple?.theirSupervisor?.id === supervisor?.id,
            );

            await Promise.all(
              disciplesBySupervisor.map(async (disciple) => {
                await this.discipleRepository.update(disciple?.id, {
                  theirSupervisor: null,
                  updatedAt: new Date(),
                  updatedBy: user,
                });
              }),
            );
          } catch (error) {
            this.handleDBExceptions(error);
          }
        }

        return savedSupervisor;
      }
    }

    //* Raise Supervisor level to Co-pastor
    if (
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Treasurer) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Disciple) &&
        !roles.includes(MemberRole.Treasurer) &&
        !roles.includes(MemberRole.Supervisor) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Preacher) &&
        recordStatus === RecordStatus.Active) ||
      (supervisor.member.roles.includes(MemberRole.Supervisor) &&
        supervisor.member.roles.includes(MemberRole.Treasurer) &&
        !supervisor.member.roles.includes(MemberRole.Disciple) &&
        !supervisor.member.roles.includes(MemberRole.Copastor) &&
        !supervisor.member.roles.includes(MemberRole.Preacher) &&
        !supervisor.member.roles.includes(MemberRole.Pastor) &&
        roles.includes(MemberRole.Copastor) &&
        !roles.includes(MemberRole.Disciple) &&
        !roles.includes(MemberRole.Treasurer) &&
        !roles.includes(MemberRole.Supervisor) &&
        !roles.includes(MemberRole.Pastor) &&
        !roles.includes(MemberRole.Preacher) &&
        recordStatus === RecordStatus.Active)
    ) {
      //* Validation new pastor
      if (!theirPastorRelationDirect) {
        // as simple theirPastor
        throw new NotFoundException(
          `Para subir de nivel de Supervisor a Co-Pastor, debe asignar un Pastor.`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: theirPastorRelationDirect },
        relations: ['theirChurch'],
      });

      if (!newPastor) {
        throw new NotFoundException(`Pastor con id: ${id} no fue encontrado.`);
      }

      if (newPastor?.recordStatus === RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
        );
      }

      //* Validation new church according pastor
      if (!newPastor?.theirChurch) {
        throw new BadRequestException(
          `No se encontró la Iglesia, verifica que Pastor tenga una Iglesia asignado.`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newPastor?.theirChurch?.id },
        relations: ['theirMainChurch'],
      });

      if (newChurch?.recordStatus === RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
        );
      }

      //* Create new instance Copastor and delete old Supervisor
      try {
        const savedMember = await this.memberRepository.preload({
          id: supervisor.member.id,
          firstNames: updateSupervisorDto.firstNames,
          lastNames: updateSupervisorDto.lastNames,
          gender: updateSupervisorDto.gender,
          originCountry: updateSupervisorDto.originCountry,
          birthDate: updateSupervisorDto.birthDate,
          maritalStatus: updateSupervisorDto.maritalStatus,
          numberChildren: +updateSupervisorDto.numberChildren,
          conversionDate: updateSupervisorDto.conversionDate ?? null,
          email: updateSupervisorDto.email ?? null,
          phoneNumber: updateSupervisorDto.phoneNumber ?? null,
          residenceCountry: updateSupervisorDto.residenceCountry,
          residenceDepartment: updateSupervisorDto.residenceDepartment,
          residenceProvince: updateSupervisorDto.residenceProvince,
          residenceDistrict: updateSupervisorDto.residenceDistrict,
          residenceUrbanSector: updateSupervisorDto.residenceUrbanSector,
          residenceAddress: updateSupervisorDto.residenceAddress,
          referenceAddress: updateSupervisorDto.referenceAddress,
          roles: updateSupervisorDto.roles,
        });

        await this.memberRepository.save(savedMember);

        const newCopastor = this.copastorRepository.create({
          member: savedMember,
          theirChurch: newChurch,
          theirPastor: newPastor,
          relationType:
            theirMinistries.length > 0
              ? RelationType.RelatedBothMinistriesAndHierarchicalCover
              : RelationType.OnlyRelatedHierarchicalCover,
          createdAt: new Date(),
          createdBy: user,
        });

        //* Raise level ministries of member
        if (theirMinistries.length > 0) {
          await raiseLevelMinistryMember({
            theirMinistries,
            savedMember,
            ministryRepository: this.ministryRepository,
            ministryMemberRepository: this.ministryMemberRepository,
            user,
          });
        }

        const savedCopastor = await this.copastorRepository.save(newCopastor);

        //! Find and replace with the new id and change member type
        const offeringsByOldSupervisor =
          await this.offeringIncomeRepository.find({
            where: {
              supervisor: {
                id: supervisor.id,
              },
            },
          });

        await Promise.all(
          offeringsByOldSupervisor.map(async (offering) => {
            await this.offeringIncomeRepository.update(offering?.id, {
              supervisor: null,
              memberType: MemberType.Copastor,
              copastor: savedCopastor,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );

        await this.supervisorRepository.remove(supervisor); // onDelete subordinate entities (null)

        return savedCopastor;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    } else {
      throw new BadRequestException(
        `No se puede subir de nivel este Supervisor, el modo debe ser "Activo", el rol debe ser: ["supervisor"], revisar y actualizar el registro.`,
      );
    }
  }

  //! INACTIVATE SUPERVISOR
  async remove(
    id: string,
    inactivateMemberDto: InactivateMemberDto,
    user: User,
  ): Promise<void> {
    const { memberInactivationCategory, memberInactivationReason } =
      inactivateMemberDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const supervisor = await this.supervisorRepository.findOneBy({ id });

    if (!supervisor) {
      throw new NotFoundException(
        `Supervisor con id: ${id} no fue encontrado.`,
      );
    }

    //* Update and set in Inactive on Supervisor
    try {
      const updatedSupervisor = await this.supervisorRepository.preload({
        id: supervisor.id,
        updatedAt: new Date(),
        updatedBy: user,
        inactivationCategory: memberInactivationCategory,
        inactivationReason: memberInactivationReason,
        recordStatus: RecordStatus.Inactive,
      });

      await this.supervisorRepository.save(updatedSupervisor);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    const allZones = await this.zoneRepository.find({
      relations: ['theirSupervisor'],
    });
    const allPreachers = await this.preacherRepository.find({
      relations: ['theirSupervisor'],
    });
    const allFamilyGroup = await this.familyGroupRepository.find({
      relations: ['theirSupervisor'],
    });
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirSupervisor'],
    });

    try {
      //* Update and set to null relationships in Zone
      const zonesBySupervisor = allZones.filter(
        (zone) => zone?.theirSupervisor?.id === supervisor?.id,
      );

      await Promise.all(
        zonesBySupervisor.map(async (zone) => {
          await this.zoneRepository.update(zone?.id, {
            theirSupervisor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Preacher
      const preachersBySupervisor = allPreachers.filter(
        (preacher) => preacher?.theirSupervisor?.id === supervisor?.id,
      );

      await Promise.all(
        preachersBySupervisor.map(async (preacher) => {
          await this.preacherRepository.update(preacher?.id, {
            theirSupervisor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Family Group
      const familyGroupsBySupervisor = allFamilyGroup.filter(
        (familyGroup) => familyGroup?.theirSupervisor?.id === supervisor?.id,
      );

      await Promise.all(
        familyGroupsBySupervisor.map(async (familyGroup) => {
          await this.familyGroupRepository.update(familyGroup?.id, {
            theirSupervisor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Disciple
      const disciplesBySupervisor = allDisciples.filter(
        (disciple) => disciple?.theirSupervisor?.id === supervisor?.id,
      );

      await Promise.all(
        disciplesBySupervisor.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirSupervisor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any): never {
    if (error.code === '23505') {
      const detail = error.detail;

      if (detail.includes('email')) {
        throw new BadRequestException('El correo electrónico ya está en uso.');
      }
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
