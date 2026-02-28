import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrderValue, Repository } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { BaseService } from '@/common/services/base.service';
import { SearchStrategyFactory } from '@/common/strategies/search/search-strategy.factory';

import { ZoneSearchSubType } from '@/modules/zone/enums/zone-search-sub-type.enum';

import { zoneDataFormatter } from '@/modules/zone/helpers/zone-data-formatter.helper';

import { CreateZoneDto } from '@/modules/zone/dto/create-zone.dto';
import { UpdateZoneDto } from '@/modules/zone/dto/update-zone.dto';
import { InactivateZoneDto } from '@/modules/zone/dto/inactivate-zone.dto';
import { ZonePaginationDto } from '@/modules/zone/dto/zone-pagination.dto';
import { ZoneSearchAndPaginationDto } from '@/modules/zone/dto/zone-search-and-pagination.dto';

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
export class ZoneService extends BaseService {
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

    private readonly searchStrategyFactory: SearchStrategyFactory,
  ) {
    super();
  }

  //* Create
  async create(body: CreateZoneDto, user: User): Promise<Zone> {
    try {
      const { supervisor, pastor, copastor, church } =
        await this.validateZoneCreation(body);

      const data = this.buildCreateEntityData({
        user,
        extraProps: {
          ...body,
          theirSupervisor: supervisor,
          theirPastor: pastor,
          theirCopastor: copastor,
          theirChurch: church,
        },
      });

      const newZone = this.zoneRepository.create(data);

      const savedZone = await this.zoneRepository.save(newZone);

      //* relación inversa Supervisor → Zone
      await this.supervisorRepository.update(supervisor.id, {
        theirZone: savedZone,
        updatedAt: new Date(),
        updatedBy: user,
      });

      return savedZone;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find all
  async findAll(query: ZonePaginationDto): Promise<Zone[]> {
    const { limit, offset = 0, order = 'ASC', isSimpleQuery, churchId } = query;

    try {
      if (isSimpleQuery) {
        return await this.findBasicQuery<Zone>({
          order: order as FindOptionsOrderValue,
          churchId: churchId,
          churchRepository: this.churchRepository,
          mainRepository: this.zoneRepository,
          relations: ['familyGroups'],
        });
      }

      return await this.findDetailedQuery<Zone>({
        limit,
        offset,
        order: order as FindOptionsOrderValue,
        churchId,
        mainRepository: this.zoneRepository,
        churchRepository: this.churchRepository,
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
        moduleKey: 'zones',
        formatterData: zoneDataFormatter,
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find by Filters
  async findByFilters(query: ZoneSearchAndPaginationDto): Promise<Zone[]> {
    const { term, searchType, searchSubType, churchId } = query;

    if (!term) throw new BadRequestException('El término es requerido');
    if (!searchType)
      throw new BadRequestException('El tipo de búsqueda es requerido');

    try {
      const church = await this.findOrFail<Church>({
        repository: this.churchRepository,
        where: { id: churchId },
        moduleName: 'iglesia',
      });

      const searchStrategy = this.searchStrategyFactory.getStrategy(
        searchType as any,
      );

      const personContext = this.resolvePersonContext(searchSubType);

      return await searchStrategy.execute<Zone>({
        params: query,
        church,
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
        mainRepository: this.zoneRepository,
        zoneRepository: this.zoneRepository,
        moduleKey: 'zones',
        moduleName: 'zonas',
        formatterData: zoneDataFormatter,
        ...personContext,
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Update
  async update(id: string, body: UpdateZoneDto, user: User): Promise<Zone> {
    await this.validateId(id);

    const zone = await this.findOrFail<Zone>({
      repository: this.zoneRepository,
      where: { id },
      relations: [
        'theirChurch',
        'theirPastor.member',
        'theirCopastor.member',
        'theirSupervisor.member',
        'preachers',
        'familyGroups',
        'disciples',
      ],
      moduleName: 'zona',
    });

    this.validateRecordStatusUpdate(zone, body.recordStatus as RecordStatus);

    // Escenario C: intercambio de supervisores entre zonas
    if (body.newTheirSupervisor) {
      return this.exchangeZoneSupervisors(zone, body, user);
    }

    // Escenario B: cambio simple de supervisor
    if (body.theirSupervisor !== zone.theirSupervisor?.id) {
      return this.changeZoneSupervisor(zone, body, user);
    }

    // Escenario A: mismo supervisor
    return this.updateZoneBasicInfo(zone, body, user);
  }

  //* Inactivate
  async remove(id: string, dto: InactivateZoneDto, user: User): Promise<void> {
    await this.validateId(id);

    const zone = await this.findOrFail<Zone>({
      repository: this.zoneRepository,
      where: { id },
      relations: [],
      moduleName: 'zone',
    });

    await this.inactivateEntity({
      entity: zone,
      user,
      entityRepository: this.zoneRepository,
      extraProps: {
        inactivationCategory: dto.zoneInactivationCategory,
        inactivationReason: dto.zoneInactivationReason,
        recordStatus: RecordStatus.Inactive,
      },
    });

    await this.cleanSubordinateRelations(zone, user, [
      { repo: this.supervisorRepository, relation: 'theirZone' },
      { repo: this.preacherRepository, relation: 'theirZone' },
      { repo: this.familyGroupRepository, relation: 'theirZone' },
      { repo: this.discipleRepository, relation: 'theirZone' },
    ]);
  }

  // ---------------------------------------------------------------------------------------------- //

  //? Private methods
  //* Validations
  private async validateZoneCreation(createDto: CreateZoneDto): Promise<{
    supervisor: Supervisor;
    pastor: Pastor;
    copastor: Copastor | null;
    church: Church;
  }> {
    const { theirSupervisor } = createDto;

    if (!theirSupervisor) {
      throw new NotFoundException(
        `Para crear una Zona debe asignar un Supervisor.`,
      );
    }

    const supervisor = await this.supervisorRepository.findOne({
      where: { id: theirSupervisor },
      relations: ['theirChurch', 'theirPastor', 'theirCopastor', 'theirZone'],
    });

    if (!supervisor) {
      throw new NotFoundException(
        `No se encontró Supervisor con el id: ${theirSupervisor}.`,
      );
    }

    if (supervisor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
      );
    }

    //* Pastor
    if (!supervisor.theirPastor) {
      throw new NotFoundException(
        `El Supervisor debe tener un Pastor asignado.`,
      );
    }

    if (supervisor.theirPastor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
      );
    }

    //* Church
    if (!supervisor.theirChurch) {
      throw new NotFoundException(
        `El Supervisor debe tener una Iglesia asignada.`,
      );
    }

    if (supervisor.theirChurch.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
      );
    }

    //* Copastor (opcional)
    if (
      supervisor.theirCopastor &&
      supervisor.theirCopastor.recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
      );
    }

    //* Zona única por Supervisor (regla implícita)
    if (supervisor.theirZone) {
      throw new BadRequestException(
        `El Supervisor ya tiene una Zona asignada.`,
      );
    }

    return {
      supervisor,
      pastor: supervisor.theirPastor,
      copastor: supervisor.theirCopastor ?? null,
      church: supervisor.theirChurch,
    };
  }

  //* Finders and actions
  private resolvePersonContext(searchSubType?: ZoneSearchSubType) {
    if (!searchSubType) return {};

    switch (searchSubType) {
      case ZoneSearchSubType.ZoneByPastorFirstNames:
      case ZoneSearchSubType.ZoneByPastorLastNames:
      case ZoneSearchSubType.ZoneByPastorFullNames:
        return {
          personRepository: this.pastorRepository,
          computedKey: 'theirPastor',
          personName: 'pastor',
        };

      case ZoneSearchSubType.ZoneByCopastorFirstNames:
      case ZoneSearchSubType.ZoneByCopastorLastNames:
      case ZoneSearchSubType.ZoneByCopastorFullNames:
        return {
          personRepository: this.copastorRepository,
          computedKey: 'theirCopastor',
          personName: 'co-pastor',
        };

      case ZoneSearchSubType.ZoneBySupervisorFirstNames:
      case ZoneSearchSubType.ZoneBySupervisorLastNames:
      case ZoneSearchSubType.ZoneBySupervisorFullNames:
        return {
          personRepository: this.copastorRepository,
          computedKey: 'theirSupervisor',
          personName: 'supervisor',
        };

      default:
        throw new BadRequestException('Subtipo de búsqueda no válido');
    }
  }

  //* Basic
  private async updateZoneBasicInfo(
    zone: Zone,
    dto: UpdateZoneDto,
    user: User,
  ): Promise<Zone> {
    const payload = this.buildUpdateEntityData({
      entityId: zone.id,
      user,
      extraProps: {
        ...dto,
        theirChurch: zone.theirChurch,
        theirPastor: zone.theirPastor,
        theirCopastor: zone.theirCopastor,
        theirSupervisor: zone.theirSupervisor,
        inactivationCategory:
          dto.recordStatus === RecordStatus.Active
            ? null
            : dto.zoneInactivationCategory,
        inactivationReason:
          dto.recordStatus === RecordStatus.Active
            ? null
            : dto.zoneInactivationReason,
        recordStatus: dto.recordStatus,
      },
    });

    const updatedZone = await this.zoneRepository.preload(payload);
    const savedZone = await this.zoneRepository.save(updatedZone);

    await this.updateFamilyGroupCodesIfZoneNameChanged(
      zone,
      savedZone.zoneName,
      user,
      dto.recordStatus as RecordStatus,
    );

    return savedZone;
  }

  private async updateFamilyGroupCodesIfZoneNameChanged(
    zone: Zone,
    newZoneName: string | undefined,
    user: User,
    recordStatus: RecordStatus,
  ): Promise<void> {
    if (!newZoneName || newZoneName === zone.zoneName) return;

    const familyGroups = await this.familyGroupRepository.find({
      where: {
        theirZone: { id: zone.id },
      },
    });

    if (familyGroups.length === 0) return;

    await Promise.all(
      familyGroups.map(async (familyGroup) => {
        const [, number] = familyGroup.familyGroupCode.split('-');

        await this.familyGroupRepository.update(familyGroup.id, {
          familyGroupCode: `${newZoneName.toUpperCase()}-${number}`,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus,
        });
      }),
    );
  }

  //* Change Supervisor
  private async changeZoneSupervisor(
    zone: Zone,
    dto: UpdateZoneDto,
    user: User,
  ): Promise<Zone> {
    const { supervisor, pastor, copastor, church } =
      await this.validateNewSupervisor(dto.theirSupervisor);

    const oldSupervisor = zone.theirSupervisor;

    const payload = this.buildUpdateEntityData({
      entityId: zone.id,
      user,
      extraProps: {
        ...dto,
        theirSupervisor: supervisor,
        theirPastor: pastor,
        theirCopastor: copastor,
        theirChurch: church,
        inactivationCategory:
          dto.recordStatus === RecordStatus.Active
            ? null
            : dto.zoneInactivationCategory,
        inactivationReason:
          dto.recordStatus === RecordStatus.Active
            ? null
            : dto.zoneInactivationReason,
        recordStatus: dto.recordStatus,
      },
    });

    const updatedZone = await this.zoneRepository.preload(payload);
    const savedZone = await this.zoneRepository.save(updatedZone);

    if (oldSupervisor) {
      await this.supervisorRepository.update(oldSupervisor.id, {
        theirZone: null,
        updatedAt: new Date(),
        updatedBy: user,
      });
    }

    await this.supervisorRepository.update(supervisor.id, {
      theirZone: savedZone,
      updatedAt: new Date(),
      updatedBy: user,
    });

    await this.updateSubordinatesByZoneChange({
      oldSupervisor,
      newSupervisor: supervisor,
      zone: savedZone,
      pastor,
      copastor,
      church,
      user,
    });

    return savedZone;
  }

  private async validateNewSupervisor(supervisorId: string) {
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: supervisorId },
      relations: ['theirChurch', 'theirPastor', 'theirCopastor', 'theirZone'],
    });

    if (!supervisor) {
      throw new NotFoundException(
        `Supervisor con id: ${supervisorId} no fue encontrado.`,
      );
    }

    if (supervisor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Supervisor debe ser "Activo".`,
      );
    }

    // Copastor
    if (!supervisor.theirCopastor) {
      throw new BadRequestException(
        `No se encontró el Co-Pastor, verifica que Supervisor tenga un Co-Pastor asignado.`,
      );
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: supervisor.theirCopastor.id },
    });

    if (copastor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Co-Pastor debe ser "Activo".`,
      );
    }

    // Pastor
    if (!supervisor.theirPastor) {
      throw new BadRequestException(
        `No se encontró el Pastor, verifica que Supervisor tenga un Pastor asignado.`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: supervisor.theirPastor.id },
    });

    if (pastor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Pastor debe ser "Activo".`,
      );
    }

    // Church
    if (!supervisor.theirChurch) {
      throw new BadRequestException(
        `No se encontró la Iglesia, verifica que Supervisor tenga una Iglesia asignada.`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: supervisor.theirChurch.id },
    });

    if (church.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Iglesia debe ser "Activo".`,
      );
    }

    return { supervisor, pastor, copastor, church };
  }

  private async updateSubordinatesByZoneChange({
    oldSupervisor,
    newSupervisor,
    zone,
    pastor,
    copastor,
    church,
    user,
  }: {
    oldSupervisor: Supervisor | null;
    newSupervisor: Supervisor;
    zone: Zone;
    pastor: Pastor;
    copastor: Copastor;
    church: Church;
    user: User;
  }): Promise<void> {
    if (!oldSupervisor) return;

    const [preachers, familyGroups, disciples] = await Promise.all([
      this.preacherRepository.find({ relations: ['theirSupervisor'] }),
      this.familyGroupRepository.find({ relations: ['theirSupervisor'] }),
      this.discipleRepository.find({ relations: ['theirSupervisor'] }),
    ]);

    //* Preachers
    const preachersBySupervisor = preachers.filter(
      (p) => p.theirSupervisor?.id === oldSupervisor.id,
    );

    await Promise.all(
      preachersBySupervisor.map((preacher) =>
        this.preacherRepository.update(preacher.id, {
          theirChurch: church,
          theirPastor: pastor,
          theirCopastor: copastor,
          theirSupervisor: newSupervisor,
          theirZone: zone,
          updatedAt: new Date(),
          updatedBy: user,
        }),
      ),
    );

    //* Family Groups
    const familyGroupsBySupervisor = familyGroups.filter(
      (fg) => fg.theirSupervisor?.id === oldSupervisor.id,
    );

    await Promise.all(
      familyGroupsBySupervisor.map((familyGroup) => {
        const [, number] = familyGroup.familyGroupCode.split('-');

        return this.familyGroupRepository.update(familyGroup.id, {
          theirChurch: church,
          theirPastor: pastor,
          theirCopastor: copastor,
          theirSupervisor: newSupervisor,
          theirZone: zone,
          familyGroupCode: `${zone.zoneName.toUpperCase()}-${number}`,
          updatedAt: new Date(),
          updatedBy: user,
        });
      }),
    );

    //* Disciples
    const disciplesBySupervisor = disciples.filter(
      (d) => d.theirSupervisor?.id === oldSupervisor.id,
    );

    await Promise.all(
      disciplesBySupervisor.map((disciple) =>
        this.discipleRepository.update(disciple.id, {
          theirChurch: church,
          theirPastor: pastor,
          theirCopastor: copastor,
          theirSupervisor: newSupervisor,
          theirZone: zone,
          updatedAt: new Date(),
          updatedBy: user,
        }),
      ),
    );
  }

  //* Exchange Supervisor
  private async exchangeZoneSupervisors(
    zone: Zone,
    dto: UpdateZoneDto,
    user: User,
  ): Promise<Zone> {
    const currentSupervisor = zone.theirSupervisor;

    const newSupervisor = await this.validateSupervisorWithZone(
      dto.newTheirSupervisor,
    );

    const newZone = await this.findOrFail<Zone>({
      repository: this.zoneRepository,
      where: { id: newSupervisor.theirZone.id },
      relations: ['preachers', 'familyGroups', 'disciples'],
      moduleName: 'zona',
    });

    await this.detachZoneRelations(zone, currentSupervisor, user);
    await this.detachZoneRelations(newZone, newSupervisor, user);

    await this.attachZoneRelations(zone, newSupervisor, newZone, user);
    await this.attachZoneRelations(newZone, currentSupervisor, zone, user);

    await this.exchangeSubordinates(
      zone,
      newZone,
      currentSupervisor,
      newSupervisor,
      user,
    );

    return zone;
  }

  private async validateSupervisorWithZone(
    supervisorId: string,
  ): Promise<Supervisor> {
    const supervisor = await this.supervisorRepository.findOne({
      where: { id: supervisorId },
      relations: ['theirZone', 'theirChurch', 'theirPastor', 'theirCopastor'],
    });

    if (!supervisor) {
      throw new NotFoundException(
        `Supervisor con id: ${supervisorId} no fue encontrado.`,
      );
    }

    if (supervisor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Supervisor debe ser "Activo".`,
      );
    }

    if (!supervisor.theirZone) {
      throw new BadRequestException(
        `Es necesario que el Supervisor tenga una Zona asignada para poder intercambiar.`,
      );
    }

    return supervisor;
  }

  private async detachZoneRelations(
    zone: Zone,
    supervisor: Supervisor,
    user: User,
  ): Promise<void> {
    // Supervisor
    await this.supervisorRepository.update(supervisor.id, {
      theirZone: null,
      updatedAt: new Date(),
      updatedBy: user,
    });

    // Zone
    await this.zoneRepository.update(zone.id, {
      theirSupervisor: null,
      updatedAt: new Date(),
      updatedBy: user,
    });
  }

  private async attachZoneRelations(
    zone: Zone,
    supervisor: Supervisor,
    supervisorZone: Zone,
    user: User,
  ): Promise<void> {
    await this.zoneRepository.update(zone.id, {
      theirSupervisor: supervisor,
      updatedAt: new Date(),
      updatedBy: user,
    });

    await this.supervisorRepository.update(supervisor.id, {
      theirZone: supervisorZone,
      updatedAt: new Date(),
      updatedBy: user,
    });
  }

  private async exchangeSubordinates(
    currentZone: Zone,
    newZone: Zone,
    currentSupervisor: Supervisor,
    newSupervisor: Supervisor,
    user: User,
  ): Promise<void> {
    //* Preachers
    await Promise.all(
      newZone.preachers.map((preacher) =>
        this.preacherRepository.update(preacher.id, {
          theirSupervisor: currentSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
        }),
      ),
    );

    await Promise.all(
      currentZone.preachers.map((preacher) =>
        this.preacherRepository.update(preacher.id, {
          theirSupervisor: newSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
        }),
      ),
    );

    //* Family Groups
    await Promise.all(
      newZone.familyGroups.map((familyGroup) =>
        this.familyGroupRepository.update(familyGroup.id, {
          theirSupervisor: currentSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
        }),
      ),
    );

    await Promise.all(
      currentZone.familyGroups.map((familyGroup) =>
        this.familyGroupRepository.update(familyGroup.id, {
          theirSupervisor: newSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
        }),
      ),
    );

    //* Disciples
    await Promise.all(
      newZone.disciples.map((disciple) =>
        this.discipleRepository.update(disciple.id, {
          theirSupervisor: currentSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
        }),
      ),
    );

    await Promise.all(
      currentZone.disciples.map((disciple) =>
        this.discipleRepository.update(disciple.id, {
          theirSupervisor: newSupervisor,
          updatedAt: new Date(),
          updatedBy: user,
        }),
      ),
    );
  }
}
