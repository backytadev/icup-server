import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, ILike, Repository } from 'typeorm';

import { Church } from '@/modules/church/entities/church.entity';

import { generateCodeChurch } from '@/modules/church/helpers/generate-code-church';
import { churchDataFormatter } from '@/modules/church/helpers/church-data-formatter.helper';

import { CreateChurchDto } from '@/modules/church/dto/create-church.dto';
import { UpdateChurchDto } from '@/modules/church/dto/update-church.dto';
import { InactivateChurchDto } from '@/modules/church/dto/inactivate-church.dto';

import {
  ChurchSearchType,
  ChurchSearchTypeNames,
} from '@/modules/church/enums/church-search-type.enum';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { User } from '@/modules/user/entities/user.entity';
import { Zone } from '@/modules/zone/entities/zone.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';

@Injectable()
export class ChurchService {
  private readonly logger = new Logger('ChurchService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

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
  ) {}

  //* CREATE CHURCH
  async create(createChurchDto: CreateChurchDto, user: User): Promise<Church> {
    const { theirMainChurch, abbreviatedChurchName } = createChurchDto;

    const mainChurch = await this.churchRepository.findOne({
      where: { isAnexe: false },
    });

    if (mainChurch && !theirMainChurch) {
      throw new BadRequestException(
        `Ya existe una iglesia central, solo puedes crear iglesias anexos.`,
      );
    }

    //? Validate and assign main church to anexe church
    if (theirMainChurch) {
      const mainChurch = await this.churchRepository.findOne({
        where: { id: theirMainChurch },
        relations: ['anexes'],
      });

      if (!mainChurch) {
        throw new NotFoundException(
          `No se encontró iglesia con id ${theirMainChurch}`,
        );
      }

      if (mainChurch?.isAnexe) {
        throw new BadRequestException(
          `No puedes asignar una Iglesia anexo como Iglesia Central.`,
        );
      }

      if (mainChurch?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Iglesia Central debe ser "Activo"`,
        );
      }

      // Create new instance
      try {
        const newChurch = this.churchRepository.create({
          ...createChurchDto,
          isAnexe: true,
          churchCode: generateCodeChurch(abbreviatedChurchName),
          theirMainChurch: mainChurch,
          createdAt: new Date(),
          createdBy: user,
        });

        return await this.churchRepository.save(newChurch);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    // Create new instance (if their main church not exists)
    try {
      const newChurch = this.churchRepository.create({
        ...createChurchDto,
        isAnexe: false,
        churchCode: generateCodeChurch(abbreviatedChurchName),
        theirMainChurch: null,
        createdAt: new Date(),
        createdBy: user,
      });

      return await this.churchRepository.save(newChurch);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND MAIN CHURCH
  async findMainChurch(paginationDto: PaginationDto): Promise<Church[]> {
    const { limit = 1, offset = 0, order = 'ASC' } = paginationDto;

    try {
      const mainChurch = await this.churchRepository.find({
        where: { isAnexe: false, recordStatus: RecordStatus.Active },
        take: limit,
        skip: offset,
        order: { createdAt: order as FindOptionsOrderValue },
      });

      return mainChurch;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const { limit, offset = 0, order = 'ASC', isSimpleQuery } = paginationDto;

    if (isSimpleQuery) {
      try {
        const churches = await this.churchRepository.find({
          where: { recordStatus: RecordStatus.Active },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (churches.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return churches;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    try {
      const churches = await this.churchRepository.find({
        where: { recordStatus: RecordStatus.Active },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'anexes',
          'zones',
          'ministries',
          'familyGroups',
          'pastors.member',
          'copastors.member',
          'supervisors.member',
          'preachers.member',
          'disciples.member',
        ],
        relationLoadStrategy: 'query',
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (churches.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      const mainChurch = await this.churchRepository.findOne({
        where: { isAnexe: false, recordStatus: RecordStatus.Active },
      });

      return churchDataFormatter({ churches, mainChurch }) as any;
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
  ): Promise<Church[]> {
    const { searchType, limit, offset = 0, order } = searchTypeAndPaginationDto;

    if (!term) {
      throw new BadRequestException(`El termino de búsqueda es requerido.`);
    }

    if (!searchType) {
      throw new BadRequestException(`El tipo de búsqueda es requerido.`);
    }

    //? Find by church name --> Many
    if (term && searchType === ChurchSearchType.ChurchName) {
      try {
        const churches = await this.churchRepository.find({
          where: {
            churchName: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'anexes',
            'zones',
            'familyGroups',
            'pastors.member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const mainChurch = await this.churchRepository.findOne({
          where: { isAnexe: false, recordStatus: RecordStatus.Active },
        });

        if (churches.length === 0) {
          throw new NotFoundException(
            `No se encontraron iglesias con este nombre: ${term}`,
          );
        }

        return churchDataFormatter({ churches, mainChurch }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by founding date --> Many
    if (term && searchType === ChurchSearchType.FoundingDate) {
      const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

      if (isNaN(fromTimestamp)) {
        throw new NotFoundException('Formato de marca de tiempo invalido.');
      }

      const fromDate = new Date(fromTimestamp);
      const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

      try {
        const churches = await this.churchRepository.find({
          where: {
            foundingDate: Between(fromDate, toDate),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'anexes',
            'zones',
            'familyGroups',
            'pastors.member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const mainChurch = await this.churchRepository.findOne({
          where: { isAnexe: false, recordStatus: RecordStatus.Active },
        });

        if (churches.length === 0) {
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron iglesias con este rango de fechas: ${fromDate} - ${toDate}`,
          );
        }

        return churchDataFormatter({ churches, mainChurch }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by department --> Many
    if (term && searchType === ChurchSearchType.Department) {
      try {
        const churches = await this.churchRepository.find({
          where: {
            department: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'anexes',
            'zones',
            'familyGroups',
            'pastors.member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const mainChurch = await this.churchRepository.findOne({
          where: { isAnexe: false, recordStatus: RecordStatus.Active },
        });

        if (churches.length === 0) {
          throw new NotFoundException(
            `No se encontraron iglesias con este departamento: ${term}`,
          );
        }

        return churchDataFormatter({ churches, mainChurch }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by province --> Many
    if (term && searchType === ChurchSearchType.Province) {
      try {
        const churches = await this.churchRepository.find({
          where: {
            province: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'anexes',
            'zones',
            'familyGroups',
            'pastors.member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const mainChurch = await this.churchRepository.findOne({
          where: { isAnexe: false, recordStatus: RecordStatus.Active },
        });

        if (churches.length === 0) {
          throw new NotFoundException(
            `No se encontraron iglesias con esta provincia: ${term}`,
          );
        }

        return churchDataFormatter({ churches, mainChurch }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by district --> Many
    if (term && searchType === ChurchSearchType.District) {
      try {
        const churches = await this.churchRepository.find({
          where: {
            district: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'anexes',
            'zones',
            'familyGroups',
            'pastors.member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const mainChurch = await this.churchRepository.findOne({
          where: { isAnexe: false, recordStatus: RecordStatus.Active },
        });

        if (churches.length === 0) {
          throw new NotFoundException(
            `No se encontraron iglesias con este distrito: ${term}`,
          );
        }

        return churchDataFormatter({ churches, mainChurch }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by urban sector --> Many
    if (term && searchType === ChurchSearchType.UrbanSector) {
      try {
        const churches = await this.churchRepository.find({
          where: {
            urbanSector: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'anexes',
            'zones',
            'familyGroups',
            'pastors.member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const mainChurch = await this.churchRepository.findOne({
          where: { isAnexe: false, recordStatus: RecordStatus.Active },
        });

        if (churches.length === 0) {
          throw new NotFoundException(
            `No se encontraron iglesias con este sector urbano: ${term}`,
          );
        }

        return churchDataFormatter({ churches, mainChurch }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by address --> Many
    if (term && searchType === ChurchSearchType.Address) {
      try {
        const churches = await this.churchRepository.find({
          where: {
            address: ILike(`%${term}%`),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'anexes',
            'zones',
            'familyGroups',
            'pastors.member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const mainChurch = await this.churchRepository.findOne({
          where: { isAnexe: false, recordStatus: RecordStatus.Active },
        });

        if (churches.length === 0) {
          throw new NotFoundException(
            `No se encontraron iglesias con esta dirección: ${term}`,
          );
        }

        return churchDataFormatter({ churches, mainChurch }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by record status --> Many
    if (term && searchType === ChurchSearchType.RecordStatus) {
      try {
        const recordStatusTerm = term.toLowerCase();
        const validRecordStatus = ['active', 'inactive'];

        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        const churches = await this.churchRepository.find({
          where: {
            recordStatus: recordStatusTerm,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'anexes',
            'zones',
            'familyGroups',
            'pastors.member',
            'copastors.member',
            'supervisors.member',
            'preachers.member',
            'disciples.member',
          ],
          relationLoadStrategy: 'query',
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const mainChurch = await this.churchRepository.findOne({
          where: { isAnexe: false, recordStatus: RecordStatus.Active },
        });

        if (churches.length === 0) {
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron iglesias con este estado de registro: ${value}`,
          );
        }

        return churchDataFormatter({ churches, mainChurch }) as any;
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
      !Object.values(ChurchSearchType).includes(searchType as ChurchSearchType)
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(ChurchSearchTypeNames).join(', ')}`,
      );
    }
  }

  //* UPDATE CHURCH
  async update(
    id: string,
    updateChurchDto: UpdateChurchDto,
    user: User,
  ): Promise<Church> {
    const {
      recordStatus,
      theirMainChurch,
      isAnexe,
      churchInactivationCategory,
      churchInactivationReason,
    } = updateChurchDto;

    //* Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido`);
    }

    const church = await this.churchRepository.findOne({
      where: { id: id },
      relations: ['theirMainChurch'],
    });

    if (!church) {
      throw new NotFoundException(`No se encontró iglesia con id: ${id}`);
    }

    if (church?.isAnexe && !isAnexe) {
      throw new BadRequestException(
        `No se puede cambiar una iglesia anexa a una central.`,
      );
    }

    if (!church?.isAnexe && theirMainChurch) {
      throw new BadRequestException(
        `No se puede cambiar la iglesia central a un anexo.`,
      );
    }

    if (
      church?.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar el registro a "Inactivo", se debe eliminar.`,
      );
    }

    //? Update if their main Church is different
    if (
      church.isAnexe &&
      theirMainChurch &&
      church?.theirMainChurch?.id !== theirMainChurch
    ) {
      //* Validate new main church
      const newMainChurch = await this.churchRepository.findOne({
        where: { id: theirMainChurch },
        relations: [
          'anexes',
          'pastors',
          'copastors',
          'supervisors',
          'zones',
          'preachers',
          'familyGroups',
          'disciples',
        ],
        relationLoadStrategy: 'query',
      });

      if (!newMainChurch) {
        throw new NotFoundException(
          `No se encontró Iglesia Central con id ${theirMainChurch}`,
        );
      }

      if (newMainChurch?.isAnexe) {
        throw new NotFoundException(
          `No se puede asignar una Iglesia Anexo como Iglesia Central`,
        );
      }

      if (newMainChurch?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Iglesia Central debe ser "Activo"`,
        );
      }

      //* Update and save
      try {
        const updatedChurch = await this.churchRepository.preload({
          id: church.id,
          ...updateChurchDto,
          churchCode:
            updateChurchDto.abbreviatedChurchName !==
            church.abbreviatedChurchName
              ? generateCodeChurch(updateChurchDto.abbreviatedChurchName)
              : church.churchCode,
          theirMainChurch: newMainChurch,
          updatedAt: new Date(),
          updatedBy: user,
          inactivationCategory:
            recordStatus === RecordStatus.Active
              ? null
              : churchInactivationCategory,
          inactivationReason:
            recordStatus === RecordStatus.Active
              ? null
              : churchInactivationReason,
          recordStatus: recordStatus,
        });

        return await this.churchRepository.save(updatedChurch);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Update and save if is same Church
    try {
      const updatedChurch = await this.churchRepository.preload({
        id: church.id,
        ...updateChurchDto,
        churchCode:
          updateChurchDto.abbreviatedChurchName !== church.abbreviatedChurchName
            ? generateCodeChurch(updateChurchDto.abbreviatedChurchName)
            : church.churchCode,
        theirMainChurch: church.theirMainChurch,
        updatedAt: new Date(),
        updatedBy: user,
        inactivationCategory:
          recordStatus === RecordStatus.Active
            ? null
            : churchInactivationCategory,
        inactivationReason:
          recordStatus === RecordStatus.Active
            ? null
            : churchInactivationReason,
        recordStatus: recordStatus,
      });

      return await this.churchRepository.save(updatedChurch);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //! INACTIVATE CHURCH
  async remove(
    id: string,
    inactivateChurchDto: InactivateChurchDto,
    user: User,
  ) {
    const { churchInactivationCategory, churchInactivationReason } =
      inactivateChurchDto;

    //* Validations
    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const church = await this.churchRepository.findOne({
      where: { id: id },
      relations: ['theirMainChurch'],
    });

    if (!church) {
      throw new NotFoundException(`Iglesia con: ${id} no fue encontrado.`);
    }

    if (!church?.isAnexe) {
      throw new NotFoundException(`La iglesia central no puede ser eliminada.`);
    }

    //* Update and set in Inactive on Church (anexe)
    try {
      const updatedChurch = await this.churchRepository.preload({
        id: church.id,
        updatedAt: new Date(),
        updatedBy: user,
        inactivationCategory: churchInactivationCategory,
        inactivationReason: churchInactivationReason,
        recordStatus: RecordStatus.Inactive,
      });

      await this.churchRepository.save(updatedChurch);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    const allMinistries = await this.ministryRepository.find({
      relations: ['theirChurch'],
    });

    const allPastors = await this.pastorRepository.find({
      relations: ['theirChurch'],
    });

    const allCopastors = await this.copastorRepository.find({
      relations: ['theirChurch'],
    });

    const allSupervisors = await this.supervisorRepository.find({
      relations: ['theirChurch'],
    });

    const allZones = await this.zoneRepository.find({
      relations: ['theirChurch'],
    });

    const allPreachers = await this.preacherRepository.find({
      relations: ['theirChurch'],
    });

    const allFamilyGroups = await this.familyGroupRepository.find({
      relations: ['theirChurch'],
    });

    const allDisciples = await this.discipleRepository.find({
      relations: ['theirChurch'],
    });

    try {
      //* Update and set to null relationships in Ministry
      const ministriesByChurch = allMinistries.filter(
        (ministry) => ministry?.theirChurch?.id === church?.id,
      );

      await Promise.all(
        ministriesByChurch.map(async (ministry) => {
          await this.pastorRepository.update(ministry?.id, {
            theirChurch: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Pastor
      const pastorsByChurch = allPastors.filter(
        (pastor) => pastor?.theirChurch?.id === church?.id,
      );

      await Promise.all(
        pastorsByChurch.map(async (pastor) => {
          await this.pastorRepository.update(pastor?.id, {
            theirChurch: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Copastor
      const copastorsByChurch = allCopastors.filter(
        (copastor) => copastor?.theirChurch?.id === church?.id,
      );

      await Promise.all(
        copastorsByChurch.map(async (copastor) => {
          await this.copastorRepository.update(copastor?.id, {
            theirChurch: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Supervisor
      const supervisorsByPastor = allSupervisors.filter(
        (supervisor) => supervisor?.theirChurch?.id === church?.id,
      );

      await Promise.all(
        supervisorsByPastor.map(async (supervisor) => {
          await this.supervisorRepository.update(supervisor?.id, {
            theirChurch: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Zone
      const zonesByPastor = allZones.filter(
        (zone) => zone?.theirChurch?.id === church?.id,
      );

      await Promise.all(
        zonesByPastor.map(async (zone) => {
          await this.zoneRepository.update(zone?.id, {
            theirChurch: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Preacher
      const preachersByPastor = allPreachers.filter(
        (preacher) => preacher?.theirChurch?.id === church?.id,
      );

      await Promise.all(
        preachersByPastor.map(async (preacher) => {
          await this.preacherRepository.update(preacher?.id, {
            theirChurch: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Family group
      const familyGroupsByPastor = allFamilyGroups.filter(
        (familyGroup) => familyGroup?.theirChurch?.id === church?.id,
      );

      await Promise.all(
        familyGroupsByPastor.map(async (familyGroup) => {
          await this.familyGroupRepository.update(familyGroup.id, {
            theirChurch: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );

      //* Update and set to null relationships in Disciple
      const disciplesByPastor = allDisciples.filter(
        (disciple) => disciple?.theirChurch?.id === church?.id,
      );

      await Promise.all(
        disciplesByPastor.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirChurch: null,
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
      } else if (detail.includes('church')) {
        throw new BadRequestException('El nombre de iglesia ya está en uso.');
      }
    }

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
