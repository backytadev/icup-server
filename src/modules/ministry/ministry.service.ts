import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, ILike, In, Repository } from 'typeorm';

import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { CreateMinistryDto } from '@/modules/ministry/dto/create-ministry.dto';
import { UpdateMinistryDto } from '@/modules/ministry/dto/update-ministry.dto';
import { InactivateMinistryDto } from '@/modules/ministry/dto/inactivate-ministry.dto';

import {
  MinistryType,
  MinistryTypeNames,
} from '@/modules/ministry/enums/ministry-type.enum';
import {
  MinistrySearchType,
  MinistrySearchTypeNames,
} from '@/modules/ministry/enums/ministry-search-type.enum';
import { generateCodeMinistry } from '@/modules/ministry/helpers/generate-code-ministry';
import { MinistrySearchSubType } from '@/modules/ministry/enums/ministry-search-sub-type.enum';
import { ministryDataFormatter } from '@/modules/ministry/helpers/ministry-data-formatter.helper';

import { Church } from '@/modules/church/entities/church.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';
import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';

import { User } from '@/modules/user/entities/user.entity';

@Injectable()
export class MinistryService {
  private readonly logger = new Logger('ChurchService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(Ministry)
    private readonly ministryRepository: Repository<Ministry>,

    @InjectRepository(Pastor)
    private readonly pastorRepository: Repository<Pastor>,
  ) {}

  //* CREATE MINISTRY
  async create(createMinistryDto: CreateMinistryDto, user: User) {
    const { theirPastor, customMinistryName, ministryType } = createMinistryDto;

    if (!theirPastor) {
      throw new NotFoundException(
        `Para crear un Ministerio, debes asignarle un Pastor.`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: theirPastor },
      relations: ['theirChurch', 'member'],
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

    const existMinistry = await this.ministryRepository.findOne({
      where: {
        ministryType,
        theirPastor: { id: pastor.id },
        theirChurch: { id: church.id },
      },
    });

    if (existMinistry) {
      throw new BadRequestException(
        `El ministerio ya existe con los siguientes datos: Tipo: ${MinistryTypeNames[ministryType as MinistryType]}, Pastor: ${pastor.member.firstNames} ${pastor.member.lastNames}, Iglesia: ${church.abbreviatedChurchName}.`,
      );
    }

    // Create new instance
    try {
      const newMinistry = this.ministryRepository.create({
        ...createMinistryDto,
        email: createMinistryDto.email ?? null,
        phoneNumber: createMinistryDto.phoneNumber ?? null,
        ministryCode: generateCodeMinistry(customMinistryName),
        theirChurch: church,
        theirPastor: pastor,
        createdAt: new Date(),
        createdBy: user,
      });

      return await this.ministryRepository.save(newMinistry);
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

        const ministries = await this.ministryRepository.find({
          where: { theirChurch: church, recordStatus: RecordStatus.Active },
          order: { createdAt: order as FindOptionsOrderValue },
          relations: ['theirPastor.member', 'theirChurch', 'members.member'],
        });

        if (ministries.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return ministryDataFormatter({ ministries: ministries }) as any;
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

      const ministries = await this.ministryRepository.find({
        where: { recordStatus: RecordStatus.Active, theirChurch: church },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor.member',
          'members.member',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (ministries.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return ministryDataFormatter({ ministries: ministries }) as any;
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
  ): Promise<Ministry[]> {
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

    //* Ministries by pastor names
    if (
      term &&
      searchType === MinistrySearchType.FirstNames &&
      searchSubType === MinistrySearchSubType.MinistryByPastorFirstNames
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

        const ministries = await this.ministryRepository.find({
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
            'theirChurch',
            'theirPastor.member',
            'members',
            'members.member',
            'members.ministry',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (ministries.length === 0) {
          throw new NotFoundException(
            `No se encontraron ministerios con los nombres de su pastor: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return ministryDataFormatter({ ministries }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Ministries by pastor last names
    if (
      term &&
      searchType === MinistrySearchType.LastNames &&
      searchSubType === MinistrySearchSubType.MinistryByPastorLastNames
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

        const ministries = await this.ministryRepository.find({
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
            'theirChurch',
            'theirPastor.member',
            'members',
            'members.member',
            'members.ministry',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (ministries.length === 0) {
          throw new NotFoundException(
            `No se encontraron ministerios con los apellidos de su pastor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return ministryDataFormatter({ ministries }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }
    if (
      term &&
      searchType === MinistrySearchType.FullNames &&
      searchSubType === MinistrySearchSubType.MinistryByPastorFullNames
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

        const ministries = await this.ministryRepository.find({
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
            'theirChurch',
            'theirPastor.member',
            'members',
            'members.member',
            'members.ministry',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (ministries.length === 0) {
          throw new NotFoundException(
            `No se encontraron ministerios con los nombres y apellidos de su pastor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return ministryDataFormatter({ ministries }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by ministry type --> Many
    if (term && searchType === MinistrySearchType.MinistryType) {
      try {
        const ministries = await this.ministryRepository.find({
          where: {
            theirChurch: church,
            ministryType: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'members',
            'members.member',
            'members.ministry',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (ministries.length === 0) {
          throw new NotFoundException(
            `No se encontraron ministerios con este tipo: ${MinistryTypeNames[term as MinistryType]} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return ministryDataFormatter({ ministries }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by ministry custom name --> Many
    if (term && searchType === MinistrySearchType.MinistryCustomName) {
      try {
        const ministries = await this.ministryRepository.find({
          where: {
            theirChurch: church,
            customMinistryName: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'members',
            'members.member',
            'members.ministry',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (ministries.length === 0) {
          throw new NotFoundException(
            `No se encontraron ministerios con este nombre: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return ministryDataFormatter({ ministries }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by founding date --> Many
    if (term && searchType === MinistrySearchType.FoundingDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const fromDate = new Date(fromTimestamp);
      const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

      try {
        const ministries = await this.ministryRepository.find({
          where: {
            theirChurch: church,
            foundingDate: Between(fromDate, toDate),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'members',
            'members.member',
            'members.ministry',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (ministries.length === 0) {
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron ministerios con este rango de fechas: ${fromDate} - ${toDate} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return ministryDataFormatter({ ministries }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by department --> Many
    if (term && searchType === MinistrySearchType.Department) {
      try {
        const ministries = await this.ministryRepository.find({
          where: {
            theirChurch: church,
            department: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'members',
            'members.member',
            'members.ministry',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (ministries.length === 0) {
          throw new NotFoundException(
            `No se encontraron ministerios con este departamento: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return ministryDataFormatter({ ministries }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by province --> Many
    if (term && searchType === MinistrySearchType.Province) {
      try {
        const ministries = await this.ministryRepository.find({
          where: {
            theirChurch: church,
            province: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'members',
            'members.member',
            'members.ministry',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (ministries.length === 0) {
          throw new NotFoundException(
            `No se encontraron ministerios con esta provincia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return ministryDataFormatter({ ministries }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by district --> Many
    if (term && searchType === MinistrySearchType.District) {
      try {
        const ministries = await this.ministryRepository.find({
          where: {
            theirChurch: church,
            district: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'members',
            'members.member',
            'members.ministry',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (ministries.length === 0) {
          throw new NotFoundException(
            `No se encontraron ministerios con este distrito: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return ministryDataFormatter({ ministries }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by urban sector --> Many
    if (term && searchType === MinistrySearchType.UrbanSector) {
      try {
        const ministries = await this.ministryRepository.find({
          where: {
            theirChurch: church,
            urbanSector: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'members',
            'members.member',
            'members.ministry',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (ministries.length === 0) {
          throw new NotFoundException(
            `No se encontraron ministerios con este sector urbano: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return ministryDataFormatter({ ministries }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by address --> Many
    if (term && searchType === MinistrySearchType.Address) {
      try {
        const ministries = await this.ministryRepository.find({
          where: {
            theirChurch: church,
            address: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'members',
            'members.member',
            'members.ministry',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (ministries.length === 0) {
          throw new NotFoundException(
            `No se encontraron ministerio con esta dirección: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return ministryDataFormatter({ ministries }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by record status --> Many
    if (term && searchType === MinistrySearchType.RecordStatus) {
      try {
        const recordStatusTerm = term.toLowerCase();
        const validRecordStatus = ['active', 'inactive'];

        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        const ministries = await this.ministryRepository.find({
          where: {
            theirChurch: church,
            recordStatus: recordStatusTerm,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'members',
            'members.member',
            'members.ministry',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (ministries.length === 0) {
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron ministerios con este estado de registro: ${value} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return ministryDataFormatter({ ministries }) as any;
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
      !Object.values(MinistrySearchType).includes(
        searchType as MinistrySearchType,
      )
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(MinistrySearchTypeNames).join(', ')}`,
      );
    }
  }

  //* UPDATE MINISTRY
  async update(id: string, updateMinistryDto: UpdateMinistryDto, user: User) {
    const {
      recordStatus,
      theirPastor,
      ministryType,
      ministryInactivationCategory,
      ministryInactivationReason,
    } = updateMinistryDto;

    //* Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido`);
    }

    const ministry = await this.ministryRepository.findOne({
      where: { id: id },
      relations: ['theirPastor', 'theirPastor.member', 'theirChurch'],
    });

    if (!ministry) {
      throw new NotFoundException(`No se encontró iglesia con id: ${id}`);
    }

    if (
      ministry?.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar el registro a "Inactivo", se debe eliminar.`,
      );
    }

    if (ministry?.theirPastor?.id !== theirPastor) {
      //* Validate pastor
      if (!theirPastor) {
        throw new NotFoundException(
          `Para poder actualizar un Ministerio, se debe asignar un Pastor.`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: theirPastor },
        relations: ['theirChurch', 'member'],
      });

      const ministryPastorExists = await this.ministryRepository.findOne({
        where: { theirPastor: newPastor, ministryType: ministryType },
      });

      if (ministryPastorExists) {
        throw new ConflictException(
          `El pastor "${newPastor?.member?.firstNames} ${newPastor?.member?.lastNames}" ya está asignado a un ministerio de tipo "${MinistryTypeNames[ministryType as MinistryType]}".`,
        );
      }

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

      const updatedMinistry = await this.ministryRepository.preload({
        id: ministry.id,
        ...updateMinistryDto,
        ministryCode:
          updateMinistryDto.customMinistryName !== ministry.customMinistryName
            ? generateCodeMinistry(updateMinistryDto.customMinistryName)
            : ministry.ministryCode,
        theirChurch: newChurch,
        theirPastor: newPastor,
        updatedAt: new Date(),
        updatedBy: user,
        inactivationCategory:
          recordStatus === RecordStatus.Active
            ? null
            : ministryInactivationCategory,
        inactivationReason:
          recordStatus === RecordStatus.Active
            ? null
            : ministryInactivationReason,
        recordStatus: recordStatus,
      });

      return await this.ministryRepository.save(updatedMinistry);
    }

    //? Update and save if is same Pastor
    if (ministry?.theirPastor?.id === theirPastor) {
      try {
        const updatedMinistry = await this.ministryRepository.preload({
          id: ministry.id,
          ...updateMinistryDto,
          ministryCode:
            updateMinistryDto.customMinistryName !== ministry.customMinistryName
              ? generateCodeMinistry(updateMinistryDto.customMinistryName)
              : ministry.ministryCode,
          theirChurch: ministry.theirChurch,
          theirPastor: ministry.theirPastor,
          updatedAt: new Date(),
          updatedBy: user,
          inactivationCategory:
            recordStatus === RecordStatus.Active
              ? null
              : ministryInactivationCategory,
          inactivationReason:
            recordStatus === RecordStatus.Active
              ? null
              : ministryInactivationReason,
          recordStatus: recordStatus,
        });

        return await this.ministryRepository.save(updatedMinistry);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //! INACTIVATE MINISTRY
  async remove(
    id: string,
    inactivateMinistryDto: InactivateMinistryDto,
    user: User,
  ) {
    const { ministryInactivationCategory, ministryInactivationReason } =
      inactivateMinistryDto;

    //* Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const ministry = await this.ministryRepository.findOne({
      where: { id: id },
      relations: ['theirPastor.member', 'theirChurch'],
    });

    if (!ministry) {
      throw new NotFoundException(`Iglesia con: ${id} no fue encontrado.`);
    }

    //* Update and set in Inactive on Ministry
    try {
      const updatedMinistry = await this.ministryRepository.preload({
        id: ministry.id,
        updatedAt: new Date(),
        updatedBy: user,
        inactivationCategory: ministryInactivationCategory,
        inactivationReason: ministryInactivationReason,
        recordStatus: RecordStatus.Inactive,
      });

      await this.ministryRepository.save(updatedMinistry);
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
      } else if (detail.includes('ministry')) {
        throw new BadRequestException('El nombre de iglesia ya está en uso.');
      }
    }

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
