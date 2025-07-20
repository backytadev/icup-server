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

import {
  ZoneSearchType,
  ZoneSearchTypeNames,
} from '@/modules/zone/enums/zone-search-type.enum';
import { ZoneSearchSubType } from '@/modules/zone/enums/zone-search-sub-type.enum';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { zoneDataFormatter } from '@/modules/zone/helpers/zone-data-formatter.helper';

import { CreateZoneDto } from '@/modules/zone/dto/create-zone.dto';
import { UpdateZoneDto } from '@/modules/zone/dto/update-zone.dto';
import { InactivateZoneDto } from '@/modules/zone/dto/inactivate-zone.dto';

import { User } from '@/modules/user/entities/user.entity';
import { Zone } from '@/modules/zone/entities/zone.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';

@Injectable()
export class ZoneService {
  private readonly logger = new Logger('ZoneService');

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

  //* CREATE ZONE
  async create(createZoneDto: CreateZoneDto, user: User): Promise<Zone> {
    const { theirSupervisor } = createZoneDto;

    //? Validate and assign supervisor
    if (!theirSupervisor) {
      throw new NotFoundException(
        `Para crear una Zona debe asignar un Supervisor.`,
      );
    }
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: theirSupervisor },
      relations: [
        'theirChurch',
        'theirCopastor.member',
        'theirPastor.member',
        'theirZone',
      ],
    });

    if (!supervisor) {
      throw new NotFoundException(
        `Supervisor con id: ${theirSupervisor} no fue encontrado.`,
      );
    }

    if (supervisor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
      );
    }

    //* Validate copastor if exists
    let copastor: Copastor | null;
    if (!supervisor?.theirCopastor) {
      copastor = null;
    }

    if (supervisor?.theirCopastor) {
      copastor = await this.copastorRepository.findOne({
        where: { id: supervisor?.theirCopastor?.id },
      });

      if (copastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
        );
      }
    }

    //* Validate and assign pastor according supervisor
    if (!supervisor?.theirPastor) {
      throw new NotFoundException(
        `Pastor no fue encontrado, verifica que Supervisor tenga un Pastor asignado.`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: supervisor?.theirPastor?.id },
    });

    if (pastor?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
      );
    }

    //* Validate and assign church according supervisor
    if (!supervisor?.theirChurch) {
      throw new NotFoundException(
        `Iglesia no fue encontrada, verifica que Supervisor tenga una Iglesia asignada.`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: supervisor?.theirChurch?.id },
    });

    if (church?.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
      );
    }

    // Create new instance
    try {
      const newZone = this.zoneRepository.create({
        ...createZoneDto,
        theirChurch: church,
        theirPastor: pastor,
        theirCopastor: copastor,
        theirSupervisor: supervisor,
        createdAt: new Date(),
        createdBy: user,
      });

      const savedZone = await this.zoneRepository.save(newZone);

      supervisor.theirZone = savedZone;

      await this.supervisorRepository.save(supervisor);
      return savedZone;
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

        const zones = await this.zoneRepository.find({
          where: { theirChurch: church, recordStatus: RecordStatus.Active },
          relations: ['familyGroups'],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return zones;
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

      const zones = await this.zoneRepository.find({
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
          'familyGroups',
          'preachers.member',
          'disciples.member',
        ],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (zones.length === 0) {
        throw new NotFoundException(
          `No existen registros disponibles para mostrar.`,
        );
      }

      return zoneDataFormatter({ zones }) as any;
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
  ): Promise<Zone[]> {
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
    //* Zones by supervisor names
    if (
      term &&
      searchType === ZoneSearchType.FirstNames &&
      searchSubType === ZoneSearchSubType.ZoneBySupervisorFirstNames
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

        const zones = await this.zoneRepository.find({
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
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con los nombres de su supervisor: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Zone by co-pastor names
    if (
      term &&
      searchType === ZoneSearchType.FirstNames &&
      searchSubType === ZoneSearchSubType.ZoneByCopastorFirstNames
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

        const zones = await this.zoneRepository.find({
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
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con los nombres de su co-pastor: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Zone by pastor names
    if (
      term &&
      searchType === ZoneSearchType.FirstNames &&
      searchSubType === ZoneSearchSubType.ZoneByPastorFirstNames
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

        const zones = await this.zoneRepository.find({
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
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con los nombres de su pastor: ${firstNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by last name --> Many
    //* Zone by supervisor last names
    if (
      term &&
      searchType === ZoneSearchType.LastNames &&
      searchSubType === ZoneSearchSubType.ZoneBySupervisorLastNames
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

        const zones = await this.zoneRepository.find({
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
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con los apellidos de su supervisor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Zones by co-pastor last names
    if (
      term &&
      searchType === ZoneSearchType.LastNames &&
      searchSubType === ZoneSearchSubType.ZoneByCopastorLastNames
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

        const zones = await this.zoneRepository.find({
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
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con los apellidos de su co-pastor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Zone by pastor last names
    if (
      term &&
      searchType === ZoneSearchType.LastNames &&
      searchSubType === ZoneSearchSubType.ZoneByPastorLastNames
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

        const zones = await this.zoneRepository.find({
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
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con los apellidos de su pastor: ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by full name --> Many
    //* Zones by supervisor full names
    if (
      term &&
      searchType === ZoneSearchType.FullNames &&
      searchSubType === ZoneSearchSubType.ZoneBySupervisorFullNames
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

        const zones = await this.zoneRepository.find({
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
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con los nombres y apellidos de su supervisor: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Zones by co-pastor full names
    if (
      term &&
      searchType === ZoneSearchType.FullNames &&
      searchSubType === ZoneSearchSubType.ZoneByCopastorFullNames
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

        const zones = await this.zoneRepository.find({
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
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con los nombres y apellidos de su co-pastor: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Zones by pastor full names
    if (
      term &&
      searchType === ZoneSearchType.FullNames &&
      searchSubType === ZoneSearchSubType.ZoneByPastorFullNames
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

        const zones = await this.zoneRepository.find({
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
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con los nombres y apellidos de su pastor: ${firstNames} ${lastNames} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by zone name --> Many
    if (term && searchType === ZoneSearchType.ZoneName) {
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
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con este nombre: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by country --> Many
    if (term && searchType === ZoneSearchType.Country) {
      try {
        const zones = await this.zoneRepository.find({
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
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con este país: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by department --> Many
    if (term && searchType === ZoneSearchType.Department) {
      try {
        const zones = await this.zoneRepository.find({
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
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con este departamento: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by province --> Many
    if (term && searchType === ZoneSearchType.Province) {
      try {
        const zones = await this.zoneRepository.find({
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
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con esta provincia: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by district --> Many
    if (term && searchType === ZoneSearchType.District) {
      try {
        const zones = await this.zoneRepository.find({
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
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          throw new NotFoundException(
            `No se encontraron zonas con este distrito: ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //? Find by status --> Many
    if (term && searchType === ZoneSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      try {
        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        const zones = await this.zoneRepository.find({
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
            'familyGroups',
            'preachers.member',
            'disciples.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (zones.length === 0) {
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron zonas con este estado de registro: ${value} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return zoneDataFormatter({ zones }) as any;
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
      !Object.values(ZoneSearchType).includes(searchType as ZoneSearchType)
    ) {
      throw new BadRequestException(
        `Tipos de búsqueda no validos, solo son validos: ${Object.values(ZoneSearchTypeNames).join(', ')}`,
      );
    }

    if (
      term &&
      (ZoneSearchType.FirstNames ||
        ZoneSearchType.LastNames ||
        ZoneSearchType.FullNames) &&
      !searchSubType
    ) {
      throw new BadRequestException(
        `Para buscar por nombres o apellidos el sub-tipo es requerido.`,
      );
    }
  }

  //* UPDATE ZONE
  async update(
    id: string,
    updateZoneDto: UpdateZoneDto,
    user: User,
  ): Promise<Zone> {
    const {
      recordStatus,
      theirSupervisor,
      newTheirSupervisor,
      zoneInactivationCategory,
      zoneInactivationReason,
    } = updateZoneDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    //* Validation zone
    const zone = await this.zoneRepository.findOne({
      where: { id: id },
      relations: [
        'theirChurch',
        'theirPastor.member',
        'theirCopastor.member',
        'theirSupervisor.member',
        'preachers.member',
        'familyGroups',
        'disciples.member',
      ],
    });

    if (!zone) {
      throw new NotFoundException(`Zona con id: ${id} no fue encontrado.`);
    }

    if (
      zone?.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
      );
    }

    //! Exchange of supervisor between zones
    //? Update Zone if their Supervisor is different and newSupervisor exists
    if (newTheirSupervisor && zone.theirSupervisor?.id !== newTheirSupervisor) {
      //* Validate new supervisor
      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: newTheirSupervisor },
        relations: ['theirChurch', 'theirPastor', 'theirCopastor', 'theirZone'],
      });

      if (!newSupervisor) {
        throw new NotFoundException(
          `Supervisor con id:  ${newTheirSupervisor} no fue encontrado.`,
        );
      }

      if (newSupervisor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
        );
      }

      //? Validation if relation exists in current zone
      //* Supervisor
      if (!zone?.theirSupervisor) {
        throw new BadRequestException(
          `Supervisor no fue encontrado, verifica que la Zona actual tenga un Supervisor asignado.`,
        );
      }

      const supervisor = await this.supervisorRepository.findOne({
        where: { id: zone?.theirSupervisor?.id },
        relations: ['theirChurch', 'theirPastor', 'theirCopastor', 'theirZone'],
      });

      if (supervisor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la relación de Supervisor del Zona actual debe ser "Activo".`,
        );
      }

      //* Co-Pastor
      if (!zone?.theirCopastor) {
        throw new BadRequestException(
          `Co-Pastor no fue encontrado, verifica que la Zona actual tenga un Co-Pastor asignado.`,
        );
      }

      const copastor = await this.copastorRepository.findOne({
        where: { id: zone?.theirCopastor?.id },
      });

      if (copastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la relación de Co-Pastor del Zona actual debe ser "Activo".`,
        );
      }

      //* Pastor
      if (!zone?.theirPastor) {
        throw new BadRequestException(
          `Pastor no fue encontrado, verifica que la Zona actual tenga un Pastor asignado.`,
        );
      }

      const pastor = await this.pastorRepository.findOne({
        where: { id: zone?.theirPastor?.id },
      });

      if (pastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la relación de Pastor del Zona actual debe ser "Activo".`,
        );
      }

      //* Church
      if (!zone?.theirChurch) {
        throw new BadRequestException(
          `Iglesia no fue encontrada, verifica que la Zona actual tenga una Iglesia asignada.`,
        );
      }

      const church = await this.churchRepository.findOne({
        where: { id: zone?.theirChurch?.id },
      });

      if (church?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la relación de Iglesia de la Zona actual debe ser "Activo".`,
        );
      }

      //! Validation same relations between new and current zone
      if (zone?.theirCopastor?.id !== newSupervisor.theirCopastor?.id) {
        throw new BadRequestException(
          `Para actualizar de Supervisor esta Zona, el Co-Pastor del nuevo Supervisor debe ser el mismo que el de la Zona.`,
        );
      }

      if (zone?.theirPastor?.id !== newSupervisor.theirPastor?.id) {
        throw new BadRequestException(
          `Para actualizar de Supervisor esta Zona, el Pastor del nuevo Supervisor debe ser el mismo que la de la Zona.`,
        );
      }

      if (zone?.theirChurch?.id !== newSupervisor.theirChurch?.id) {
        throw new BadRequestException(
          `Para actualizar de Supervisor esta Zona, la Iglesia del nuevo Supervisor debe ser la misma que la de la Zona.`,
        );
      }

      //? Validation if relation exists in new zone
      //* Validate Copastor according new supervisor
      if (!newSupervisor?.theirCopastor) {
        throw new BadRequestException(
          `No se encontró el Co-Pastor, verifica que Supervisor tenga un Co-Pastor asignado.`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newSupervisor?.theirCopastor?.id },
      });

      if (newCopastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
        );
      }

      //* Validate Pastor according new supervisor
      if (!newSupervisor?.theirPastor) {
        throw new BadRequestException(
          `No se encontró el Pastor, verifica que Supervisor tenga un Pastor asignado.`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newSupervisor?.theirPastor?.id },
      });

      if (newPastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
        );
      }

      //* Validate Church according new supervisor
      if (!newSupervisor?.theirChurch) {
        throw new BadRequestException(
          `No se encontró la Iglesia, verifica que Supervisor tenga una Iglesia asignada.`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newSupervisor?.theirChurch?.id },
      });

      if (newChurch?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
        );
      }

      //! Exchange of supervisors, preacher and family groups and disciples between zones
      //* Current Values
      const currentZoneSupervisor = supervisor;
      const currentZonePreachers = zone?.preachers?.map((preacher) => preacher);
      const currentZoneFamilyGroups = zone?.familyGroups?.map(
        (familyGroup) => familyGroup,
      );
      const currentZoneDisciples = zone?.disciples?.map((disciple) => disciple);

      //* New values
      if (!newSupervisor?.theirZone) {
        throw new BadRequestException(
          `Ese necesario tener una zona asignado en el nuevo supervisor, para poder intercambiarlos.`,
        );
      }

      const newZone = await this.zoneRepository.findOne({
        where: { id: newSupervisor?.theirZone?.id },
        relations: [
          'theirChurch',
          'theirPastor',
          'theirCopastor',
          'theirSupervisor',
          'preachers',
          'familyGroups',
          'disciples',
        ],
      });

      if (!newZone) {
        throw new BadRequestException(
          `Zona con id: ${newSupervisor?.theirZone?.id} no fue encontrado`,
        );
      }

      if (zone?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la nueva zona debe ser "Activo".`,
        );
      }

      const newZoneSupervisor = newSupervisor;
      const newZoneFamilyGroups = newZone?.familyGroups?.map(
        (familyGroups) => familyGroups,
      );
      const newZonePreachers = newZone?.preachers?.map((preacher) => preacher);
      const newZoneDisciples = newZone?.disciples?.map((disciple) => disciple);

      //! Remove relationships from current zone and supervisor
      //* Supervisor
      try {
        const updateCurrentSupervisor = await this.supervisorRepository.preload(
          {
            id: zone?.theirSupervisor?.id,
            theirZone: null,
            updatedAt: new Date(),
            updatedBy: user,
            recordStatus: recordStatus,
          },
        );

        await this.supervisorRepository.save(updateCurrentSupervisor);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //* Zone
      try {
        const updateCurrentZone = await this.zoneRepository.preload({
          id: zone?.id,
          theirSupervisor: null,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });
        await this.zoneRepository.save(updateCurrentZone);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //! Remove relationships from new zone and supervisor
      //* Supervisor
      try {
        const updateNewSupervisor = await this.supervisorRepository.preload({
          id: newZone?.theirSupervisor?.id,
          theirZone: null,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });
        await this.supervisorRepository.save(updateNewSupervisor);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //* Zone
      try {
        const updateNewZone = await this.zoneRepository.preload({
          id: newZone?.id,
          theirSupervisor: null,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });
        await this.zoneRepository.save(updateNewZone);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? Set the new supervisor and zone to the current values
      try {
        const updateCurrentZone = await this.zoneRepository.preload({
          id: zone?.id,
          theirSupervisor: newZoneSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        await this.zoneRepository.save(updateCurrentZone);

        const updateCurrentSupervisor = await this.supervisorRepository.preload(
          {
            id: zone?.theirSupervisor?.id,
            theirZone: newZone,
            updatedAt: new Date(),
            updatedBy: user,
            recordStatus: recordStatus,
          },
        );

        await this.supervisorRepository.save(updateCurrentSupervisor);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? Set the current supervisor and zone to the new values
      try {
        const updateNewZone = await this.zoneRepository.preload({
          id: newZone?.id,
          theirSupervisor: currentZoneSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        await this.zoneRepository.save(updateNewZone);

        const updateNewSupervisor = await this.supervisorRepository.preload({
          id: newZone?.theirSupervisor?.id,
          theirZone: zone,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

        await this.supervisorRepository.save(updateNewSupervisor);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? Update and exchange subordinate relationships
      //* Preacher
      try {
        await Promise.all(
          newZonePreachers?.map(async (preacher) => {
            await this.preacherRepository.update(preacher?.id, {
              theirSupervisor: currentZoneSupervisor,
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
          currentZonePreachers?.map(async (preacher) => {
            await this.preacherRepository.update(preacher?.id, {
              theirSupervisor: newZoneSupervisor,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //* Family groups
      try {
        await Promise.all(
          newZoneFamilyGroups?.map(async (familyGroup) => {
            await this.familyGroupRepository.update(familyGroup?.id, {
              theirSupervisor: currentZoneSupervisor,
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
          currentZoneFamilyGroups?.map(async (familyGroup) => {
            await this.familyGroupRepository.update(familyGroup?.id, {
              theirSupervisor: newZoneSupervisor,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //* Disciples
      try {
        await Promise.all(
          newZoneDisciples?.map(async (disciple) => {
            await this.discipleRepository.update(disciple?.id, {
              theirSupervisor: currentZoneSupervisor,
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
          currentZoneDisciples?.map(async (disciple) => {
            await this.discipleRepository.update(disciple?.id, {
              theirSupervisor: newZoneSupervisor,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Update and save if is same supervisor and newSupervisor not exists
    if (
      !newTheirSupervisor &&
      updateZoneDto?.theirSupervisor === zone.theirSupervisor?.id
    ) {
      const updatedZone = await this.zoneRepository.preload({
        id: zone.id,
        ...updateZoneDto,
        theirChurch: zone.theirChurch,
        theirPastor: zone.theirPastor,
        theirCopastor: zone.theirCopastor,
        theirSupervisor: zone.theirSupervisor,
        updatedAt: new Date(),
        updatedBy: user,
        inactivationCategory:
          recordStatus === RecordStatus.Active
            ? null
            : zoneInactivationCategory,
        inactivationReason:
          recordStatus === RecordStatus.Active ? null : zoneInactivationReason,
        recordStatus: recordStatus,
      });

      const allFamilyGroups = await this.familyGroupRepository.find({
        relations: ['theirZone'],
      });

      //* Update and set new zone name and code in Family Group (if change name zone)
      const familyGroupsByZone = allFamilyGroups.filter(
        (familyGroup) => familyGroup?.theirZone?.id === zone?.id,
      );

      try {
        if (updateZoneDto.zoneName !== zone.zoneName) {
          await Promise.all(
            familyGroupsByZone.map(async (familyGroup) => {
              const number = familyGroup.familyGroupCode.split('-')[1];

              await this.familyGroupRepository.update(familyGroup?.id, {
                familyGroupCode: `${updateZoneDto?.zoneName?.toUpperCase()}-${number}`,
                updatedAt: new Date(),
                updatedBy: user,
                recordStatus: recordStatus,
              });
            }),
          );
        }

        return await this.zoneRepository.save(updatedZone);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Update and save if is different Supervisor and newSupervisor not exists
    if (
      !newTheirSupervisor &&
      updateZoneDto?.theirSupervisor !== zone.theirSupervisor?.id
    ) {
      //* Validation Supervisor
      const newSupervisor = await this.supervisorRepository.findOne({
        where: { id: theirSupervisor },
        relations: ['theirChurch', 'theirPastor', 'theirCopastor', 'theirZone'],
      });

      if (!newSupervisor) {
        throw new NotFoundException(
          `Supervisor con id: ${theirSupervisor} no fue encontrado.`,
        );
      }

      if (!newSupervisor?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en Supervisor debe ser "Activo".`,
        );
      }

      //* Validation relation exists in new Supervisor
      // Copastor
      if (!newSupervisor?.theirCopastor) {
        throw new NotFoundException(
          `Co-Pastor no fue encontrado, verifica que el nuevo Supervisor tenga un Co-Pastor asignado.`,
        );
      }

      const newCopastor = await this.copastorRepository.findOne({
        where: { id: newSupervisor?.theirCopastor?.id },
      });

      if (newCopastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en el nuevo Co-Pastor debe ser "Activo".`,
        );
      }

      // Pastor
      if (!newSupervisor?.theirPastor) {
        throw new NotFoundException(
          `Pastor no fue encontrado, verifica que el nuevo Supervisor tenga un Pastor asignado.`,
        );
      }

      const newPastor = await this.pastorRepository.findOne({
        where: { id: newSupervisor?.theirPastor?.id },
      });

      if (newPastor?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en el nuevo Pastor debe ser "Activo".`,
        );
      }

      // Church
      if (!newSupervisor?.theirChurch) {
        throw new NotFoundException(
          `Iglesia no fue encontrada, verifica que el nuevo Supervisor tenga una Iglesia asignada.`,
        );
      }

      const newChurch = await this.churchRepository.findOne({
        where: { id: newSupervisor?.theirChurch?.id },
      });

      if (newChurch?.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de Registro" en la nueva Iglesia debe ser "Activo".`,
        );
      }

      //* Validation old Supervisor
      const oldSupervisor = await this.supervisorRepository.findOne({
        where: { id: zone.theirSupervisor?.id },
        relations: ['theirChurch', 'theirPastor', 'theirCopastor', 'theirZone'],
      });

      let savedZone: Zone;
      try {
        const updatedZone = await this.zoneRepository.preload({
          id: zone?.id,
          ...updateZoneDto,
          theirChurch: newChurch,
          theirPastor: newPastor,
          theirCopastor: newCopastor,
          theirSupervisor: newSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
          inactivationCategory:
            recordStatus === RecordStatus.Active
              ? null
              : zoneInactivationCategory,
          inactivationReason:
            recordStatus === RecordStatus.Active
              ? null
              : zoneInactivationReason,
          recordStatus: recordStatus,
        });

        //! Delete old Supervisor
        if (oldSupervisor) {
          await this.supervisorRepository.update(oldSupervisor?.id, {
            theirZone: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }

        //* Set relationship in supervisor according their zone
        newSupervisor.theirZone = updatedZone;
        await this.supervisorRepository.save(newSupervisor);

        savedZone = await this.zoneRepository.save(updatedZone);
      } catch (error) {
        this.handleDBExceptions(error);
      }

      //? Update and set new zone in subordinate relations contains new supervisor
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
        //* Update and set new relationships in Preacher
        const preachersBySupervisor = allPreachers.filter(
          (preacher) => preacher?.theirSupervisor?.id === oldSupervisor?.id,
        );

        await Promise.all(
          preachersBySupervisor.map(async (preacher) => {
            await this.preacherRepository.update(preacher?.id, {
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: newCopastor,
              theirSupervisor: newSupervisor,
              theirZone: savedZone,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );

        //* Update and set new relationships in Family group
        const familyGroupsByCopastor = allFamilyGroups.filter(
          (familyGroup) =>
            familyGroup?.theirSupervisor?.id === oldSupervisor?.id,
        );

        await Promise.all(
          familyGroupsByCopastor.map(async (familyGroup) => {
            await this.familyGroupRepository.update(familyGroup?.id, {
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: newCopastor,
              theirSupervisor: newSupervisor,
              theirZone: savedZone,
              familyGroupCode: `${savedZone.zoneName.toUpperCase()}-${familyGroup.familyGroupCode.split('-')[1]}`,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );

        //* Update and set new relationships in Disciple
        const disciplesByCopastor = allDisciples.filter(
          (disciple) => disciple?.theirSupervisor?.id === oldSupervisor?.id,
        );

        await Promise.all(
          disciplesByCopastor.map(async (disciple) => {
            await this.discipleRepository.update(disciple?.id, {
              theirChurch: newChurch,
              theirPastor: newPastor,
              theirCopastor: newCopastor,
              theirSupervisor: newSupervisor,
              theirZone: savedZone,
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

      return savedZone;
    }
  }

  //! INACTIVATE ZONE
  async remove(
    id: string,
    inactivateZoneDto: InactivateZoneDto,
    user: User,
  ): Promise<void> {
    const { zoneInactivationCategory, zoneInactivationReason } =
      inactivateZoneDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const zone = await this.zoneRepository.findOne({
      where: { id: id },
      relations: ['theirSupervisor'],
    });

    if (!zone) {
      throw new NotFoundException(`Zona con id: ${id} no fue encontrado.`);
    }

    //* Update and set in Inactive on Zone
    try {
      const updatedZone = await this.zoneRepository.preload({
        id: zone.id,
        updatedAt: new Date(),
        updatedBy: user,
        theirSupervisor: null,
        inactivationCategory: zoneInactivationCategory,
        inactivationReason: zoneInactivationReason,
        recordStatus: RecordStatus.Inactive,
      });

      await this.zoneRepository.save(updatedZone);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in supervisor
    const allSupervisors = await this.supervisorRepository.find({
      relations: ['theirZone'],
    });

    try {
      const supervisorsZone = allSupervisors.filter(
        (supervisor) => supervisor.theirZone?.id === zone?.id,
      );

      await Promise.all(
        supervisorsZone.map(async (supervisor) => {
          await this.supervisorRepository.update(supervisor?.id, {
            theirZone: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //? Update in subordinate relations
    //* Preachers
    const allPreachers = await this.preacherRepository.find({
      relations: ['theirZone'],
    });

    try {
      const preachersByZone = allPreachers.filter(
        (preacher) => preacher.theirZone?.id === zone?.id,
      );

      await Promise.all(
        preachersByZone.map(async (preacher) => {
          await this.preacherRepository.update(preacher?.id, {
            theirZone: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //* Family Groups
    const allFamilyGroups = await this.familyGroupRepository.find({
      relations: ['theirZone'],
    });

    try {
      const familyGroupsByZone = allFamilyGroups.filter(
        (familyGroup) => familyGroup.theirZone?.id === zone?.id,
      );

      await Promise.all(
        familyGroupsByZone.map(async (familyGroup) => {
          await this.familyGroupRepository.update(familyGroup?.id, {
            theirZone: null,
            updatedAt: new Date(),
            updatedBy: user,
          });
        }),
      );
    } catch (error) {
      this.handleDBExceptions(error);
    }

    //* Disciples
    const allDisciples = await this.discipleRepository.find({
      relations: ['theirZone'],
    });

    try {
      const disciplesByZone = allDisciples.filter(
        (disciple) => disciple.theirZone?.id === zone?.id,
      );

      await Promise.all(
        disciplesByZone.map(async (disciple) => {
          await this.discipleRepository.update(disciple?.id, {
            theirZone: null,
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

      if (detail.includes('Key')) {
        throw new BadRequestException(
          `El supervisor ya esta siendo utilizado por otra zona, elige otro.`,
        );
      }
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
