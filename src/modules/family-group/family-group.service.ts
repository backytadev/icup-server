import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrderValue, ILike, In, Raw, Repository } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { DashboardSearchType } from '@/common/enums/dashboard-search-type.enum';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { CreateFamilyGroupDto } from '@/modules/family-group/dto/create-family-group.dto';
import { UpdateFamilyGroupDto } from '@/modules/family-group/dto/update-family-group.dto';
import { InactivateFamilyGroupDto } from '@/modules/family-group/dto/inactivate-family-group.dto';

import {
  FamilyGroupSearchType,
  FamilyGroupSearchTypeNames,
} from '@/modules/family-group/enums/family-group-search-type.enum';
import { FamilyGroupSearchSubType } from '@/modules/family-group/enums/family-group-search-sub-type.enum';

import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { familyGroupDataFormatter } from '@/modules/family-group/helpers/family-group-data-formatter.helper';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';

@Injectable()
export class FamilyGroupService {
  private readonly logger = new Logger('FamilyGroupService');

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
  ) {}

  //* CREATE FAMILY GROUP
  async create(
    createFamilyGroupDto: CreateFamilyGroupDto,
    user: User,
  ): Promise<FamilyGroup> {
    const { theirPreacher } = createFamilyGroupDto;

    //? Find and validate Preacher
    if (!theirPreacher) {
      throw new NotFoundException(
        `Para crear un nuevo grupo familiar, se debe asignar un Predicador.`,
      );
    }

    const preacher = await this.preacherRepository.findOne({
      where: { id: theirPreacher },
      relations: [
        'member',
        'theirChurch',
        'theirPastor.member',
        'theirCopastor.member',
        'theirSupervisor.member',
        'theirZone',
      ],
    });

    if (!preacher) {
      throw new NotFoundException(
        `Predicador con id: ${theirPreacher} no fue encontrado.`,
      );
    }

    if (preacher?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Predicador debe ser "Activo".`,
      );
    }

    //* Validation if relationships exist
    // Supervisor
    if (!preacher?.theirSupervisor) {
      throw new NotFoundException(
        `Supervisor no fue encontrado, verifica que Predicador tenga un Supervisor asignado.`,
      );
    }

    const supervisor = await this.supervisorRepository.findOne({
      where: { id: preacher?.theirSupervisor?.id },
    });

    if (supervisor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Supervisor debe ser "Activo".`,
      );
    }

    // Zone
    if (!preacher?.theirZone) {
      throw new NotFoundException(
        `Zona no fue encontrada, verifica que Predicador tenga una Zona asignada.`,
      );
    }

    const zone = await this.zoneRepository.findOne({
      where: { id: preacher?.theirZone?.id },
    });

    if (zone?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Zona debe ser "Activo".`,
      );
    }

    // Copastor
    if (!preacher?.theirCopastor) {
      throw new NotFoundException(
        `Co-Pastor no fue encontrado, verifica que Predicador tenga un Co-Pastor asignado.`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: preacher?.theirCopastor?.id },
    });

    if (copastor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Co-Pastor debe ser "Activo".`,
      );
    }

    // Pastor
    if (!preacher?.theirPastor) {
      throw new NotFoundException(
        `Pastor no fue encontrado, verifica que Predicador tenga un Pastor asignado.`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: preacher?.theirPastor?.id },
    });

    if (pastor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Pastor debe ser "Activo".`,
      );
    }

    // Church
    if (!preacher?.theirChurch) {
      throw new NotFoundException(
        `Iglesia no fue encontrada, verifica que Predicador tenga una Iglesia asignada.`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: preacher?.theirChurch?.id },
    });

    if (church?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Iglesia debe ser "Activo".`,
      );
    }

    //? Assignment of number and code to the family group
    const allFamilyGroups = await this.familyGroupRepository.find({
      relations: ['theirZone'],
    });
    const allFamilyGroupsByZone = allFamilyGroups.filter(
      (familyGroup) => familyGroup?.theirZone?.id === zone?.id,
    );

    let familyGroupNumber: number;
    let familyGroupCode: string;

    if (allFamilyGroupsByZone.length === 0) {
      familyGroupNumber = 1;
      familyGroupCode = `${zone.zoneName.toUpperCase()}-${familyGroupNumber}`;
    }

    if (allFamilyGroupsByZone.length !== 0) {
      familyGroupNumber = allFamilyGroupsByZone.length + 1;
      familyGroupCode = `${zone.zoneName.toUpperCase()}-${familyGroupNumber}`;
    }

    //* Create new instance
    try {
      const newFamilyGroup = this.familyGroupRepository.create({
        ...createFamilyGroupDto,
        familyGroupNumber: familyGroupNumber,
        familyGroupCode: familyGroupCode,
        theirChurch: church,
        theirPastor: pastor,
        theirCopastor: copastor,
        theirSupervisor: supervisor,
        theirPreacher: preacher,
        theirZone: zone,
        createdAt: new Date(),
        createdBy: user,
      });

      const savedFamilyGroup =
        await this.familyGroupRepository.save(newFamilyGroup);

      //* Set relationship in preacher according their family group
      preacher.theirFamilyGroup = savedFamilyGroup;
      await this.preacherRepository.save(preacher);

      return savedFamilyGroup;
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

    if (isSimpleQuery || (isSimpleQuery && churchId)) {
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

        const familyGroups = await this.familyGroupRepository.find({
          where: { theirChurch: church, recordStatus: RecordStatus.Active },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return familyGroups;
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
      const familyGroups = await this.familyGroupRepository.find({
        where: { theirChurch: church, recordStatus: RecordStatus.Active },
        take: limit,
        skip: offset,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor.member',
          'theirCopastor.member',
          'theirSupervisor.member',
          'theirZone',
          'theirPreacher.member',
          'disciples.member',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (familyGroups.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return familyGroupDataFormatter({ familyGroups }) as any;
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
  ): Promise<FamilyGroup[]> {
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
    //* FamilyGroups by preacher names
    if (
      term &&
      searchType === FamilyGroupSearchType.FirstNames &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByPreacherFirstNames
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

        const familyGroups = await this.familyGroupRepository.find({
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
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con los nombres de su predicador: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by supervisor names
    if (
      term &&
      searchType === FamilyGroupSearchType.FirstNames &&
      searchSubType ===
        FamilyGroupSearchSubType.FamilyGroupBySupervisorFirstNames
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

        const familyGroups = await this.familyGroupRepository.find({
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
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con los nombres de su supervisor: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by co-pastor names
    if (
      term &&
      searchType === FamilyGroupSearchType.FirstNames &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByCopastorFirstNames
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

        const familyGroups = await this.familyGroupRepository.find({
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
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con los nombres de su co-pastor: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by pastor names
    if (
      term &&
      searchType === FamilyGroupSearchType.FirstNames &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByPastorFirstNames
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

        const familyGroups = await this.familyGroupRepository.find({
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
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con los nombres de su pastor: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by last name --> Many
    //* Family Groups by preacher last names
    if (
      term &&
      searchType === FamilyGroupSearchType.LastNames &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByPreacherLastNames
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

        const familyGroups = await this.familyGroupRepository.find({
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
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con los apellidos de su predicador: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by supervisor last names
    if (
      term &&
      searchType === FamilyGroupSearchType.LastNames &&
      searchSubType ===
        FamilyGroupSearchSubType.FamilyGroupBySupervisorLastNames
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

        const familyGroups = await this.familyGroupRepository.find({
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
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con los apellidos de su supervisor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Grupos familiares by co-pastor last names
    if (
      term &&
      searchType === FamilyGroupSearchType.LastNames &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByCopastorLastNames
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

        const familyGroups = await this.familyGroupRepository.find({
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
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con los apellidos de su co-pastor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by pastor last names
    if (
      term &&
      searchType === FamilyGroupSearchType.LastNames &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByPastorLastNames
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

        const familyGroups = await this.familyGroupRepository.find({
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
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con los apellidos de su pastor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by full name --> Many
    //* Family groups by preacher full names
    if (
      term &&
      searchType === FamilyGroupSearchType.FullNames &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByPreacherFullNames
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

        const familyGroups = await this.familyGroupRepository.find({
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
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con los nombres y apellidos de su predicador: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by supervisor full names
    if (
      term &&
      searchType === FamilyGroupSearchType.FullNames &&
      searchSubType ===
        FamilyGroupSearchSubType.FamilyGroupBySupervisorFullNames
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

        const familyGroups = await this.familyGroupRepository.find({
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
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con los nombres y apellidos de su supervisor: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by co-pastor full names
    if (
      term &&
      searchType === FamilyGroupSearchType.FullNames &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByCopastorFullNames
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

        const familyGroups = await this.familyGroupRepository.find({
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
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con los nombres y apellidos de su co-pastor: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Family groups by pastor full names
    if (
      term &&
      searchType === FamilyGroupSearchType.FullNames &&
      searchSubType === FamilyGroupSearchSubType.FamilyGroupByPastorFullNames
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

        const familyGroups = await this.familyGroupRepository.find({
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
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con los nombres y apellidos de su pastor: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by family-group-code --> Many
    if (term && searchType === FamilyGroupSearchType.FamilyGroupCode) {
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
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con este código: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by family-group-name --> Many
    if (term && searchType === FamilyGroupSearchType.FamilyGroupName) {
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
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con este nombre: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by zone name --> Many
    if (term && searchType === FamilyGroupSearchType.ZoneName) {
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

        const familyGroups = await this.familyGroupRepository.find({
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
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con este nombre zona: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by country --> Many
    if (term && searchType === FamilyGroupSearchType.Country) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
          where: {
            theirChurch: church,
            // country: ILike(`%${term}%`),
            country: Raw(
              (alias) =>
                `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
              { searchTerm: `%${term.toLowerCase()}%` },
            ),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con este país: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by department --> Many
    if (term && searchType === FamilyGroupSearchType.Department) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
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
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con este departamento: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by province --> Many
    if (term && searchType === FamilyGroupSearchType.Province) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
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
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con esta provincia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by district --> Many
    if (term && searchType === FamilyGroupSearchType.District) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
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
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con este distrito: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by urban sector --> Many
    if (term && searchType === FamilyGroupSearchType.UrbanSector) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
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
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con este sector urbano: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by address --> Many
    if (term && searchType === FamilyGroupSearchType.Address) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
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
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(
            `No se encontraron grupos familiares con esta dirección: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by status --> Many
    if (term && searchType === FamilyGroupSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      if (!validRecordStatus.includes(recordStatusTerm)) {
        throw new BadRequestException(`Estado de registro no válido: ${term}`);
      }

      try {
        const familyGroups = await this.familyGroupRepository.find({
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
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron grupos familiares con este estado de registro: ${value} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return familyGroupDataFormatter({ familyGroups }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find family groups by most populated --> Many
    if (term && searchType === DashboardSearchType.MostPopulatedFamilyGroups) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
          where: {
            theirChurch: church,
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(`No se encontraron grupos familiares`);
        }

        const dataResult = familyGroups
          .sort((a, b) => b.disciples.length - a.disciples.length)
          .slice(0, 7);

        return familyGroupDataFormatter({
          familyGroups: dataResult,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by less populated --> Many
    if (term && searchType === DashboardSearchType.LessPopulatedFamilyGroups) {
      try {
        const familyGroups = await this.familyGroupRepository.find({
          where: {
            theirChurch: church,
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (familyGroups.length === 0) {
          throw new NotFoundException(`No se encontraron grupos familiares`);
        }

        const dataResult = familyGroups
          .sort((a, b) => a.disciples.length - b.disciples.length)
          .slice(0, 7);

        return familyGroupDataFormatter({
          familyGroups: dataResult,
        }) as any;
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
      !Object.values(FamilyGroupSearchType).includes(
        searchType as FamilyGroupSearchType,
      )
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(FamilyGroupSearchTypeNames).join(', ')}`,
      );
    }

    if (
      term &&
      (FamilyGroupSearchType.FirstNames ||
        FamilyGroupSearchType.LastNames ||
        FamilyGroupSearchType.FullNames) &&
      !searchSubType
    ) {
      throw new BadRequestException(
        `Para buscar por nombres o apellidos el sub-tipo es requerido.`,
      );
    }
  }

  //* UPDATE FAMILY GROUP
  async update(
    id: string,
    updateFamilyGroupDto: UpdateFamilyGroupDto,
    user: User,
  ): Promise<FamilyGroup> {
    const {
      recordStatus,
      theirPreacher,
      newTheirPreacher,
      familyGroupInactivationCategory,
      familyGroupInactivationReason,
    } = updateFamilyGroupDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    //* Validation current family group
    const familyGroup = await this.familyGroupRepository.findOne({
      where: { id: id },
      relations: [
        'theirChurch',
        'theirPastor.member',
        'theirCopastor.member',
        'theirSupervisor.member',
        'theirZone',
        'theirPreacher.member',
        'disciples.member',
      ],
    });

    if (!familyGroup) {
      throw new NotFoundException(
        `Grupo Familiar con id: ${id} no fue encontrado.`,
      );
    }

    if (
      familyGroup?.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
      );
    }

    //? Update if new preacher exits and is different but zone is same (exchange preachers)
    if (newTheirPreacher) {
      //* Validation new preacher
      const newPreacher = await this.preacherRepository.findOne({
        where: { id: newTheirPreacher },
        relations: [
          'theirChurch',
          'theirPastor.member',
          'theirCopastor.member',
          'theirSupervisor.member',
          'theirZone',
          'theirFamilyGroup',
        ],
      });

      if (!newPreacher) {
        throw new NotFoundException(
          `Predicador con id: ${newTheirPreacher} no fue encontrado.`,
        );
      }

      if (!newPreacher?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en Predicador debe ser "Activo".`,
        );
      }

      if (
        familyGroup?.theirPreacher?.id !== newPreacher?.id &&
        familyGroup?.theirZone?.id === newPreacher?.theirZone?.id
      ) {
        //? Validation relation exists in current Family group
        // Preacher
        if (!familyGroup?.theirPreacher) {
          throw new BadRequestException(
            `Predicador no fue encontrado, verifica que el Grupo Familiar actual tenga un Predicador asignado.`,
          );
        }

        if (
          familyGroup?.theirPreacher?.recordStatus === RecordStatus.Inactive
        ) {
          throw new BadRequestException(
            `La propiedad "Estado de Registro" en la relación de Predicador del Grupo Familiar actual debe ser "Activo".`,
          );
        }

        // Supervisor
        if (!familyGroup?.theirSupervisor) {
          throw new BadRequestException(
            `Supervisor no fue encontrado, verifica que el Grupo Familiar actual tenga un Supervisor asignado.`,
          );
        }

        if (
          familyGroup?.theirSupervisor?.recordStatus === RecordStatus.Inactive
        ) {
          throw new BadRequestException(
            `La propiedad "Estado de Registro" en la relación de Supervisor del Grupo Familiar actual debe ser "Activo".`,
          );
        }

        // Zone
        if (!familyGroup?.theirZone) {
          throw new BadRequestException(
            `Zona no fue encontrada, verifica que el Grupo Familiar actual tenga una Zona asignada.`,
          );
        }

        if (familyGroup?.theirZone?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de Registro" en la relación de Zona del Grupo Familiar actual debe ser "Activo".`,
          );
        }

        // Co-Pastor
        if (!familyGroup?.theirCopastor) {
          throw new BadRequestException(
            `Co-Pastor no fue encontrado, verifica que el Grupo Familiar actual tenga un Co-Pastor asignado.`,
          );
        }

        if (
          familyGroup?.theirCopastor?.recordStatus === RecordStatus.Inactive
        ) {
          throw new BadRequestException(
            `La propiedad "Estado de Registro" en la relación de Co-Pastor del Grupo Familiar actual debe ser "Activo".`,
          );
        }

        // Pastor
        if (!familyGroup?.theirPastor) {
          throw new BadRequestException(
            `Pastor no fue encontrado, verifica que el Grupo Familiar actual tenga un Pastor asignado.`,
          );
        }

        if (familyGroup?.theirPastor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de Registro" en la relación de Pastor del Grupo Familiar actual debe ser "Activo".`,
          );
        }

        // Church
        if (!familyGroup?.theirChurch) {
          throw new BadRequestException(
            `Iglesia no fue encontrada, verifica que el Grupo Familiar actual tenga una Iglesia asignada.`,
          );
        }

        if (familyGroup?.theirChurch?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de Registro" en la relación de Iglesia del Grupo Familiar actual debe ser "Activo".`,
          );
        }

        //! Validation same relations between new and current family group
        if (familyGroup?.theirZone?.id !== newPreacher.theirZone?.id) {
          throw new BadRequestException(
            `Para actualizar de Predicador este Grupo Familiar, la zona del nuevo Predicador debe ser la misma que la del Grupo Familiar.`,
          );
        }

        if (
          familyGroup?.theirSupervisor?.id !== newPreacher.theirSupervisor?.id
        ) {
          throw new BadRequestException(
            `Para actualizar de Predicador este Grupo Familiar, el supervisor del nuevo Predicador debe ser el mismo que la del Grupo Familiar.`,
          );
        }

        if (familyGroup?.theirCopastor?.id !== newPreacher.theirCopastor?.id) {
          throw new BadRequestException(
            `Para actualizar de Predicador este Grupo Familiar, el co-pastor del nuevo Predicador debe ser el mismo que la del Grupo Familiar.`,
          );
        }

        if (familyGroup?.theirPastor?.id !== newPreacher.theirPastor?.id) {
          throw new BadRequestException(
            `Para actualizar de Predicador este Grupo Familiar, el pastor del nuevo Predicador debe ser el mismo que la del Grupo Familiar.`,
          );
        }

        if (familyGroup?.theirChurch?.id !== newPreacher.theirChurch?.id) {
          throw new BadRequestException(
            `Para actualizar de Predicador este Grupo Familiar, la iglesia del nuevo Predicador debe ser la misma que la del Grupo Familiar.`,
          );
        }

        //? Validation relation exists in new Preacher
        // Supervisor
        if (!newPreacher?.theirSupervisor) {
          throw new NotFoundException(
            `Supervisor no fue encontrado, verifica que el nuevo Predicador tenga un Supervisor asignado.`,
          );
        }

        const newSupervisor = await this.supervisorRepository.findOne({
          where: { id: newPreacher?.theirSupervisor?.id },
        });

        if (newSupervisor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de Registro" en el nuevo Supervisor debe ser "Activo".`,
          );
        }

        // Zone
        if (!newPreacher?.theirZone) {
          throw new NotFoundException(
            `Zona no fue encontrada, verifica que el nuevo Predicador tenga una Zona asignada.`,
          );
        }

        const newZone = await this.zoneRepository.findOne({
          where: { id: newPreacher?.theirZone?.id },
        });

        if (newZone?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de Registro" en la nueva Zona debe ser "Activo".`,
          );
        }

        // Copastor
        if (!newPreacher?.theirCopastor) {
          throw new NotFoundException(
            `Co-Pastor no fue encontrado, verifica que el nuevo Predicador tenga un Co-Pastor asignado.`,
          );
        }

        const newCopastor = await this.copastorRepository.findOne({
          where: { id: newPreacher?.theirCopastor?.id },
        });

        if (newCopastor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de Registro" en el nuevo Co-Pastor debe ser "Activo".`,
          );
        }

        // Pastor
        if (!newPreacher?.theirPastor) {
          throw new NotFoundException(
            `Pastor no fue encontrado, verifica que el nuevo Predicador tenga un Pastor asignado.`,
          );
        }

        const newPastor = await this.pastorRepository.findOne({
          where: { id: newPreacher?.theirPastor?.id },
        });

        if (newPastor?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de Registro" en el nuevo Pastor debe ser "Activo".`,
          );
        }

        // Church
        if (!newPreacher?.theirChurch) {
          throw new NotFoundException(
            `Iglesia no fue encontrada, verifica que el nuevo Predicador tenga una Iglesia asignada.`,
          );
        }

        const newChurch = await this.churchRepository.findOne({
          where: { id: newPreacher?.theirChurch?.id },
        });

        if (newChurch?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de Registro" en la nueva Iglesia debe ser "Activo".`,
          );
        }

        //! Exchange of preachers between family groups
        //* Current Values
        const currentFamilyGroupPreacher = familyGroup?.theirPreacher;
        const currentFamilyGroupDisciples = familyGroup?.disciples?.map(
          (disciple) => disciple,
        );

        //* New values
        if (!newPreacher?.theirFamilyGroup) {
          throw new BadRequestException(
            `Es necesario tener un grupo familiar asignado en el nuevo predicador, para poder intercambiarlos.`,
          );
        }

        const newFamilyGroup = await this.familyGroupRepository.findOne({
          where: { id: newPreacher?.theirFamilyGroup?.id },
          relations: [
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
            'disciples.member',
          ],
        });

        if (!newFamilyGroup) {
          throw new BadRequestException(
            `Grupo Familiar con id: ${newPreacher?.theirFamilyGroup?.id} no fue encontrado.`,
          );
        }

        if (newFamilyGroup?.recordStatus === RecordStatus.Inactive) {
          throw new BadRequestException(
            `La propiedad "Estado de Registro" en el nuevo Grupo Familiar debe ser "Activo".`,
          );
        }

        const newFamilyGroupPreacher = newPreacher;
        const newFamilyGroupDisciples = newFamilyGroup?.disciples?.map(
          (disciple) => disciple,
        );

        //! Remove relationships from current family group and preacher
        //* Preacher
        try {
          const updateCurrentPreacher = await this.preacherRepository.preload({
            id: familyGroup?.theirPreacher?.id,
            theirFamilyGroup: null,
            updatedAt: new Date(),
            updatedBy: user,
          });

          await this.preacherRepository.save(updateCurrentPreacher);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        //* Family Group
        try {
          const updateCurrentFamilyGroup =
            await this.familyGroupRepository.preload({
              id: familyGroup?.id,
              theirPreacher: null,
              updatedAt: new Date(),
              updatedBy: user,
            });
          await this.familyGroupRepository.save(updateCurrentFamilyGroup);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        //! Remove relationships from new family group and preacher
        //* Preacher
        try {
          const updateNewPreacher = await this.preacherRepository.preload({
            id: newFamilyGroup?.theirPreacher?.id,
            theirFamilyGroup: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
          await this.preacherRepository.save(updateNewPreacher);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        //* Family Group
        try {
          const updateNewFamilyGroup = await this.familyGroupRepository.preload(
            {
              id: newFamilyGroup?.id,
              theirPreacher: null,
              updatedAt: new Date(),
              updatedBy: user,
            },
          );
          await this.familyGroupRepository.save(updateNewFamilyGroup);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        //? Set the new preacher and family group to the current values
        try {
          const updateCurrentFamilyGroup =
            await this.familyGroupRepository.preload({
              id: familyGroup?.id,
              theirPreacher: newFamilyGroupPreacher,
              updatedAt: new Date(),
              updatedBy: user,
            });

          await this.familyGroupRepository.save(updateCurrentFamilyGroup);

          const updateCurrentPreacher = await this.preacherRepository.preload({
            id: familyGroup?.theirPreacher?.id,
            theirFamilyGroup: newFamilyGroup,
            updatedAt: new Date(),
            updatedBy: user,
          });

          await this.preacherRepository.save(updateCurrentPreacher);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        //? Set the current preacher and family group to the new values
        try {
          const updateNewFamilyGroup = await this.familyGroupRepository.preload(
            {
              id: newFamilyGroup?.id,
              theirPreacher: currentFamilyGroupPreacher,
              updatedAt: new Date(),
              updatedBy: user,
            },
          );

          await this.familyGroupRepository.save(updateNewFamilyGroup);

          const updateNewPreacher = await this.preacherRepository.preload({
            id: newFamilyGroup?.theirPreacher?.id,
            theirFamilyGroup: familyGroup,
            updatedAt: new Date(),
            updatedBy: user,
          });

          await this.preacherRepository.save(updateNewPreacher);
        } catch (error) {
          this.handleDBExceptions(error);
        }

        //* Update relationships and set disciples up for their new family group
        try {
          await Promise.all(
            newFamilyGroupDisciples?.map(async (disciple) => {
              await this.discipleRepository.update(disciple?.id, {
                theirPreacher: currentFamilyGroupPreacher,
                updatedAt: new Date(),
                updatedBy: user,
              });
            }),
          );
        } catch (error) {
          this.handleDBExceptions(error);
        }

        try {
          await Promise.all(
            currentFamilyGroupDisciples?.map(async (disciple) => {
              await this.discipleRepository.update(disciple?.id, {
                theirPreacher: newFamilyGroupPreacher,
                updatedAt: new Date(),
                updatedBy: user,
              });
            }),
          );
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //? Update and save if is same Preacher and Zone
    if (
      !newTheirPreacher &&
      updateFamilyGroupDto?.theirPreacher === familyGroup.theirPreacher?.id &&
      updateFamilyGroupDto?.theirZone === familyGroup.theirZone?.id
    ) {
      const updatedFamilyGroup = await this.familyGroupRepository.preload({
        id: familyGroup?.id,
        ...updateFamilyGroupDto,
        theirChurch: familyGroup.theirChurch,
        theirPastor: familyGroup.theirPastor,
        theirCopastor: familyGroup.theirCopastor,
        theirSupervisor: familyGroup.theirSupervisor,
        theirZone: familyGroup.theirZone,
        theirPreacher: familyGroup.theirPreacher,
        updatedAt: new Date(),
        updatedBy: user,
        inactivationCategory:
          recordStatus === RecordStatus.Active
            ? null
            : familyGroupInactivationCategory,
        inactivationReason:
          recordStatus === RecordStatus.Active
            ? null
            : familyGroupInactivationReason,
        recordStatus: recordStatus,
      });

      try {
        return await this.familyGroupRepository.save(updatedFamilyGroup);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Update and save if is different Preacher (not newPreacher) and same Zone (inactive to active record and when delete preacher), disciple without family group.
    if (
      !newTheirPreacher &&
      updateFamilyGroupDto?.theirPreacher !== familyGroup.theirPreacher?.id &&
      updateFamilyGroupDto?.theirZone === familyGroup.theirZone?.id
    ) {
      //* Validation preacher
      const newPreacher = await this.preacherRepository.findOne({
        where: { id: theirPreacher },
        relations: [
          'theirChurch',
          'theirPastor.member',
          'theirCopastor.member',
          'theirSupervisor.member',
          'theirZone',
          'theirFamilyGroup',
        ],
      });

      if (!newPreacher) {
        throw new NotFoundException(
          `Predicador con id: ${newTheirPreacher} no fue encontrado.`,
        );
      }

      if (!newPreacher?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en Predicador debe ser "Activo".`,
        );
      }

      //! Validation same relations
      if (newPreacher?.theirZone?.id !== familyGroup?.theirZone?.id) {
        throw new BadRequestException(
          `Para actualizar de Predicador este Grupo Familiar, la zona del nuevo Predicador debe ser la misma que la del Grupo Familiar.`,
        );
      }

      //* Validation relation exists in new Preacher
      // Supervisor
      if (!newPreacher?.theirSupervisor) {
        throw new NotFoundException(
          `Supervisor no fue encontrado, verifica que el nuevo Predicador tenga un Supervisor asignado.`,
        );
      }

      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: newPreacher?.theirSupervisor?.id },
      });

      if (newSupervisor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en el nuevo Supervisor debe ser "Activo".`,
        );
      }

      // Zone
      if (!newPreacher?.theirZone) {
        throw new NotFoundException(
          `Zona no fue encontrada, verifica que el nuevo Predicador tenga una Zona asignada.`,
        );
      }

      const newZone = await this.zoneRepository.findOne({
        where: { id: newPreacher?.theirZone?.id },
      });

      if (newZone?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la nueva Zona debe ser "Activo".`,
        );
      }

      // Copastor
      if (!newPreacher?.theirCopastor) {
        throw new NotFoundException(
          `Co-Pastor no fue encontrado, verifica que el nuevo Predicador tenga un Co-Pastor asignado.`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newPreacher?.theirCopastor?.id },
      });

      if (newCopastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en el nuevo Co-Pastor debe ser "Activo".`,
        );
      }

      // Pastor
      if (!newPreacher?.theirPastor) {
        throw new NotFoundException(
          `Pastor no fue encontrado, verifica que el nuevo Predicador tenga un Pastor asignado.`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newPreacher?.theirPastor?.id },
      });

      if (newPastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en el nuevo Pastor debe ser "Activo".`,
        );
      }

      // Church
      if (!newPreacher?.theirChurch) {
        throw new NotFoundException(
          `Iglesia no fue encontrada, verifica que el nuevo Predicador tenga una Iglesia asignada.`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newPreacher?.theirChurch?.id },
      });

      if (newChurch?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la nueva Iglesia debe ser "Activo".`,
        );
      }

      let savedFamilyGroup: FamilyGroup;
      try {
        const updatedFamilyGroup = await this.familyGroupRepository.preload({
          id: familyGroup?.id,
          ...updateFamilyGroupDto,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newSupervisor,
          theirZone: newZone,
          theirPreacher: newPreacher,
          updatedAt: new Date(),
          updatedBy: user,
          inactivationCategory:
            recordStatus === RecordStatus.Active
              ? null
              : familyGroupInactivationCategory,
          inactivationReason:
            recordStatus === RecordStatus.Active
              ? null
              : familyGroupInactivationReason,
          recordStatus: recordStatus,
        });

        //* Set relationship in preacher according their family group
        newPreacher.theirFamilyGroup = updatedFamilyGroup;
        await this.preacherRepository.save(newPreacher);

        savedFamilyGroup =
          await this.familyGroupRepository.save(updatedFamilyGroup);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? Update in subordinate relations
      const allDisciples = await this.discipleRepository.find({
        relations: ['theirFamilyGroup', 'theirPreacher'],
      });

      //* Update in all family groups the new relations.
      try {
        const disciplesByFamilyGroup = allDisciples.filter(
          (disciple) =>
            disciple?.theirFamilyGroup?.id === familyGroup?.id ||
            disciple?.theirPreacher?.id === newPreacher?.id,
        );

        await Promise.all(
          disciplesByFamilyGroup.map(async (disciple) => {
            await this.discipleRepository.update(disciple?.id, {
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: newCopastor,
              theirSupervisor: newSupervisor,
              theirPreacher: newPreacher,
              theirFamilyGroup: savedFamilyGroup,
              theirZone: newZone,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );

        return savedFamilyGroup;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }
  }

  //! INACTIVATE FAMILY GROUP
  async remove(
    id: string,
    inactivateFamilyGroupDto: InactivateFamilyGroupDto,
    user: User,
  ): Promise<void> {
    const { familyGroupInactivationCategory, familyGroupInactivationReason } =
      inactivateFamilyGroupDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const familyGroup = await this.familyGroupRepository.findOne({
      where: { id: id },
    });

    if (!familyGroup) {
      throw new NotFoundException(
        `Grupo Familiar con id: ${id} no fue encontrado.`,
      );
    }

    //* Update and set in Inactive on Family Group
    try {
      const updatedFamilyGroup = await this.familyGroupRepository.preload({
        id: familyGroup.id,
        updatedAt: new Date(),
        updatedBy: user,
        theirPreacher: null,
        inactivationCategory: familyGroupInactivationCategory,
        inactivationReason: familyGroupInactivationReason,
        recordStatus: RecordStatus.Inactive,
      });

      await this.familyGroupRepository.save(updatedFamilyGroup);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in preacher their family group
    const allPreachers = await this.preacherRepository.find({
      relations: ['theirFamilyGroup'],
    });

    try {
      const preachersFamilyGroup = allPreachers.filter(
        (preacher) => preacher.theirFamilyGroup?.id === familyGroup?.id,
      );

      await Promise.all(
        preachersFamilyGroup.map(async (preacher) => {
          await this.preacherRepository.update(preacher?.id, {
            theirFamilyGroup: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirFamilyGroup'],
    });

    try {
      //* Update and set to null relationships in Disciple
      const disciplesByFamilyGroup = allDisciples.filter(
        (disciple) => disciple.theirFamilyGroup?.id === familyGroup?.id,
      );

      await Promise.all(
        disciplesByFamilyGroup.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirFamilyGroup: null,
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

      if (detail.includes('group')) {
        throw new BadRequestException(
          'El nombre de grupo familiar ya está existe.',
        );
      }
    }

    this.logger.error(error);
    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
