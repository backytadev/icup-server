import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  In,
  Raw,
  ILike,
  Between,
  Repository,
  FindOptionsOrderValue,
} from 'typeorm';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';

import { GenderNames } from '@/common/enums/gender.enum';
import { MemberRole } from '@/common/enums/member-role.enum';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { RelationType } from '@/common/enums/relation-type.enum';
import { MaritalStatusNames } from '@/common/enums/marital-status.enum';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { InactivateMemberDto } from '@/common/dtos/inactivate-member.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { getBirthDateByMonth } from '@/common/helpers/get-birth-date-by-month.helper';
import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';

import {
  DiscipleSearchType,
  DiscipleSearchTypeNames,
} from '@/modules/disciple/enums/disciple-search-type.enum';
import { DiscipleSearchSubType } from '@/modules/disciple/enums/disciple-search-sub-type.enum';

import { discipleDataFormatter } from '@/modules/disciple/helpers/disciple-data-formatter.helper';

import { CreateDiscipleDto } from '@/modules/disciple/dto/create-disciple.dto';
import { UpdateDiscipleDto } from '@/modules/disciple/dto/update-disciple.dto';

import { MemberType } from '@/modules/offering/income/enums/member-type.enum';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Member } from '@/modules/member/entities/member.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { MinistryMember } from '@/modules/ministry/entities/ministry-member.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';

@Injectable()
export class DiscipleService {
  private readonly logger = new Logger('DiscipleService');

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

  //* CREATE DISCIPLE
  async create(
    createDiscipleDto: CreateDiscipleDto,
    user: User,
  ): Promise<Disciple> {
    const {
      roles,
      theirFamilyGroup,
      theirMinistries,
      relationType,
      theirPastor,
    } = createDiscipleDto;

    if (!roles.includes(MemberRole.Disciple)) {
      throw new BadRequestException(`El rol "Discípulo" debe ser incluido.`);
    }

    if (
      roles.includes(MemberRole.Pastor) ||
      roles.includes(MemberRole.Copastor) ||
      roles.includes(MemberRole.Preacher) ||
      roles.includes(MemberRole.Supervisor) ||
      roles.includes(MemberRole.Treasurer)
    ) {
      throw new BadRequestException(
        `Para crear un Discípulo, solo se requiere el rol: "Discípulo"`,
      );
    }

    let familyGroup: FamilyGroup | null = null;
    let preacher = null;
    let zone = null;
    let supervisor = null;
    let copastor = null;
    let pastor = null;
    let church = null;

    //* Si viene theirFamilyGroup, validar todas las relaciones
    if (theirFamilyGroup) {
      familyGroup = await this.familyGroupRepository.findOne({
        where: { id: theirFamilyGroup },
        relations: [
          'theirChurch',
          'theirPastor.member',
          'theirCopastor.member',
          'theirSupervisor.member',
          'theirZone',
          'theirPreacher.member',
        ],
      });

      if (!familyGroup) {
        throw new NotFoundException(
          `Grupo familiar con id: ${theirFamilyGroup}, no fue encontrado.`,
        );
      }

      if (!familyGroup?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Grupo familiar debe ser "Activo".`,
        );
      }

      //? Validaciones condicionales
      if (!familyGroup?.theirPreacher) {
        throw new NotFoundException(
          `Predicador no fue encontrado, verifica que Grupo Familiar tenga un Predicador asignado.`,
        );
      }
      preacher = await this.preacherRepository.findOne({
        where: { id: familyGroup.theirPreacher.id },
      });
      if (!preacher?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Predicador debe ser "Activo".`,
        );
      }

      if (!familyGroup?.theirZone) {
        throw new NotFoundException(
          `Zona no fue encontrada, verifica que Grupo Familiar tenga una Zona asignada.`,
        );
      }
      zone = await this.zoneRepository.findOne({
        where: { id: familyGroup.theirZone.id },
      });
      if (!zone?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Zona debe ser "Activo".`,
        );
      }

      if (!familyGroup?.theirSupervisor) {
        throw new NotFoundException(
          `Supervisor no fue encontrado, verifica que Grupo Familiar tenga un Supervisor asignado.`,
        );
      }
      supervisor = await this.supervisorRepository.findOne({
        where: { id: familyGroup.theirSupervisor.id },
      });
      if (!supervisor?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
        );
      }

      if (!familyGroup?.theirCopastor) {
        throw new NotFoundException(
          `Co-Pastor no fue encontrado, verifica que Grupo Familiar tenga un Co-Pastor asignado.`,
        );
      }
      copastor = await this.copastorRepository.findOne({
        where: { id: familyGroup.theirCopastor.id },
      });
      if (!copastor?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
        );
      }

      if (!familyGroup?.theirPastor) {
        throw new NotFoundException(
          `Pastor no fue encontrado, verifica que Grupo Familiar tenga un Pastor asignado.`,
        );
      }
      pastor = await this.pastorRepository.findOne({
        where: { id: familyGroup.theirPastor.id },
      });
      if (!pastor?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
        );
      }

      if (!familyGroup?.theirChurch) {
        throw new NotFoundException(
          `Iglesia no fue encontrada, verifica que Grupo Familiar tenga una Iglesia asignada.`,
        );
      }

      church = await this.churchRepository.findOne({
        where: { id: familyGroup.theirChurch.id },
      });

      if (!church?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
        );
      }
    }

    if (!theirFamilyGroup) {
      pastor = await this.pastorRepository.findOne({
        where: { id: theirPastor },
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

    //* Crear miembro base
    try {
      const newMember = this.memberRepository.create({
        firstNames: createDiscipleDto.firstNames,
        lastNames: createDiscipleDto.lastNames,
        gender: createDiscipleDto.gender,
        originCountry: createDiscipleDto.originCountry,
        birthDate: createDiscipleDto.birthDate,
        maritalStatus: createDiscipleDto.maritalStatus,
        numberChildren: +createDiscipleDto.numberChildren,
        conversionDate: createDiscipleDto.conversionDate ?? null,
        email: createDiscipleDto.email ?? null,
        phoneNumber: createDiscipleDto.phoneNumber ?? null,
        residenceCountry: createDiscipleDto.residenceCountry,
        residenceDepartment: createDiscipleDto.residenceDepartment,
        residenceProvince: createDiscipleDto.residenceProvince,
        residenceDistrict: createDiscipleDto.residenceDistrict,
        residenceUrbanSector: createDiscipleDto.residenceUrbanSector,
        residenceAddress: createDiscipleDto.residenceAddress,
        referenceAddress: createDiscipleDto.referenceAddress,
        roles: createDiscipleDto.roles,
      });

      await this.memberRepository.save(newMember);

      const newDisciple = this.discipleRepository.create({
        member: newMember,
        theirChurch: church ?? null,
        theirPastor: pastor ?? null,
        theirCopastor: copastor ?? null,
        theirSupervisor: supervisor ?? null,
        theirZone: zone ?? null,
        theirPreacher: preacher ?? null,
        theirFamilyGroup: familyGroup ?? null,
        relationType: relationType ?? null,
        createdAt: new Date(),
        createdBy: user,
      });

      //* Ministries (opcional)
      if (theirMinistries && theirMinistries.length > 0) {
        const ministryMembers = await Promise.all(
          theirMinistries.map(async (ministryData) => {
            const ministry = await this.ministryRepository.findOne({
              where: { id: ministryData?.ministryId },
            });

            if (!ministry?.recordStatus) {
              throw new BadRequestException(
                `La propiedad "Estado de registro" en el Ministerio debe ser "Activo".`,
              );
            }

            return this.ministryMemberRepository.create({
              member: newMember,
              memberRoles: newMember.roles,
              ministryRoles: ministryData.ministryRoles,
              ministry: ministry,
              createdAt: new Date(),
              createdBy: user,
            });
          }),
        );

        await this.ministryMemberRepository.save(ministryMembers);
      }

      return await this.discipleRepository.save(newDisciple);
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
      isSimpleQuery,
      churchId,
    } = paginationDto;

    if (isSimpleQuery) {
      try {
        const disciples = await this.discipleRepository.find({
          where: { recordStatus: RecordStatus.Active },
          order: { createdAt: order as FindOptionsOrderValue },
          relations: ['member'],
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return disciples;
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

      const disciples = await this.discipleRepository.find({
        where: { theirChurch: church, recordStatus: RecordStatus.Active },
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
          'theirSupervisor.member',
          'theirZone',
          'theirPreacher.member',
          'theirFamilyGroup',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (disciples.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return discipleDataFormatter({ disciples }) as any;
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
  ): Promise<Disciple[]> {
    const {
      searchType,
      searchSubType,
      limit,
      offset = 0,
      order,
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
    //* Disciple by disciple names
    if (
      term &&
      searchType === DiscipleSearchType.FirstNames &&
      searchSubType === DiscipleSearchSubType.ByDiscipleFirstNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const disciples = await this.discipleRepository.find({
          where: {
            theirChurch: church,
            member: {
              // firstNames: ILike(`%${firstNames}%`),
              firstNames: Raw(
                (alias) =>
                  `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
                { searchTerm: `%${firstNames.toLowerCase()}%` },
              ),
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los nombres: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Disciples by preacher names
    if (
      term &&
      searchType === DiscipleSearchType.FirstNames &&
      searchSubType === DiscipleSearchSubType.DiscipleByPreacherFirstNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const preachers = await this.preacherRepository.find({
          where: {
            theirChurch: church,
            member: {
              // firstNames: ILike(`%${firstNames}%`),
              firstNames: Raw(
                (alias) =>
                  `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
                { searchTerm: `%${firstNames.toLowerCase()}%` },
              ),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const preachersId = preachers.map((preacher) => preacher?.id);

        const disciples = await this.discipleRepository.find({
          where: {
            theirChurch: church,
            theirPreacher: In(preachersId),
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los nombres de su predicador: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Disciples by supervisor names
    if (
      term &&
      searchType === DiscipleSearchType.FirstNames &&
      searchSubType === DiscipleSearchSubType.DiscipleBySupervisorFirstNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              // firstNames: ILike(`%${firstNames}%`),
              firstNames: Raw(
                (alias) =>
                  `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
                { searchTerm: `%${firstNames.toLowerCase()}%` },
              ),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const supervisorsId = supervisors.map((supervisor) => supervisor?.id);

        const disciples = await this.discipleRepository.find({
          where: {
            theirChurch: church,
            theirSupervisor: In(supervisorsId),
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los nombres de su supervisor: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Disciples by co-pastor names
    if (
      term &&
      searchType === DiscipleSearchType.FirstNames &&
      searchSubType === DiscipleSearchSubType.DiscipleByCopastorFirstNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              // firstNames: ILike(`%${firstNames}%`),
              firstNames: Raw(
                (alias) =>
                  `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
                { searchTerm: `%${firstNames.toLowerCase()}%` },
              ),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const copastorsId = copastors.map((copastor) => copastor?.id);

        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los nombres de su co-pastor: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Disciples by pastor names
    if (
      term &&
      searchType === DiscipleSearchType.FirstNames &&
      searchSubType === DiscipleSearchSubType.DiscipleByPastorFirstNames
    ) {
      const firstNames = term.replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              // firstNames: ILike(`%${firstNames}%`),
              firstNames: Raw(
                (alias) =>
                  `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
                { searchTerm: `%${firstNames.toLowerCase()}%` },
              ),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const pastorsId = pastors.map((pastor) => pastor?.id);

        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los nombres de su pastor: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by last name --> Many
    //* Disciples by last names
    if (
      term &&
      searchType === DiscipleSearchType.LastNames &&
      searchSubType === DiscipleSearchSubType.ByDiscipleLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const disciples = await this.discipleRepository.find({
          where: {
            theirChurch: church,
            member: {
              // lastNames: ILike(`%${lastNames}%`),
              lastNames: Raw(
                (alias) =>
                  `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
                { searchTerm: `%${lastNames.toLowerCase()}%` },
              ),
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los apellidos: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Disciples by preacher last names
    if (
      term &&
      searchType === DiscipleSearchType.LastNames &&
      searchSubType === DiscipleSearchSubType.DiscipleByPreacherLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const preachers = await this.preacherRepository.find({
          where: {
            theirChurch: church,
            member: {
              // lastNames: ILike(`%${lastNames}%`),
              lastNames: Raw(
                (alias) =>
                  `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
                { searchTerm: `%${lastNames.toLowerCase()}%` },
              ),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const preacherId = preachers.map((preacher) => preacher?.id);

        const disciples = await this.discipleRepository.find({
          where: {
            theirChurch: church,
            theirPreacher: In(preacherId),
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los apellidos de su predicador: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Disciples by supervisor last names
    if (
      term &&
      searchType === DiscipleSearchType.LastNames &&
      searchSubType === DiscipleSearchSubType.DiscipleBySupervisorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const supervisors = await this.supervisorRepository.find({
          where: {
            theirChurch: church,
            member: {
              // lastNames: ILike(`%${lastNames}%`),
              lastNames: Raw(
                (alias) =>
                  `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
                { searchTerm: `%${lastNames.toLowerCase()}%` },
              ),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const supervisorsId = supervisors.map((supervisor) => supervisor?.id);

        const disciples = await this.discipleRepository.find({
          where: {
            theirChurch: church,
            theirSupervisor: In(supervisorsId),
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los apellidos de su supervisor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Disciples by co-pastor last names
    if (
      term &&
      searchType === DiscipleSearchType.LastNames &&
      searchSubType === DiscipleSearchSubType.DiscipleByCopastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const copastors = await this.copastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              // lastNames: ILike(`%${lastNames}%`),
              lastNames: Raw(
                (alias) =>
                  `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
                { searchTerm: `%${lastNames.toLowerCase()}%` },
              ),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const copastorsId = copastors.map((copastor) => copastor?.id);

        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los apellidos de su co-pastor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Disciples by pastor last names
    if (
      term &&
      searchType === DiscipleSearchType.LastNames &&
      searchSubType === DiscipleSearchSubType.DiscipleByPastorLastNames
    ) {
      const lastNames = term.replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository.find({
          where: {
            theirChurch: church,
            member: {
              // lastNames: ILike(`%${lastNames}%`),
              lastNames: Raw(
                (alias) =>
                  `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
                { searchTerm: `%${lastNames.toLowerCase()}%` },
              ),
            },
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const pastorsId = pastors.map((pastor) => pastor?.id);

        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los apellidos de su pastor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by full name --> Many
    //* Disciples by full names
    if (
      term &&
      searchType === DiscipleSearchType.FullNames &&
      searchSubType === DiscipleSearchSubType.ByDiscipleFullNames
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const disciples = await this.discipleRepository
          .createQueryBuilder('disciple')
          .leftJoinAndSelect('disciple.updatedBy', 'updatedBy')
          .leftJoinAndSelect('disciple.createdBy', 'createdBy')
          .leftJoinAndSelect('disciple.member', 'member')
          .leftJoinAndSelect('member.ministries', 'memberMinistries')
          .leftJoinAndSelect('memberMinistries.ministry', 'ministry')
          .leftJoinAndSelect('ministry.theirChurch', 'ministryChurch')
          .leftJoinAndSelect('disciple.theirChurch', 'theirChurch')
          .leftJoinAndSelect('disciple.theirPastor', 'theirPastor')
          .leftJoinAndSelect('theirPastor.member', 'pastorMember')
          .leftJoinAndSelect('disciple.theirCopastor', 'theirCopastor')
          .leftJoinAndSelect('theirCopastor.member', 'copastorMember')
          .leftJoinAndSelect('disciple.theirSupervisor', 'theirSupervisor')
          .leftJoinAndSelect('theirSupervisor.member', 'supervisorMember')
          .leftJoinAndSelect('disciple.theirPreacher', 'theirPreacher')
          .leftJoinAndSelect('theirPreacher.member', 'preacherMember')
          .leftJoinAndSelect('disciple.theirZone', 'zone')
          .leftJoinAndSelect('disciple.theirFamilyGroup', 'familyGroup')
          .where('disciple.theirChurch = :churchId', { churchId: church.id })
          .andWhere('disciple.recordStatus = :status', {
            status: RecordStatus.Active,
          })
          .andWhere(
            'unaccent(lower(member.firstNames)) ILIKE unaccent(lower(:first))',
            { first: `%${firstNames.toLowerCase()}%` },
          )
          .andWhere(
            'unaccent(lower(member.lastNames)) ILIKE unaccent(lower(:last))',
            { last: `%${lastNames.toLowerCase()}%` },
          )
          .orderBy('disciple.createdAt', order as 'ASC' | 'DESC')
          .take(limit)
          .skip(offset)
          .getMany();

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los nombres y apellidos: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Disciples by preacher full names
    if (
      term &&
      searchType === DiscipleSearchType.FullNames &&
      searchSubType === DiscipleSearchSubType.DiscipleByPreacherFullNames
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const preachers = await this.preacherRepository
          .createQueryBuilder('preacher')
          .leftJoin('preacher.member', 'member')
          .where('preacher.theirChurch = :churchId', { churchId: church.id })
          .andWhere('preacher.recordStatus = :status', {
            status: RecordStatus.Active,
          })
          .andWhere(
            'unaccent(lower(member.firstNames)) ILIKE unaccent(lower(:first))',
            { first: `%${firstNames.toLowerCase()}%` },
          )
          .andWhere(
            'unaccent(lower(member.lastNames)) ILIKE unaccent(lower(:last))',
            { last: `%${lastNames.toLowerCase()}%` },
          )
          .orderBy('preacher.createdAt', order as 'ASC' | 'DESC')
          .getMany();

        const preachersId = preachers.map((preacher) => preacher?.id);

        const disciples = await this.discipleRepository.find({
          where: {
            theirChurch: church,
            theirPreacher: In(preachersId),
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los nombres y apellidos de su predicador: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Disciples by supervisor full names
    if (
      term &&
      searchType === DiscipleSearchType.FullNames &&
      searchSubType === DiscipleSearchSubType.DiscipleBySupervisorFullNames
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const supervisors = await this.supervisorRepository
          .createQueryBuilder('supervisor')
          .leftJoin('supervisor.member', 'member')
          .where('supervisor.theirChurch = :churchId', { churchId: church.id })
          .andWhere('supervisor.recordStatus = :status', {
            status: RecordStatus.Active,
          })
          .andWhere(
            'unaccent(lower(member.firstNames)) ILIKE unaccent(lower(:first))',
            { first: `%${firstNames.toLowerCase()}%` },
          )
          .andWhere(
            'unaccent(lower(member.lastNames)) ILIKE unaccent(lower(:last))',
            { last: `%${lastNames.toLowerCase()}%` },
          )
          .orderBy('supervisor.createdAt', order as 'ASC' | 'DESC')
          .getMany();

        const supervisorsId = supervisors.map((supervisor) => supervisor?.id);

        const disciples = await this.discipleRepository.find({
          where: {
            theirChurch: church,
            theirSupervisor: In(supervisorsId),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member.ministries',
            'member.ministries.ministry',
            'member.ministries.ministry.theirChurch',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los nombres y apellidos de su supervisor: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Disciples by co-pastor full names
    if (
      term &&
      searchType === DiscipleSearchType.FullNames &&
      searchSubType === DiscipleSearchSubType.DiscipleByCopastorFullNames
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const copastors = await this.copastorRepository
          .createQueryBuilder('copastor')
          .leftJoin('copastor.member', 'member')
          .where('copastor.theirChurch = :churchId', { churchId: church.id })
          .andWhere('copastor.recordStatus = :status', {
            status: RecordStatus.Active,
          })
          .andWhere(
            'unaccent(lower(member.firstNames)) ILIKE unaccent(lower(:first))',
            { first: `%${firstNames.toLowerCase()}%` },
          )
          .andWhere(
            'unaccent(lower(member.lastNames)) ILIKE unaccent(lower(:last))',
            { last: `%${lastNames.toLowerCase()}%` },
          )
          .orderBy('copastor.createdAt', order as 'ASC' | 'DESC')
          .getMany();

        const copastorsId = copastors.map((copastor) => copastor?.id);

        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los nombres y apellidos de su co-pastor: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Disciples by pastor full names
    if (
      term &&
      searchType === DiscipleSearchType.FullNames &&
      searchSubType === DiscipleSearchSubType.DiscipleByPastorFullNames
    ) {
      const firstNames = term.split('-')[0].replace(/\+/g, ' ');
      const lastNames = term.split('-')[1].replace(/\+/g, ' ');

      try {
        const pastors = await this.pastorRepository
          .createQueryBuilder('pastor')
          .leftJoin('pastor.member', 'member')
          .where('pastor.theirChurch = :churchId', { churchId: church.id })
          .andWhere('pastor.recordStatus = :status', {
            status: RecordStatus.Active,
          })
          .andWhere(
            'unaccent(lower(member.firstNames)) ILIKE unaccent(lower(:first))',
            { first: `%${firstNames.toLowerCase()}%` },
          )
          .andWhere(
            'unaccent(lower(member.lastNames)) ILIKE unaccent(lower(:last))',
            { last: `%${lastNames.toLowerCase()}%` },
          )
          .orderBy('pastor.createdAt', order as 'ASC' | 'DESC')
          .getMany();

        const pastorsId = pastors.map((pastor) => pastor?.id);

        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con los nombres y apellidos de su pastor: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by birth date --> Many
    if (term && searchType === DiscipleSearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const fromDate = new Date(fromTimestamp);
      const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

      try {
        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron discípulos con este rango de fechas de nacimiento: ${fromDate} - ${toDate} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by month birth --> Many
    if (term && searchType === DiscipleSearchType.BirthMonth) {
      try {
        const disciples = await this.discipleRepository.find({
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
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const resultDisciples = getBirthDateByMonth({
          month: term,
          data: disciples,
        });

        if (resultDisciples.length === 0) {
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
            `No se encontraron discípulos con este mes de nacimiento: ${monthInSpanish} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({
          disciples: resultDisciples as Disciple[],
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by family-group-code --> Many
    if (term && searchType === DiscipleSearchType.FamilyGroupCode) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
          where: {
            theirChurch: church,
            // familyGroupCode: ILike(`%${term}%`),
            familyGroupCode: Raw(
              (alias) =>
                `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
              { searchTerm: `%${term.toLowerCase()}%` },
            ),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const familyGroupsId = familyGroups.map(
          (familyGroup) => familyGroup?.id,
        );

        const disciples = await this.discipleRepository.find({
          where: {
            theirChurch: church,
            theirFamilyGroup: In(familyGroupsId),
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
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con este código de grupo familiar: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by family-group-name --> Many
    if (term && searchType === DiscipleSearchType.FamilyGroupName) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
          where: {
            theirChurch: church,
            // familyGroupName: ILike(`%${term}%`),
            familyGroupName: Raw(
              (alias) =>
                `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
              { searchTerm: `%${term.toLowerCase()}%` },
            ),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const familyGroupsId = familyGroups.map(
          (familyGroup) => familyGroup?.id,
        );

        const disciples = await this.discipleRepository.find({
          where: {
            theirChurch: church,
            theirFamilyGroup: In(familyGroupsId),
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con este nombre de grupo familiar: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by zone --> Many
    if (term && searchType === DiscipleSearchType.ZoneName) {
      try {
        const zones = await this.zoneRepository.find({
          where: {
            theirChurch: church,
            // zoneName: ILike(`%${term}%`),
            zoneName: Raw(
              (alias) =>
                `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
              { searchTerm: `%${term.toLowerCase()}%` },
            ),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const zonesId = zones.map((zone) => zone?.id);

        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con este nombre de zona: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by gender --> Many
    if (term && searchType === DiscipleSearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      if (!validGenders.includes(genderTerm)) {
        throw new BadRequestException(`Género no válido: ${term}`);
      }

      try {
        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          const genderInSpanish = GenderNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron discípulos con este género: ${genderInSpanish} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by marital status --> Many
    if (term && searchType === DiscipleSearchType.MaritalStatus) {
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

      try {
        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          const maritalStatusInSpanish =
            MaritalStatusNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron discípulos con este estado civil: ${maritalStatusInSpanish} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by origin country --> Many
    if (term && searchType === DiscipleSearchType.OriginCountry) {
      try {
        const disciples = await this.discipleRepository.find({
          where: {
            theirChurch: church,
            member: {
              // originCountry: ILike(`%${term}%`),
              originCountry: Raw(
                (alias) =>
                  `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
                { searchTerm: `%${term.toLowerCase()}%` },
              ),
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con este país de origen: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence country --> Many
    if (term && searchType === DiscipleSearchType.ResidenceCountry) {
      try {
        const disciples = await this.discipleRepository.find({
          where: {
            theirChurch: church,
            member: {
              // residenceCountry: ILike(`%${term}%`),
              residenceCountry: Raw(
                (alias) =>
                  `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
                { searchTerm: `%${term.toLowerCase()}%` },
              ),
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con este país de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence department --> Many
    if (term && searchType === DiscipleSearchType.ResidenceDepartment) {
      try {
        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con este departamento de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence province --> Many
    if (term && searchType === DiscipleSearchType.ResidenceProvince) {
      try {
        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con esta provincia de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence district --> Many
    if (term && searchType === DiscipleSearchType.ResidenceDistrict) {
      try {
        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con este distrito de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence urban sector --> Many
    if (term && searchType === DiscipleSearchType.ResidenceUrbanSector) {
      try {
        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con este sector urbano de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence address --> Many
    if (term && searchType === DiscipleSearchType.ResidenceAddress) {
      try {
        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          throw new NotFoundException(
            `No se encontraron discípulos con esta dirección de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by status --> Many
    if (term && searchType === DiscipleSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      try {
        const disciples = await this.discipleRepository.find({
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
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'theirFamilyGroup',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (disciples.length === 0) {
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron discípulos con este estado de registro: ${value} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return discipleDataFormatter({ disciples }) as any;
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
      !Object.values(DiscipleSearchType).includes(
        searchType as DiscipleSearchType,
      )
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(DiscipleSearchTypeNames).join(', ')}`,
      );
    }

    if (
      term &&
      (DiscipleSearchType.FirstNames ||
        DiscipleSearchType.LastNames ||
        DiscipleSearchType.FullNames) &&
      !searchSubType
    ) {
      throw new BadRequestException(
        `Para buscar por nombres o apellidos el sub-tipo es requerido.`,
      );
    }
  }

  //* UPDATE DISCIPLE
  async update(
    id: string,
    updateDiscipleDto: UpdateDiscipleDto,
    user: User,
  ): Promise<Disciple | Preacher> {
    const {
      roles,
      recordStatus,
      theirSupervisor,
      theirFamilyGroup,
      theirPastor,
      relationType,
      memberInactivationReason,
      memberInactivationCategory,
      theirMinistries,
    } = updateDiscipleDto;

    if (!roles) {
      throw new BadRequestException(
        `Los roles son requeridos para actualizar el Discípulo.`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const disciple = await this.discipleRepository.findOne({
      where: { id: id },
      relations: [
        'member',
        'member.ministries',
        'member.ministries.ministry',
        'member.ministries.ministry.theirChurch',
        'theirChurch',
        'theirPastor.member',
        'theirCopastor.member',
        'theirSupervisor.member',
        'theirPreacher.member',
        'theirZone',
        'theirFamilyGroup',
      ],
    });

    if (!disciple) {
      throw new NotFoundException(`Discípulo con id: ${id} no fue encontrado.`);
    }

    if (!roles.some((role) => ['disciple', 'preacher'].includes(role))) {
      throw new BadRequestException(
        `Los roles deben incluir "Discípulo" o "Predicador".`,
      );
    }

    if (
      disciple.member.roles.includes(MemberRole.Disciple) &&
      !disciple.member.roles.includes(MemberRole.Preacher) &&
      !disciple.member.roles.includes(MemberRole.Preacher) &&
      !disciple.member.roles.includes(MemberRole.Copastor) &&
      !disciple.member.roles.includes(MemberRole.Pastor) &&
      !disciple.member.roles.includes(MemberRole.Treasurer) &&
      (roles.includes(MemberRole.Copastor) ||
        roles.includes(MemberRole.Pastor) ||
        roles.includes(MemberRole.Supervisor))
    ) {
      throw new BadRequestException(
        `No se puede asignar un rol superior sin pasar por la jerarquía: [discípulo, predicador, supervisor, copastor, pastor].`,
      );
    }

    //* Update info about Disciple
    if (
      disciple.member.roles.includes(MemberRole.Disciple) &&
      !disciple.member.roles.includes(MemberRole.Preacher) &&
      !disciple.member.roles.includes(MemberRole.Pastor) &&
      !disciple.member.roles.includes(MemberRole.Copastor) &&
      !disciple.member.roles.includes(MemberRole.Supervisor) &&
      !disciple.member.roles.includes(MemberRole.Treasurer) &&
      roles.includes(MemberRole.Disciple) &&
      !roles.includes(MemberRole.Preacher) &&
      !roles.includes(MemberRole.Pastor) &&
      !roles.includes(MemberRole.Copastor) &&
      !roles.includes(MemberRole.Supervisor) &&
      !roles.includes(MemberRole.Treasurer)
    ) {
      if (
        disciple?.recordStatus === RecordStatus.Active &&
        recordStatus === RecordStatus.Inactive
      ) {
        throw new BadRequestException(
          `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
        );
      }

      //* RELATION TYPE WITH FAMILY GROUP
      //? Update if their Family Group is different
      if (
        disciple?.theirFamilyGroup?.id !== theirFamilyGroup &&
        (relationType === RelationType.OnlyRelatedHierarchicalCover ||
          relationType ===
            RelationType.RelatedBothMinistriesAndHierarchicalCover)
      ) {
        //* Validate family Group
        if (!theirFamilyGroup) {
          throw new NotFoundException(
            `Para poder actualizar un Discípulo relacionado jerarquicamente o con ministerios, se debe asignar un Grupo familiar.`,
          );
        }

        const newFamilyGroup = await this.familyGroupRepository.findOne({
          where: { id: theirFamilyGroup },
          relations: [
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirPreacher.member',
            'theirZone',
          ],
        });

        if (!newFamilyGroup) {
          throw new NotFoundException(
            `Grupo familiar con id: ${theirFamilyGroup} no fue encontrado.`,
          );
        }

        if (!newFamilyGroup?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Grupo Familiar debe ser "Activo".`,
          );
        }

        //* Validate Preacher according family Group
        if (!newFamilyGroup?.theirPreacher) {
          throw new BadRequestException(
            `No se encontró el Predicador, verifica que Grupo Familiar tenga una Predicador asignado.`,
          );
        }

        const newPreacher = await this.preacherRepository.findOne({
          where: { id: newFamilyGroup?.theirPreacher?.id },
        });

        if (!newPreacher?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Predicador debe ser "Activo".`,
          );
        }

        //* Validate Supervisor according family Group
        if (!newFamilyGroup?.theirSupervisor) {
          throw new BadRequestException(
            `No se encontró el Supervisor, verifica que Grupo Familiar tenga una Supervisor asignado.`,
          );
        }

        const newSupervisor = await this.supervisorRepository.findOne({
          where: { id: newFamilyGroup?.theirSupervisor?.id },
        });

        if (!newSupervisor?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
          );
        }

        //* Validate Zone according family Group
        if (!newFamilyGroup?.theirZone) {
          throw new BadRequestException(
            `No se encontró la Zona, verifica que Grupo Familiar tenga una Zona asignada.`,
          );
        }

        const newZone = await this.zoneRepository.findOne({
          where: { id: newFamilyGroup?.theirZone?.id },
        });

        if (!newZone?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Zona debe ser "Activo".`,
          );
        }

        //* Validate Copastor according family Group
        if (!newFamilyGroup?.theirCopastor) {
          throw new BadRequestException(
            `No se encontró el Co-Pastor, verifica que Grupo Familiar tenga un Co-Pastor asignado.`,
          );
        }

        const newCopastor = await this.copastorRepository.findOne({
          where: { id: newFamilyGroup?.theirCopastor?.id },
        });

        if (!newCopastor?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
          );
        }

        //* Validate Pastor according family Group
        if (!newFamilyGroup?.theirPastor) {
          throw new BadRequestException(
            `No se encontró el Pastor, verifica que Grupo Familiar tenga una Pastor asignado.`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: newFamilyGroup?.theirPastor?.id },
        });

        if (!newPastor?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
          );
        }

        //* Validate Church according family Group
        if (!newFamilyGroup?.theirChurch) {
          throw new BadRequestException(
            `No se encontró la Iglesia, verifica que Grupo Familiar tenga una Iglesia asignada.`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newFamilyGroup?.theirChurch?.id },
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
            id: disciple.member.id,
            firstNames: updateDiscipleDto.firstNames,
            lastNames: updateDiscipleDto.lastNames,
            gender: updateDiscipleDto.gender,
            originCountry: updateDiscipleDto.originCountry,
            birthDate: updateDiscipleDto.birthDate,
            maritalStatus: updateDiscipleDto.maritalStatus,
            numberChildren: +updateDiscipleDto.numberChildren,
            conversionDate: updateDiscipleDto.conversionDate ?? null,
            email: updateDiscipleDto.email ?? null,
            phoneNumber: updateDiscipleDto.phoneNumber ?? null,
            residenceCountry: updateDiscipleDto.residenceCountry,
            residenceDepartment: updateDiscipleDto.residenceDepartment,
            residenceProvince: updateDiscipleDto.residenceProvince,
            residenceDistrict: updateDiscipleDto.residenceDistrict,
            residenceUrbanSector: updateDiscipleDto.residenceUrbanSector,
            residenceAddress: updateDiscipleDto.residenceAddress,
            referenceAddress: updateDiscipleDto.referenceAddress,
            roles: updateDiscipleDto.roles,
          });

          savedMember = await this.memberRepository.save(updatedMember);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        try {
          const updatedDisciple = await this.discipleRepository.preload({
            id: disciple.id,
            member: savedMember,
            theirChurch: newChurch,
            theirPastor: newPastor,
            theirCopastor: newCopastor,
            theirSupervisor: newSupervisor,
            theirPreacher: newPreacher,
            theirZone: newZone,
            theirFamilyGroup: newFamilyGroup,
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

          //* Validate if there is any equal record or deleted records
          const existingMinistryIds =
            disciple.member?.ministries?.map((m) => m.ministry.id) ?? [];
          const newMinistryIds = theirMinistries.map((m) => m.ministryId);

          const hasChangesInMinistries =
            theirMinistries.some((newMinistry) => {
              const existing = disciple.member?.ministries?.find(
                (m) => m.ministry.id === newMinistry.ministryId,
              );

              if (!existing) return true;

              const existingRoles = [...existing.ministryRoles].sort();
              const newRoles = [...newMinistry.ministryRoles].sort();

              return (
                existingRoles.length !== newRoles.length ||
                existingRoles.some((role, idx) => role !== newRoles[idx])
              );
            }) ||
            existingMinistryIds.some((id) => !newMinistryIds.includes(id));

          //* Create Ministry Member
          if (hasChangesInMinistries) {
            const currentMinistryMembers =
              await this.ministryMemberRepository.find({
                where: { member: { id: savedMember.id } },
                relations: ['ministry'],
              });

            const newMinistryIds = theirMinistries.map((m) => m.ministryId);

            const toRemove = currentMinistryMembers.filter(
              (mm) => !newMinistryIds.includes(mm.ministry.id),
            );

            if (toRemove.length > 0) {
              await this.ministryMemberRepository.remove(toRemove);
            }

            const ministryMembers = await Promise.all(
              theirMinistries.map(async (ministryData) => {
                const ministry = await this.ministryRepository.findOne({
                  where: { id: ministryData?.ministryId },
                });

                if (!ministry?.recordStatus) {
                  throw new BadRequestException(
                    `La propiedad "Estado de registro" en el Ministerio debe ser "Activo".`,
                  );
                }

                const existingMember =
                  await this.ministryMemberRepository.findOne({
                    where: {
                      member: { id: savedMember.id },
                      ministry: { id: ministry.id },
                    },
                  });

                if (existingMember) {
                  existingMember.ministryRoles = ministryData.ministryRoles;
                  existingMember.updatedAt = new Date();
                  existingMember.updatedBy = user;
                  return existingMember;
                }

                return this.ministryMemberRepository.create({
                  member: savedMember,
                  memberRoles: savedMember.roles,
                  ministryRoles: ministryData.ministryRoles,
                  ministry: ministry,
                  createdAt: new Date(),
                  createdBy: user,
                });
              }),
            );

            await this.ministryMemberRepository.save(
              ministryMembers.filter(Boolean),
            );
          }

          return await this.discipleRepository.save(updatedDisciple);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //* RELATION TYPE WITH PASTOR
      //? Update if their Pastor is different
      if (theirPastor && relationType === RelationType.OnlyRelatedMinistries) {
        //* Validate family Group
        if (!theirPastor) {
          throw new NotFoundException(
            `Para poder actualizar un Discípulo relacionado a Ministerios, se debe asignar un Pastor.`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: theirPastor },
          relations: ['theirChurch'],
        });

        if (!newPastor) {
          throw new NotFoundException(
            `Pastor con id: ${theirPastor} no fue encontrado.`,
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
            id: disciple.member.id,
            firstNames: updateDiscipleDto.firstNames,
            lastNames: updateDiscipleDto.lastNames,
            gender: updateDiscipleDto.gender,
            originCountry: updateDiscipleDto.originCountry,
            birthDate: updateDiscipleDto.birthDate,
            maritalStatus: updateDiscipleDto.maritalStatus,
            numberChildren: +updateDiscipleDto.numberChildren,
            conversionDate: updateDiscipleDto.conversionDate ?? null,
            email: updateDiscipleDto.email ?? null,
            phoneNumber: updateDiscipleDto.phoneNumber ?? null,
            residenceCountry: updateDiscipleDto.residenceCountry,
            residenceDepartment: updateDiscipleDto.residenceDepartment,
            residenceProvince: updateDiscipleDto.residenceProvince,
            residenceDistrict: updateDiscipleDto.residenceDistrict,
            residenceUrbanSector: updateDiscipleDto.residenceUrbanSector,
            residenceAddress: updateDiscipleDto.residenceAddress,
            referenceAddress: updateDiscipleDto.referenceAddress,
            roles: updateDiscipleDto.roles,
          });

          savedMember = await this.memberRepository.save(updatedMember);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        try {
          const updatedDisciple = await this.discipleRepository.preload({
            id: disciple.id,
            member: savedMember,
            theirChurch: newChurch,
            theirPastor: newPastor,
            theirCopastor: null,
            theirSupervisor: null,
            theirZone: null,
            theirPreacher: null,
            theirFamilyGroup: null,
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

          //* Validate if there is any equal record or deleted records
          const existingMinistryIds =
            disciple.member?.ministries?.map((m) => m.ministry.id) ?? [];
          const newMinistryIds = theirMinistries.map((m) => m.ministryId);

          const hasChangesInMinistries =
            theirMinistries.some((newMinistry) => {
              const existing = disciple.member?.ministries?.find(
                (m) => m.ministry.id === newMinistry.ministryId,
              );

              if (!existing) return true;

              const existingRoles = [...existing.ministryRoles].sort();
              const newRoles = [...newMinistry.ministryRoles].sort();

              return (
                existingRoles.length !== newRoles.length ||
                existingRoles.some((role, idx) => role !== newRoles[idx])
              );
            }) ||
            existingMinistryIds.some((id) => !newMinistryIds.includes(id));

          //* Create Ministry Member
          if (hasChangesInMinistries) {
            const currentMinistryMembers =
              await this.ministryMemberRepository.find({
                where: { member: { id: savedMember.id } },
                relations: ['ministry'],
              });

            const newMinistryIds = theirMinistries.map((m) => m.ministryId);

            const toRemove = currentMinistryMembers.filter(
              (mm) => !newMinistryIds.includes(mm.ministry.id),
            );

            if (toRemove.length > 0) {
              await this.ministryMemberRepository.remove(toRemove);
            }

            const ministryMembers = await Promise.all(
              theirMinistries.map(async (ministryData) => {
                const ministry = await this.ministryRepository.findOne({
                  where: { id: ministryData?.ministryId },
                });

                if (!ministry?.recordStatus) {
                  throw new BadRequestException(
                    `La propiedad "Estado de registro" en el Ministerio debe ser "Activo".`,
                  );
                }

                const existingMember =
                  await this.ministryMemberRepository.findOne({
                    where: {
                      member: { id: savedMember.id },
                      ministry: { id: ministry.id },
                    },
                  });

                if (existingMember) {
                  existingMember.ministryRoles = ministryData.ministryRoles;
                  existingMember.updatedAt = new Date();
                  existingMember.updatedBy = user;
                  return existingMember;
                }

                return this.ministryMemberRepository.create({
                  member: savedMember,
                  memberRoles: savedMember.roles,
                  ministryRoles: ministryData.ministryRoles,
                  ministry: ministry,
                  createdAt: new Date(),
                  createdBy: user,
                });
              }),
            );

            await this.ministryMemberRepository.save(
              ministryMembers.filter(Boolean),
            );
          }

          return await this.discipleRepository.save(updatedDisciple);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //* RELATION TYPE WITH FAMILY GROUP - SAME FAMILY GROUP
      //? Update and save if is same Family Group
      if (
        disciple?.theirFamilyGroup?.id === theirFamilyGroup &&
        (relationType === RelationType.OnlyRelatedHierarchicalCover ||
          relationType ===
            RelationType.RelatedBothMinistriesAndHierarchicalCover)
      ) {
        let savedMember: Member;
        try {
          const updatedMember = await this.memberRepository.preload({
            id: disciple.member.id,
            firstNames: updateDiscipleDto.firstNames,
            lastNames: updateDiscipleDto.lastNames,
            gender: updateDiscipleDto.gender,
            originCountry: updateDiscipleDto.originCountry,
            birthDate: updateDiscipleDto.birthDate,
            maritalStatus: updateDiscipleDto.maritalStatus,
            numberChildren: +updateDiscipleDto.numberChildren,
            conversionDate: updateDiscipleDto.conversionDate ?? null,
            email: updateDiscipleDto.email ?? null,
            phoneNumber: updateDiscipleDto.phoneNumber ?? null,
            residenceCountry: updateDiscipleDto.residenceCountry,
            residenceDepartment: updateDiscipleDto.residenceDepartment,
            residenceProvince: updateDiscipleDto.residenceProvince,
            residenceDistrict: updateDiscipleDto.residenceDistrict,
            residenceUrbanSector: updateDiscipleDto.residenceUrbanSector,
            residenceAddress: updateDiscipleDto.residenceAddress,
            referenceAddress: updateDiscipleDto.referenceAddress,
            roles: updateDiscipleDto.roles,
          });
          savedMember = await this.memberRepository.save(updatedMember);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        try {
          const updatedDisciple = await this.discipleRepository.preload({
            id: disciple.id,
            member: savedMember,
            theirChurch: disciple.theirChurch,
            theirPastor: disciple.theirPastor,
            theirCopastor: disciple.theirCopastor,
            theirSupervisor: disciple.theirSupervisor,
            theirPreacher: disciple.theirPreacher,
            theirZone: disciple.theirZone,
            theirFamilyGroup: disciple.theirFamilyGroup,
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

          //* Validate if there is any equal record or deleted records
          const existingMinistryIds =
            disciple.member?.ministries?.map((m) => m.ministry.id) ?? [];
          const newMinistryIds = theirMinistries.map((m) => m.ministryId);

          const hasChangesInMinistries =
            theirMinistries.some((newMinistry) => {
              const existing = disciple.member?.ministries?.find(
                (m) => m.ministry.id === newMinistry.ministryId,
              );

              if (!existing) return true;

              const existingRoles = [...existing.ministryRoles].sort();
              const newRoles = [...newMinistry.ministryRoles].sort();

              return (
                existingRoles.length !== newRoles.length ||
                existingRoles.some((role, idx) => role !== newRoles[idx])
              );
            }) ||
            existingMinistryIds.some((id) => !newMinistryIds.includes(id));

          if (hasChangesInMinistries) {
            const currentMinistryMembers =
              await this.ministryMemberRepository.find({
                where: { member: { id: savedMember.id } },
                relations: ['ministry'],
              });

            const newMinistryIds = theirMinistries.map((m) => m.ministryId);

            const toRemove = currentMinistryMembers.filter(
              (mm) => !newMinistryIds.includes(mm.ministry.id),
            );

            if (toRemove.length > 0) {
              await this.ministryMemberRepository.remove(toRemove);
            }

            const ministryMembers = await Promise.all(
              theirMinistries.map(async (ministryData) => {
                const ministry = await this.ministryRepository.findOne({
                  where: { id: ministryData?.ministryId },
                });

                if (!ministry?.recordStatus) {
                  throw new BadRequestException(
                    `La propiedad "Estado de registro" en el Ministerio debe ser "Activo".`,
                  );
                }

                const existingMember =
                  await this.ministryMemberRepository.findOne({
                    where: {
                      member: { id: savedMember.id },
                      ministry: { id: ministry.id },
                    },
                  });

                if (existingMember) {
                  existingMember.ministryRoles = ministryData.ministryRoles;
                  existingMember.updatedAt = new Date();
                  existingMember.updatedBy = user;
                  return existingMember;
                }

                return this.ministryMemberRepository.create({
                  member: savedMember,
                  memberRoles: savedMember.roles,
                  ministryRoles: ministryData.ministryRoles,
                  ministry: ministry,
                  createdAt: new Date(),
                  createdBy: user,
                });
              }),
            );

            await this.ministryMemberRepository.save(
              ministryMembers.filter(Boolean),
            );
          }

          return await this.discipleRepository.save(updatedDisciple);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      //* RELATION TYPE WITH PASTOR
      //? Update and save if is same Pastor
      if (
        disciple?.theirFamilyGroup?.id === theirFamilyGroup &&
        relationType === RelationType.OnlyRelatedMinistries
      ) {
        let savedMember: Member;
        try {
          const updatedMember = await this.memberRepository.preload({
            id: disciple.member.id,
            firstNames: updateDiscipleDto.firstNames,
            lastNames: updateDiscipleDto.lastNames,
            gender: updateDiscipleDto.gender,
            originCountry: updateDiscipleDto.originCountry,
            birthDate: updateDiscipleDto.birthDate,
            maritalStatus: updateDiscipleDto.maritalStatus,
            numberChildren: +updateDiscipleDto.numberChildren,
            conversionDate: updateDiscipleDto.conversionDate ?? null,
            email: updateDiscipleDto.email ?? null,
            phoneNumber: updateDiscipleDto.phoneNumber ?? null,
            residenceCountry: updateDiscipleDto.residenceCountry,
            residenceDepartment: updateDiscipleDto.residenceDepartment,
            residenceProvince: updateDiscipleDto.residenceProvince,
            residenceDistrict: updateDiscipleDto.residenceDistrict,
            residenceUrbanSector: updateDiscipleDto.residenceUrbanSector,
            residenceAddress: updateDiscipleDto.residenceAddress,
            referenceAddress: updateDiscipleDto.referenceAddress,
            roles: updateDiscipleDto.roles,
          });
          savedMember = await this.memberRepository.save(updatedMember);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        try {
          const updatedDisciple = await this.discipleRepository.preload({
            id: disciple.id,
            member: savedMember,
            theirChurch: disciple.theirChurch,
            theirPastor: disciple.theirPastor,
            theirCopastor: disciple.theirCopastor,
            theirSupervisor: disciple.theirSupervisor,
            theirPreacher: disciple.theirPreacher,
            theirZone: disciple.theirZone,
            theirFamilyGroup: disciple.theirFamilyGroup,
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

          //* Validate if there is any equal record or deleted records
          const existingMinistryIds =
            disciple.member?.ministries?.map((m) => m.ministry.id) ?? [];
          const newMinistryIds = theirMinistries.map((m) => m.ministryId);

          const hasChangesInMinistries =
            theirMinistries.some((newMinistry) => {
              const existing = disciple.member?.ministries?.find(
                (m) => m.ministry.id === newMinistry.ministryId,
              );

              if (!existing) return true;

              const existingRoles = [...existing.ministryRoles].sort();
              const newRoles = [...newMinistry.ministryRoles].sort();

              return (
                existingRoles.length !== newRoles.length ||
                existingRoles.some((role, idx) => role !== newRoles[idx])
              );
            }) ||
            existingMinistryIds.some((id) => !newMinistryIds.includes(id));

          //* Create Ministry Member
          if (hasChangesInMinistries) {
            const currentMinistryMembers =
              await this.ministryMemberRepository.find({
                where: { member: { id: savedMember.id } },
                relations: ['ministry'],
              });

            const newMinistryIds = theirMinistries.map((m) => m.ministryId);

            const toRemove = currentMinistryMembers.filter(
              (mm) => !newMinistryIds.includes(mm.ministry.id),
            );

            if (toRemove.length > 0) {
              await this.ministryMemberRepository.remove(toRemove);
            }

            const ministryMembers = await Promise.all(
              theirMinistries.map(async (ministryData) => {
                const ministry = await this.ministryRepository.findOne({
                  where: { id: ministryData?.ministryId },
                });

                if (!ministry?.recordStatus) {
                  throw new BadRequestException(
                    `La propiedad "Estado de registro" en el Ministerio debe ser "Activo".`,
                  );
                }

                const existingMember =
                  await this.ministryMemberRepository.findOne({
                    where: {
                      member: { id: savedMember.id },
                      ministry: { id: ministry.id },
                    },
                  });

                if (existingMember) {
                  existingMember.ministryRoles = ministryData.ministryRoles;
                  existingMember.updatedAt = new Date();
                  existingMember.updatedBy = user;
                  return existingMember;
                }

                return this.ministryMemberRepository.create({
                  member: savedMember,
                  memberRoles: savedMember.roles,
                  ministryRoles: ministryData.ministryRoles,
                  ministry: ministry,
                  createdAt: new Date(),
                  createdBy: user,
                });
              }),
            );

            await this.ministryMemberRepository.save(
              ministryMembers.filter(Boolean),
            );
          }

          return await this.discipleRepository.save(updatedDisciple);
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Raise Disciple level to Preacher
    if (
      disciple.member.roles.includes(MemberRole.Disciple) &&
      !disciple.member.roles.includes(MemberRole.Preacher) &&
      !disciple.member.roles.includes(MemberRole.Treasurer) &&
      !disciple.member.roles.includes(MemberRole.Copastor) &&
      !disciple.member.roles.includes(MemberRole.Supervisor) &&
      !disciple.member.roles.includes(MemberRole.Pastor) &&
      roles.includes(MemberRole.Preacher) &&
      !roles.includes(MemberRole.Disciple) &&
      !roles.includes(MemberRole.Treasurer) &&
      !roles.includes(MemberRole.Copastor) &&
      !roles.includes(MemberRole.Pastor) &&
      !roles.includes(MemberRole.Supervisor) &&
      recordStatus === RecordStatus.Active
    ) {
      //* Validation new supervisor
      if (!theirSupervisor) {
        throw new NotFoundException(
          `Para subir de nivel de Discípulo a Predicador, se le debe asignar un Supervisor.`,
        );
      }

      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: theirSupervisor },
        relations: [
          'theirCopastor.member',
          'theirPastor.member',
          'theirChurch',
          'theirZone',
        ],
      });

      if (!newSupervisor) {
        throw new NotFoundException(
          `Supervisor con id: ${id} no fue encontrado.`,
        );
      }

      if (newSupervisor?.recordStatus === RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
        );
      }

      //* Validation new zone according supervisor
      if (!newSupervisor?.theirZone) {
        throw new BadRequestException(
          `No se encontró la Zona, verifica que Supervisor tenga una Zona asignada.`,
        );
      }

      const newZone = await this.zoneRepository.findOne({
        where: { id: newSupervisor?.theirZone?.id },
      });

      if (newZone?.recordStatus === RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Zona debe ser "Activo".`,
        );
      }

      //* Validation new copastor according supervisor
      if (!newSupervisor?.theirCopastor) {
        throw new BadRequestException(
          `No se encontró el Co-Pastor, verifica que Supervisor tenga un Co-Pastor asignado.`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newSupervisor?.theirCopastor?.id },
      });

      if (newCopastor?.recordStatus === RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
        );
      }

      //* Validation new pastor according supervisor
      if (!newSupervisor?.theirPastor) {
        throw new BadRequestException(
          `No se encontró el Pastor, verifica que Supervisor tenga un Pastor asignado.`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newSupervisor?.theirPastor?.id },
      });

      if (newPastor?.recordStatus === RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
        );
      }

      //* Validation new church according supervisor
      if (!newSupervisor?.theirChurch) {
        throw new BadRequestException(
          `No se encontró la Iglesia, verifica que Supervisor tenga una Iglesia asignada.`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newSupervisor?.theirChurch?.id },
      });

      if (newChurch?.recordStatus === RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
        );
      }

      //? Create new instance Preacher and delete old disciple

      let savedMember: Member;
      try {
        const updatedMember = await this.memberRepository.preload({
          id: disciple.member.id,
          firstNames: updateDiscipleDto.firstNames,
          lastNames: updateDiscipleDto.lastNames,
          gender: updateDiscipleDto.gender,
          originCountry: updateDiscipleDto.originCountry,
          birthDate: updateDiscipleDto.birthDate,
          maritalStatus: updateDiscipleDto.maritalStatus,
          numberChildren: +updateDiscipleDto.numberChildren,
          conversionDate: updateDiscipleDto.conversionDate ?? null,
          email: updateDiscipleDto.email ?? null,
          phoneNumber: updateDiscipleDto.phoneNumber ?? null,
          residenceCountry: updateDiscipleDto.residenceCountry,
          residenceDepartment: updateDiscipleDto.residenceDepartment,
          residenceProvince: updateDiscipleDto.residenceProvince,
          residenceDistrict: updateDiscipleDto.residenceDistrict,
          residenceUrbanSector: updateDiscipleDto.residenceUrbanSector,
          residenceAddress: updateDiscipleDto.residenceAddress,
          referenceAddress: updateDiscipleDto.referenceAddress,
          roles: updateDiscipleDto.roles,
        });

        savedMember = await this.memberRepository.save(updatedMember);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      try {
        const newPreacher = this.preacherRepository.create({
          member: savedMember,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirZone: newZone,
          relationType:
            theirMinistries.length > 0
              ? RelationType.RelatedBothMinistriesAndHierarchicalCover
              : RelationType.OnlyRelatedHierarchicalCover,
          theirSupervisor: newSupervisor,
          theirFamilyGroup: null,
          createdAt: new Date(),
          createdBy: user,
        });

        //* Update ministries of member
        if (theirMinistries.length > 0) {
          const ministryMembers = await Promise.all(
            theirMinistries.map(async (ministryData) => {
              const ministry = await this.ministryRepository.findOne({
                where: { id: ministryData?.ministryId },
              });

              if (!ministry?.recordStatus) {
                throw new BadRequestException(
                  `La propiedad "Estado de registro" en el Ministerio debe ser "Activo".`,
                );
              }

              const existingMember =
                await this.ministryMemberRepository.findOne({
                  where: {
                    member: { id: savedMember.id },
                    ministry: { id: ministry.id },
                  },
                });

              if (existingMember) {
                existingMember.ministryRoles = ministryData.ministryRoles;
                existingMember.memberRoles = savedMember.roles;
                existingMember.updatedAt = new Date();
                existingMember.updatedBy = user;
                return existingMember;
              }

              return this.ministryMemberRepository.create({
                member: savedMember,
                memberRoles: savedMember.roles,
                ministryRoles: ministryData.ministryRoles,
                ministry: ministry,
                createdAt: new Date(),
                createdBy: user,
              });
            }),
          );

          await this.ministryMemberRepository.save(
            ministryMembers.filter(Boolean),
          );
        }

        const savedPreacher = await this.preacherRepository.save(newPreacher);

        //! Find and replace with the new id and change member type
        const offeringsByOldDisciple = await this.offeringIncomeRepository.find(
          {
            where: {
              disciple: {
                id: disciple.id,
              },
            },
          },
        );

        await Promise.all(
          offeringsByOldDisciple.map(async (offering) => {
            await this.offeringIncomeRepository.update(offering?.id, {
              disciple: null,
              memberType: MemberType.Preacher,
              preacher: savedPreacher,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );

        await this.discipleRepository.remove(disciple);

        return savedPreacher;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    } else {
      throw new BadRequestException(
        `No se puede subir de nivel este Discípulo, el modo debe ser "Activo", y el rol solo debe ser: ["discípulo"], revisar y actualizar el registro.`,
      );
    }
  }

  //! INACTIVATE DISCIPLE
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

    const disciple = await this.discipleRepository.findOneBy({ id });

    if (!disciple) {
      throw new NotFoundException(`Discípulo con id: ${id} no fue encontrado.`);
    }

    //* Update and set in Inactive on Preacher
    try {
      const updatedDisciple = await this.discipleRepository.preload({
        id: disciple.id,
        updatedAt: new Date(),
        updatedBy: user,
        inactivationCategory: memberInactivationCategory,
        inactivationReason: memberInactivationReason,
        recordStatus: RecordStatus.Inactive,
      });

      await this.discipleRepository.save(updatedDisciple);
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
