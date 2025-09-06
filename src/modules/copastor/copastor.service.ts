import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, ILike, In, Repository } from 'typeorm';

import {
  CopastorSearchType,
  CopastorSearchTypeNames,
} from '@/modules/copastor/enums/copastor-search-type.enum';
import { CopastorSearchSubType } from '@/modules/copastor/enums/copastor-search-sub-type.enum';

import { CreateCopastorDto } from '@/modules/copastor/dto/create-copastor.dto';
import { UpdateCopastorDto } from '@/modules/copastor/dto/update-copastor.dto';

import { copastorDataFormatter } from '@/modules/copastor/helpers/copastor-data-formatter.helper';

import { GenderNames } from '@/common/enums/gender.enum';
import { MemberRole } from '@/common/enums/member-role.enum';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { MaritalStatusNames } from '@/common/enums/marital-status.enum';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { InactivateMemberDto } from '@/common/dtos/inactivate-member.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { getBirthDateByMonth } from '@/common/helpers/get-birth-date-by-month.helper';
import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';

import { MemberType } from '@/modules/offering/income/enums/member-type.enum';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Member } from '@/modules/member/entities/member.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';

@Injectable()
export class CopastorService {
  private readonly logger = new Logger('CopastorService');
  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

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

  //* CREATE COPASTOR
  async create(
    createCopastorDto: CreateCopastorDto,
    user: User,
  ): Promise<Copastor> {
    const { roles, theirPastor } = createCopastorDto;

    if (!roles.includes(MemberRole.Copastor)) {
      throw new BadRequestException(`El rol "Co-Pastor" deben ser incluidos.`);
    }

    if (
      roles.includes(MemberRole.Pastor) ||
      roles.includes(MemberRole.Supervisor) ||
      roles.includes(MemberRole.Preacher) ||
      roles.includes(MemberRole.Treasurer) ||
      roles.includes(MemberRole.Disciple)
    ) {
      throw new BadRequestException(
        `Para crear un Co-Pastor, solo se requiere el rol: "Co-Pastor".`,
      );
    }

    if (!theirPastor) {
      throw new NotFoundException(
        `Para crear un Co-Pastor, debes asignarle un Pastor.`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: theirPastor },
      relations: ['theirChurch'],
    });

    if (!pastor) {
      throw new NotFoundException(
        `No se encontró Pastor con el id: ${theirPastor}.`,
      );
    }

    if (pastor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
      );
    }

    //* Validate church according pastor
    if (!pastor?.theirChurch) {
      throw new NotFoundException(
        `No se encontró la Iglesia, verifique que el Pastor tenga una Iglesia asignada`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: pastor?.theirChurch?.id },
    });

    if (church?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
      );
    }

    //* Create new instance member and assign to new copastor instance
    try {
      const newMember = this.memberRepository.create({
        firstNames: createCopastorDto.firstNames,
        lastNames: createCopastorDto.lastNames,
        gender: createCopastorDto.gender,
        originCountry: createCopastorDto.originCountry,
        birthDate: createCopastorDto.birthDate,
        maritalStatus: createCopastorDto.maritalStatus,
        numberChildren: +createCopastorDto.numberChildren,
        conversionDate: createCopastorDto.conversionDate ?? null,
        email: createCopastorDto.email ?? null,
        phoneNumber: createCopastorDto.phoneNumber ?? null,
        residenceCountry: createCopastorDto.residenceCountry,
        residenceDepartment: createCopastorDto.residenceDepartment,
        residenceProvince: createCopastorDto.residenceProvince,
        residenceDistrict: createCopastorDto.residenceDistrict,
        residenceUrbanSector: createCopastorDto.residenceUrbanSector,
        residenceAddress: createCopastorDto.residenceAddress,
        referenceAddress: createCopastorDto.referenceAddress,
        roles: createCopastorDto.roles,
      });

      await this.memberRepository.save(newMember);

      const newCopastor = this.copastorRepository.create({
        member: newMember,
        theirChurch: church,
        theirPastor: pastor,
        createdAt: new Date(),
        createdBy: user,
      });

      return await this.copastorRepository.save(newCopastor);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

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

    if (isSimpleQuery || (churchId && isSimpleQuery)) {
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

        const copastors = await this.copastorRepository.find({
          where: { theirChurch: church, recordStatus: RecordStatus.Active },
          order: { createdAt: order as FindOptionsOrderValue },
          relations: ['member', 'theirPastor.member', 'theirChurch'],
        });

        if (copastors.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return copastors;
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

      const copastors = await this.copastorRepository.find({
        where: { recordStatus: RecordStatus.Active, theirChurch: church },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'member',
          'zones',
          'familyGroups',
          'theirChurch',
          'theirPastor.member',
          'supervisors.member',
          'preachers.member',
          'disciples.member',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (copastors.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return copastorDataFormatter({ copastors }) as any;
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
  ): Promise<Copastor[]> {
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
    //* Copastors by copastor first names
    if (
      term &&
      searchType === CopastorSearchType.FirstNames &&
      searchSubType === CopastorSearchSubType.ByCopastorFirstNames
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
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron co-pastores(as) con estos nombres: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Copastors by pastor names
    if (
      term &&
      searchType === CopastorSearchType.FirstNames &&
      searchSubType === CopastorSearchSubType.CopastorByPastorFirstNames
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

        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron co-pastores(as) con los nombres de su pastor: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by last name --> Many
    //* Copastors by last names
    if (
      term &&
      searchType === CopastorSearchType.LastNames &&
      searchSubType === CopastorSearchSubType.ByCopastorLastNames
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
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron co-pastores(as) con estos apellidos: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Copastors by pastor last names
    if (
      term &&
      searchType === CopastorSearchType.LastNames &&
      searchSubType === CopastorSearchSubType.CopastorByPastorLastNames
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

        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron co-pastores(as) con los apellidos de su pastor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by full name --> Many
    //* Copastors by full names
    if (
      term &&
      searchType === CopastorSearchType.FullNames &&
      searchSubType === CopastorSearchSubType.ByCopastorFullNames
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
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'member',
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron co-pastores(as) con estos nombres y apellidos: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Copastors by pastor full names
    if (
      term &&
      searchType === CopastorSearchType.FullNames &&
      searchSubType === CopastorSearchSubType.CopastorByPastorFullNames
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

        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron co-pastores(as) con los nombres y apellidos de su pastor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by birth date --> Many
    if (term && searchType === CopastorSearchType.BirthDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const fromDate = new Date(fromTimestamp);
      const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

      try {
        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron co-pastores(as) con este rango de fechas de nacimiento: ${fromDate} - ${toDate} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by month birth --> Many
    if (term && searchType === CopastorSearchType.BirthMonth) {
      try {
        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const resultCopastors = getBirthDateByMonth({
          month: term,
          data: copastors,
        });

        if (resultCopastors.length === 0) {
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
            `No se encontraron co-pastores(as) con este mes de nacimiento: ${monthInSpanish} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({
          copastors: resultCopastors as Copastor[],
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by gender --> Many
    if (term && searchType === CopastorSearchType.Gender) {
      const genderTerm = term.toLowerCase();
      const validGenders = ['male', 'female'];

      if (!validGenders.includes(genderTerm)) {
        throw new BadRequestException(`Género no válido: ${term}`);
      }

      try {
        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          const genderInSpanish = GenderNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron co-pastores(as) con este género: ${genderInSpanish} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by marital status --> Many
    if (term && searchType === CopastorSearchType.MaritalStatus) {
      try {
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

        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          const maritalStatusInSpanish =
            MaritalStatusNames[term.toLowerCase()] ?? term;

          throw new NotFoundException(
            `No se encontraron co-pastores(as) con este estado civil: ${maritalStatusInSpanish} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by origin country --> Many
    if (term && searchType === CopastorSearchType.OriginCountry) {
      try {
        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron co-pastores(as) con este país de origen: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence country --> Many
    if (term && searchType === CopastorSearchType.ResidenceCountry) {
      try {
        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron co-pastores(as) con este país de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence department --> Many
    if (term && searchType === CopastorSearchType.ResidenceDepartment) {
      try {
        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron co-pastores(as) con este departamento de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence province --> Many
    if (term && searchType === CopastorSearchType.ResidenceProvince) {
      try {
        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron co-pastores(as) con esta provincia de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence district --> Many
    if (term && searchType === CopastorSearchType.ResidenceDistrict) {
      try {
        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron co-pastores(as) con este distrito de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence urban sector --> Many
    if (term && searchType === CopastorSearchType.ResidenceUrbanSector) {
      try {
        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron co-pastores(as) con este sector urbano de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence address --> Many
    if (term && searchType === CopastorSearchType.ResidenceAddress) {
      try {
        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          throw new NotFoundException(
            `No se encontraron co-pastores(as) con esta dirección de residencia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by residence status --> Many
    if (term && searchType === CopastorSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', RecordStatus.Inactive];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      try {
        const copastors = await this.copastorRepository.find({
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
            'zones',
            'familyGroups',
            'theirChurch',
            'theirPastor.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (copastors.length === 0) {
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron co-pastores(as) con este estado de registro : ${value} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return copastorDataFormatter({ copastors }) as any;
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
      !Object.values(CopastorSearchType).includes(
        searchType as CopastorSearchType,
      )
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(CopastorSearchTypeNames).join(', ')}`,
      );
    }

    if (
      term &&
      (CopastorSearchType.FirstNames ||
        CopastorSearchType.LastNames ||
        CopastorSearchType.FullNames) &&
      !searchSubType
    ) {
      throw new BadRequestException(
        `Para buscar por nombres o apellidos el sub-tipo es requerido.`,
      );
    }
  }

  //* UPDATE COPASTOR
  async update(
    id: string,
    updateCopastorDto: UpdateCopastorDto,
    user: User,
  ): Promise<Copastor | Pastor> {
    const {
      roles,
      recordStatus,
      theirPastor,
      theirChurch,
      memberInactivationReason,
      memberInactivationCategory,
    } = updateCopastorDto;

    if (!roles) {
      throw new BadRequestException(
        `Los roles son requeridos para actualizar un Co-Pastor.`,
      );
    }

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: id },
      relations: ['theirPastor', 'theirChurch', 'member'],
    });

    if (!copastor) {
      throw new NotFoundException(`No se encontró Co-Pastor con el id: ${id}`);
    }

    if (!roles.some((role) => ['copastor', 'pastor'].includes(role))) {
      throw new BadRequestException(
        `Los roles deben incluir "Pastor" o "Co-Pastor".`,
      );
    }

    if (
      copastor.member.roles.includes(MemberRole.Copastor) &&
      !copastor.member.roles.includes(MemberRole.Disciple) &&
      !copastor.member.roles.includes(MemberRole.Preacher) &&
      !copastor.member.roles.includes(MemberRole.Supervisor) &&
      !copastor.member.roles.includes(MemberRole.Pastor) &&
      !copastor.member.roles.includes(MemberRole.Treasurer) &&
      (roles.includes(MemberRole.Supervisor) ||
        roles.includes(MemberRole.Preacher) ||
        roles.includes(MemberRole.Treasurer) ||
        roles.includes(MemberRole.Disciple))
    ) {
      throw new BadRequestException(
        `No se puede asignar un rol inferior sin pasar por la jerarquía: [discípulo, predicador, supervisor, copastor, pastor]`,
      );
    }

    //* Update info about Copastor
    if (
      copastor.member.roles.includes(MemberRole.Copastor) &&
      !copastor.member.roles.includes(MemberRole.Disciple) &&
      !copastor.member.roles.includes(MemberRole.Pastor) &&
      !copastor.member.roles.includes(MemberRole.Supervisor) &&
      !copastor.member.roles.includes(MemberRole.Preacher) &&
      !copastor.member.roles.includes(MemberRole.Treasurer) &&
      roles.includes(MemberRole.Copastor) &&
      !roles.includes(MemberRole.Disciple) &&
      !roles.includes(MemberRole.Pastor) &&
      !roles.includes(MemberRole.Supervisor) &&
      !roles.includes(MemberRole.Preacher) &&
      !roles.includes(MemberRole.Treasurer)
    ) {
      if (
        copastor?.recordStatus === RecordStatus.Active &&
        recordStatus === RecordStatus.Inactive
      ) {
        throw new BadRequestException(
          `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
        );
      }

      //? Update if their Pastor is different
      if (copastor?.theirPastor?.id !== theirPastor) {
        //* Validate pastor
        if (!theirPastor) {
          throw new NotFoundException(
            `Para poder actualizar un Co-Pastor, se debe asignar un Pastor.`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: theirPastor },
          relations: ['theirChurch'],
        });

        if (!newPastor) {
          throw new NotFoundException(
            `Pastor con el id: ${theirPastor}, no fue encontrado.`,
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
            `No se encontró la Iglesia, verificar que Pastor tenga una Iglesia asignada.`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newPastor?.theirChurch?.id },
          relations: ['theirMainChurch'],
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
            id: copastor.member.id,
            firstNames: updateCopastorDto.firstNames,
            lastNames: updateCopastorDto.lastNames,
            gender: updateCopastorDto.gender,
            originCountry: updateCopastorDto.originCountry,
            birthDate: updateCopastorDto.birthDate,
            maritalStatus: updateCopastorDto.maritalStatus,
            numberChildren: +updateCopastorDto.numberChildren,
            conversionDate: updateCopastorDto.conversionDate ?? null,
            email: updateCopastorDto.email ?? null,
            phoneNumber: updateCopastorDto.phoneNumber ?? null,
            residenceCountry: updateCopastorDto.residenceCountry,
            residenceDepartment: updateCopastorDto.residenceDepartment,
            residenceProvince: updateCopastorDto.residenceProvince,
            residenceDistrict: updateCopastorDto.residenceDistrict,
            residenceUrbanSector: updateCopastorDto.residenceUrbanSector,
            residenceAddress: updateCopastorDto.residenceAddress,
            referenceAddress: updateCopastorDto.referenceAddress,
            roles: updateCopastorDto.roles,
          });

          savedMember = await this.memberRepository.save(updatedMember);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        let savedCopastor: Copastor;
        try {
          const updatedCopastor = await this.copastorRepository.preload({
            id: copastor.id,
            member: savedMember,
            theirChurch: newChurch,
            theirPastor: newPastor,
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

          savedCopastor = await this.copastorRepository.save(updatedCopastor);
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }

        //? Update in subordinate relations
        const allSupervisors = await this.supervisorRepository.find({
          relations: ['theirCopastor'],
        });
        const allZones = await this.zoneRepository.find({
          relations: ['theirCopastor'],
        });
        const allPreachers = await this.preacherRepository.find({
          relations: ['theirCopastor'],
        });
        const allFamilyGroups = await this.familyGroupRepository.find({
          relations: ['theirCopastor'],
        });
        const allDisciples = await this.discipleRepository.find({
          relations: ['theirCopastor'],
        });

        try {
          //* Update and set new relationships in Supervisor
          const supervisorsByCopastor = allSupervisors.filter(
            (supervisor) => supervisor?.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            supervisorsByCopastor.map(async (supervisor) => {
              await this.supervisorRepository.update(supervisor?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                updatedAt: new Date(),
                updatedBy: user,
              });
            }),
          );

          //* Update and set new relationships in Zone
          const zonesByCopastor = allZones.filter(
            (zone) => zone?.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            zonesByCopastor.map(async (zone) => {
              await this.zoneRepository.update(zone?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                updatedAt: new Date(),
                updatedBy: user,
              });
            }),
          );

          //* Update and set new relationships in Preacher
          const preachersByCopastor = allPreachers.filter(
            (preacher) => preacher?.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            preachersByCopastor.map(async (preacher) => {
              await this.preacherRepository.update(preacher?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                updatedAt: new Date(),
                updatedBy: user,
              });
            }),
          );

          //* Update and set new relationships in Family group
          const familyGroupsByCopastor = allFamilyGroups.filter(
            (familyGroup) => familyGroup?.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            familyGroupsByCopastor.map(async (familyGroup) => {
              await this.familyGroupRepository.update(familyGroup?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                updatedAt: new Date(),
                updatedBy: user,
              });
            }),
          );

          //* Update and set new relationships in Disciple
          const disciplesByCopastor = allDisciples.filter(
            (disciple) => disciple?.theirCopastor?.id === copastor?.id,
          );

          await Promise.all(
            disciplesByCopastor.map(async (disciple) => {
              await this.discipleRepository.update(disciple?.id, {
                theirChurch: newChurch,
                theirPastor: newPastor,
                updatedAt: new Date(),
                updatedBy: user,
              });
            }),
          );
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }

        return savedCopastor;
      }

      //? Update and save if is same Pastor
      if (copastor?.theirPastor?.id === theirPastor) {
        try {
          const updatedMember = await this.memberRepository.preload({
            id: copastor.member.id,
            firstNames: updateCopastorDto.firstNames,
            lastNames: updateCopastorDto.lastNames,
            gender: updateCopastorDto.gender,
            originCountry: updateCopastorDto.originCountry,
            birthDate: updateCopastorDto.birthDate,
            maritalStatus: updateCopastorDto.maritalStatus,
            numberChildren: +updateCopastorDto.numberChildren,
            conversionDate: updateCopastorDto.conversionDate ?? null,
            email: updateCopastorDto.email ?? null,
            phoneNumber: updateCopastorDto.phoneNumber ?? null,
            residenceCountry: updateCopastorDto.residenceCountry,
            residenceDepartment: updateCopastorDto.residenceDepartment,
            residenceProvince: updateCopastorDto.residenceProvince,
            residenceDistrict: updateCopastorDto.residenceDistrict,
            residenceUrbanSector: updateCopastorDto.residenceUrbanSector,
            residenceAddress: updateCopastorDto.residenceAddress,
            referenceAddress: updateCopastorDto.referenceAddress,
            roles: updateCopastorDto.roles,
          });

          await this.memberRepository.save(updatedMember);

          const updatedCopastor = await this.copastorRepository.preload({
            id: copastor.id,
            member: updatedMember,
            theirChurch: copastor.theirChurch,
            theirPastor: copastor.theirPastor,
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

          return await this.copastorRepository.save(updatedCopastor);
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //* Raise Co-pastor level to Pastor
    if (
      copastor.member.roles.includes(MemberRole.Copastor) &&
      !copastor.member.roles.includes(MemberRole.Disciple) &&
      !copastor.member.roles.includes(MemberRole.Treasurer) &&
      !copastor.member.roles.includes(MemberRole.Supervisor) &&
      !copastor.member.roles.includes(MemberRole.Preacher) &&
      !copastor.member.roles.includes(MemberRole.Pastor) &&
      roles.includes(MemberRole.Pastor) &&
      !roles.includes(MemberRole.Disciple) &&
      !roles.includes(MemberRole.Treasurer) &&
      !roles.includes(MemberRole.Supervisor) &&
      !roles.includes(MemberRole.Copastor) &&
      !roles.includes(MemberRole.Preacher) &&
      copastor.recordStatus === RecordStatus.Active
    ) {
      //* Validation new church
      if (!theirChurch) {
        throw new NotFoundException(
          `Para promover de Co-Pastor a Pastor se le debe asignar una Iglesia.`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: theirChurch },
        relations: ['theirMainChurch'],
      });

      if (!newChurch) {
        throw new NotFoundException(`Iglesia con id: ${id} no fue encontrada.`);
      }

      if (newChurch?.recordStatus == RecordStatus.Inactive) {
        throw new NotFoundException(
          `La propiedad "Estado de registro" en Iglesia debe ser "Activa".`,
        );
      }

      //? Create new instance Pastor and delete old Copastor
      try {
        const updatedMember = await this.memberRepository.preload({
          id: copastor.member.id,
          firstNames: updateCopastorDto.firstNames,
          lastNames: updateCopastorDto.lastNames,
          gender: updateCopastorDto.gender,
          originCountry: updateCopastorDto.originCountry,
          birthDate: updateCopastorDto.birthDate,
          maritalStatus: updateCopastorDto.maritalStatus,
          numberChildren: +updateCopastorDto.numberChildren,
          conversionDate: updateCopastorDto.conversionDate ?? null,
          email: updateCopastorDto.email ?? null,
          phoneNumber: updateCopastorDto.phoneNumber ?? null,
          residenceCountry: updateCopastorDto.residenceCountry,
          residenceDepartment: updateCopastorDto.residenceDepartment,
          residenceProvince: updateCopastorDto.residenceProvince,
          residenceDistrict: updateCopastorDto.residenceDistrict,
          residenceUrbanSector: updateCopastorDto.residenceUrbanSector,
          residenceAddress: updateCopastorDto.residenceAddress,
          referenceAddress: updateCopastorDto.referenceAddress,
          roles: updateCopastorDto.roles,
        });

        await this.memberRepository.save(updatedMember);

        const newPastor = this.pastorRepository.create({
          member: updatedMember,
          theirChurch: newChurch,
          createdAt: new Date(),
          createdBy: user,
        });

        const savedPastor = await this.pastorRepository.save(newPastor);

        //! Find and replace with the new id and change member type
        const offeringsByOldCopastor = await this.offeringIncomeRepository.find(
          {
            where: {
              copastor: {
                id: copastor.id,
              },
            },
          },
        );

        await Promise.all(
          offeringsByOldCopastor.map(async (offering) => {
            await this.offeringIncomeRepository.update(offering?.id, {
              copastor: null,
              memberType: MemberType.Pastor,
              pastor: savedPastor,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );

        await this.copastorRepository.remove(copastor); // onDelete subordinate entities (null)
        return savedPastor;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    } else {
      throw new BadRequestException(
        `No se puede subir de nivel este Co-Pastor, el modo debe ser "Activo", y el rol debe ser: ["pastor"], revisar y actualizar el registro.`,
      );
    }
  }

  //! INACTIVATE COPASTOR
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

    const copastor = await this.copastorRepository.findOneBy({ id });

    if (!copastor) {
      throw new NotFoundException(`Co-Pastor con id: ${id} no fue encontrado.`);
    }

    //* Update and set to Inactive on Copastor
    try {
      const updatedCopastor = await this.copastorRepository.preload({
        id: copastor.id,
        updatedAt: new Date(),
        updatedBy: user,
        inactivationCategory: memberInactivationCategory,
        inactivationReason: memberInactivationReason,
        recordStatus: RecordStatus.Inactive,
      });

      await this.copastorRepository.save(updatedCopastor);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    const allSupervisors = await this.supervisorRepository.find({
      relations: ['theirCopastor'],
    });

    const allZones = await this.zoneRepository.find({
      relations: ['theirCopastor'],
    });

    const allPreachers = await this.preacherRepository.find({
      relations: ['theirCopastor'],
    });

    const allFamilyGroups = await this.familyGroupRepository.find({
      relations: ['theirCopastor'],
    });

    const allDisciples = await this.discipleRepository.find({
      relations: ['theirCopastor'],
    });

    try {
      //* Update and set to null relationships in Supervisor
      const supervisorsByCopastor = allSupervisors.filter(
        (supervisor) => supervisor?.theirCopastor?.id === copastor?.id,
      );

      await Promise.all(
        supervisorsByCopastor.map(async (supervisor) => {
          await this.supervisorRepository.update(supervisor?.id, {
            theirCopastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Zone
      const zonesByCopastor = allZones.filter(
        (zone) => zone?.theirCopastor?.id === copastor?.id,
      );

      await Promise.all(
        zonesByCopastor.map(async (zone) => {
          await this.zoneRepository.update(zone?.id, {
            theirCopastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Preacher
      const preachersByCopastor = allPreachers.filter(
        (preacher) => preacher?.theirCopastor?.id === copastor?.id,
      );

      await Promise.all(
        preachersByCopastor.map(async (preacher) => {
          await this.preacherRepository.update(preacher?.id, {
            theirCopastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Family Group
      const familyGroupsByCopastor = allFamilyGroups.filter(
        (familyGroup) => familyGroup?.theirCopastor?.id === copastor?.id,
      );

      await Promise.all(
        familyGroupsByCopastor.map(async (familyGroup) => {
          await this.familyGroupRepository.update(familyGroup?.id, {
            theirCopastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Disciple
      const disciplesByCopastor = allDisciples.filter(
        (disciple) => disciple?.theirCopastor?.id === copastor?.id,
      );

      await Promise.all(
        disciplesByCopastor.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirCopastor: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

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
