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

import { CreateFamilyGroupDto } from '@/modules/family-group/dto/create-family-group.dto';
import { UpdateFamilyGroupDto } from '@/modules/family-group/dto/update-family-group.dto';
import { InactivateFamilyGroupDto } from '@/modules/family-group/dto/inactivate-family-group.dto';
import { FamilyGroupPaginationDto } from '@/modules/family-group/dto/family-group-pagination.dto';
import { FamilyGroupSearchAndPaginationDto } from '@/modules/family-group/dto/family-group-search-and-pagination.dto';

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
export class FamilyGroupService extends BaseService {
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
  async create(body: CreateFamilyGroupDto, user: User): Promise<FamilyGroup> {
    try {
      const { preacher, supervisor, zone, pastor, copastor, church } =
        await this.validateFamilyGroupCreation(body);

      const { familyGroupNumber, familyGroupCode } =
        await this.generateFamilyGroupCode(zone);

      const data = this.buildCreateEntityData({
        user,
        extraProps: {
          ...body,
          familyGroupNumber,
          familyGroupCode,
          theirChurch: church,
          theirPastor: pastor,
          theirCopastor: copastor,
          theirSupervisor: supervisor,
          theirPreacher: preacher,
          theirZone: zone,
        },
      });

      const newFamilyGroup = this.familyGroupRepository.create(data);
      const savedFamilyGroup =
        await this.familyGroupRepository.save(newFamilyGroup);

      await this.preacherRepository.update(preacher.id, {
        theirFamilyGroup: savedFamilyGroup,
        updatedAt: new Date(),
        updatedBy: user,
      });

      return savedFamilyGroup;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find all
  async findAll(query: FamilyGroupPaginationDto): Promise<FamilyGroup[]> {
    const { limit, offset = 0, order = 'ASC', isSimpleQuery, churchId } = query;

    try {
      if (isSimpleQuery) {
        return await this.findBasicQuery<FamilyGroup>({
          order: order as FindOptionsOrderValue,
          churchId: churchId,
          churchRepository: this.churchRepository,
          mainRepository: this.familyGroupRepository,
          relations: ['familyGroups'],
        });
      }

      return await this.findDetailedQuery<FamilyGroup>({
        limit,
        offset,
        order: order as FindOptionsOrderValue,
        churchId,
        mainRepository: this.familyGroupRepository,
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
        moduleKey: 'familyGroups',
        formatterData: familyGroupDataFormatter,
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find by filters
  async findByFilters(
    query: FamilyGroupSearchAndPaginationDto,
  ): Promise<FamilyGroup[]> {
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

      return await searchStrategy.execute<FamilyGroup>({
        params: query,
        church,
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
        mainRepository: this.familyGroupRepository,
        familyGroupRepository: this.familyGroupRepository,
        zoneRepository: this.zoneRepository,
        moduleKey: 'familyGroups',
        moduleName: 'grupos familiares',
        formatterData: familyGroupDataFormatter,
        ...personContext,
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Update
  async update(
    id: string,
    dto: UpdateFamilyGroupDto,
    user: User,
  ): Promise<FamilyGroup> {
    await this.validateId(id);

    const familyGroup = await this.findOrFail<FamilyGroup>({
      repository: this.familyGroupRepository,
      where: { id },
      relations: [
        'theirChurch',
        'theirPastor.member',
        'theirCopastor.member',
        'theirSupervisor.member',
        'theirZone',
        'theirPreacher.member',
        'theirPreacher.theirZone',
        'disciples.member',
      ],
      moduleName: 'grupo familiar',
    });

    this.validateRecordStatusUpdate(
      familyGroup,
      dto.recordStatus as RecordStatus,
    );

    if (dto.newTheirPreacher) {
      return this.exchangeFamilyGroupPreachers(familyGroup, dto, user);
    }

    //* Never change preacher always is same preacher with same zone
    if (dto.theirPreacher !== familyGroup.theirPreacher?.id) {
      return this.changeFamilyGroupPreacher(familyGroup, dto, user);
    }

    return this.updateFamilyGroupBasicInfo(familyGroup, dto, user);
  }

  //* Inactivate
  async remove(
    id: string,
    dto: InactivateFamilyGroupDto,
    user: User,
  ): Promise<void> {
    await this.validateId(id);

    const familyGroup = await this.findOrFail<FamilyGroup>({
      repository: this.familyGroupRepository,
      where: { id },
      relations: [],
      moduleName: 'preacher',
    });

    await this.inactivateEntity({
      entity: familyGroup,
      user,
      entityRepository: this.preacherRepository,
      extraProps: {
        inactivationCategory: dto.familyGroupInactivationCategory,
        inactivationReason: dto.familyGroupInactivationReason,
        recordStatus: RecordStatus.Inactive,
      },
    });

    await this.cleanSubordinateRelations(familyGroup, user, [
      { repo: this.preacherRepository, relation: 'theirZone' },
      { repo: this.discipleRepository, relation: 'theirZone' },
    ]);
  }

  // ---------------------------------------------------------------------------------------------- //

  //? Private methods
  //* Validations
  private async validateFamilyGroupCreation(
    createDto: CreateFamilyGroupDto,
  ): Promise<{
    preacher: Preacher;
    supervisor: Supervisor;
    zone: Zone;
    pastor: Pastor;
    copastor: Copastor;
    church: Church;
  }> {
    const { theirPreacher } = createDto;

    if (!theirPreacher) {
      throw new NotFoundException(
        `Para crear un nuevo Grupo Familiar se debe asignar un Predicador.`,
      );
    }

    const preacher = await this.preacherRepository.findOne({
      where: { id: theirPreacher },
      relations: [
        'theirSupervisor',
        'theirZone',
        'theirPastor',
        'theirCopastor',
        'theirChurch',
      ],
    });

    if (!preacher) {
      throw new NotFoundException(
        `Predicador con id: ${theirPreacher} no fue encontrado.`,
      );
    }

    if (preacher.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Predicador debe ser "Activo".`,
      );
    }

    //* Supervisor
    if (!preacher.theirSupervisor) {
      throw new NotFoundException(
        `El Predicador debe tener un Supervisor asignado.`,
      );
    }

    if (preacher.theirSupervisor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Supervisor debe ser "Activo".`,
      );
    }

    //* Zona
    if (!preacher.theirZone) {
      throw new NotFoundException(
        `El Predicador debe tener una Zona asignada.`,
      );
    }

    if (preacher.theirZone.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Zona debe ser "Activo".`,
      );
    }

    //* Pastor
    if (!preacher.theirPastor) {
      throw new NotFoundException(
        `El Predicador debe tener un Pastor asignado.`,
      );
    }

    if (preacher.theirPastor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
      );
    }

    //* Co-Pastor
    if (!preacher.theirCopastor) {
      throw new NotFoundException(
        `El Predicador debe tener un Co-Pastor asignado.`,
      );
    }

    if (preacher.theirCopastor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Co-Pastor debe ser "Activo".`,
      );
    }

    //* Iglesia
    if (!preacher.theirChurch) {
      throw new NotFoundException(
        `El Predicador debe tener una Iglesia asignada.`,
      );
    }

    if (preacher.theirChurch.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
      );
    }

    return {
      preacher,
      supervisor: preacher.theirSupervisor,
      zone: preacher.theirZone,
      pastor: preacher.theirPastor,
      copastor: preacher.theirCopastor,
      church: preacher.theirChurch,
    };
  }

  //* Finder and actions
  private async generateFamilyGroupCode(
    zone: Zone,
  ): Promise<{ familyGroupNumber: number; familyGroupCode: string }> {
    const count = await this.familyGroupRepository.count({
      where: { theirZone: { id: zone.id } },
    });

    const familyGroupNumber = count + 1;
    const familyGroupCode = `${zone.zoneName.toUpperCase()}-${familyGroupNumber}`;

    return { familyGroupNumber, familyGroupCode };
  }

  private resolvePersonContext(searchSubType?: FamilyGroupSearchSubType) {
    if (!searchSubType) return {};

    switch (searchSubType) {
      case FamilyGroupSearchSubType.FamilyGroupByPastorFirstNames:
      case FamilyGroupSearchSubType.FamilyGroupByPastorLastNames:
      case FamilyGroupSearchSubType.FamilyGroupByPastorFullNames:
        return {
          personRepository: this.pastorRepository,
          computedKey: 'theirPastor',
          personName: 'pastor',
        };

      case FamilyGroupSearchSubType.FamilyGroupByCopastorFirstNames:
      case FamilyGroupSearchSubType.FamilyGroupByCopastorLastNames:
      case FamilyGroupSearchSubType.FamilyGroupByCopastorFullNames:
        return {
          personRepository: this.copastorRepository,
          computedKey: 'theirCopastor',
          personName: 'co-pastor',
        };

      case FamilyGroupSearchSubType.FamilyGroupBySupervisorFirstNames:
      case FamilyGroupSearchSubType.FamilyGroupBySupervisorLastNames:
      case FamilyGroupSearchSubType.FamilyGroupBySupervisorFullNames:
        return {
          personRepository: this.copastorRepository,
          computedKey: 'theirSupervisor',
          personName: 'supervisor',
        };

      case FamilyGroupSearchSubType.FamilyGroupBySupervisorFirstNames:
      case FamilyGroupSearchSubType.FamilyGroupBySupervisorLastNames:
      case FamilyGroupSearchSubType.FamilyGroupBySupervisorFullNames:
        return {
          personRepository: this.copastorRepository,
          computedKey: 'theirPreacher',
          personName: 'preacher',
        };

      default:
        throw new BadRequestException('Subtipo de búsqueda no válido');
    }
  }

  //* Update basic info
  private async updateFamilyGroupBasicInfo(
    familyGroup: FamilyGroup,
    dto: UpdateFamilyGroupDto,
    user: User,
  ): Promise<FamilyGroup> {
    const payload = this.buildUpdateEntityData({
      entityId: familyGroup.id,
      user,
      extraProps: {
        ...dto,
        theirChurch: familyGroup.theirChurch,
        theirPastor: familyGroup.theirPastor,
        theirCopastor: familyGroup.theirCopastor,
        theirSupervisor: familyGroup.theirSupervisor,
        theirZone: familyGroup.theirZone,
        theirPreacher: familyGroup.theirPreacher,
        inactivationCategory:
          dto.recordStatus === RecordStatus.Active
            ? null
            : dto.familyGroupInactivationCategory,
        inactivationReason:
          dto.recordStatus === RecordStatus.Active
            ? null
            : dto.familyGroupInactivationReason,
        recordStatus: dto.recordStatus,
      },
    });

    const updated = await this.familyGroupRepository.preload(payload);
    return this.familyGroupRepository.save(updated);
  }

  // todo: Revisar estos 2 bloques
  //* Change Family group preacher
  private async changeFamilyGroupPreacher(
    familyGroup: FamilyGroup,
    dto: UpdateFamilyGroupDto,
    user: User,
  ): Promise<FamilyGroup> {
    const newPreacher = await this.validateNewPreacher(dto.theirPreacher);

    if (newPreacher?.theirZone?.id !== familyGroup?.theirZone?.id) {
      throw new BadRequestException(
        `El nuevo Predicador debe pertenecer a la misma Zona.`,
      );
    }

    if (familyGroup.theirPreacher) {
      await this.detachPreacherRelations(familyGroup.theirPreacher, user);
    }

    await this.attachFamilyGroupRelations(familyGroup, newPreacher, user);
    await this.attachPreacherRelations(newPreacher, familyGroup, user);

    this.updateSubordinatesByFamilyGroupChange(familyGroup, newPreacher);

    const updated = this.familyGroupRepository.create({
      ...familyGroup,
      updatedAt: new Date(),
      updatedBy: user,
    });

    return this.familyGroupRepository.save(updated);
  }

  // todo: revisar podria estar mal (REVISAR)
  private updateSubordinatesByFamilyGroupChange(
    familyGroup: FamilyGroup,
    preacher: Preacher,
  ) {
    familyGroup.theirChurch = preacher.theirChurch;
    familyGroup.theirPastor = preacher.theirPastor;
    familyGroup.theirCopastor = preacher.theirCopastor;
    familyGroup.theirSupervisor = preacher.theirSupervisor;
    familyGroup.theirZone = preacher.theirZone;
  }

  private async validateNewPreacher(preacherId: string): Promise<Preacher> {
    const preacher = await this.preacherRepository.findOne({
      where: { id: preacherId },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'theirZone',
        'theirFamilyGroup',
      ],
    });

    if (!preacher) {
      throw new NotFoundException(
        `Predicador con id: ${preacherId} no fue encontrado.`,
      );
    }

    if (preacher.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de Registro" en Predicador debe ser "Activo".`,
      );
    }

    if (!preacher.theirSupervisor) {
      throw new NotFoundException(
        `El Predicador debe tener un Supervisor asignado.`,
      );
    }

    if (!preacher.theirZone) {
      throw new NotFoundException(
        `El Predicador debe tener una Zona asignada.`,
      );
    }

    if (!preacher.theirPastor) {
      throw new NotFoundException(
        `El Predicador debe tener un Pastor asignado.`,
      );
    }

    if (!preacher.theirCopastor) {
      throw new NotFoundException(
        `El Predicador debe tener un Co-Pastor asignado.`,
      );
    }

    if (!preacher.theirChurch) {
      throw new NotFoundException(
        `El Predicador debe tener una Iglesia asignada.`,
      );
    }

    return preacher;
  }

  //* Exchange preachers
  private async exchangeFamilyGroupPreachers(
    familyGroup: FamilyGroup,
    dto: UpdateFamilyGroupDto,
    user: User,
  ): Promise<FamilyGroup> {
    const currentPreacher = familyGroup.theirPreacher;

    const newPreacher = await this.validateNewPreacher(dto.newTheirPreacher);
    this.validatePreacherWithFamilyGroup(newPreacher);

    if (currentPreacher?.theirZone?.id !== newPreacher?.theirZone?.id) {
      throw new BadRequestException(
        `Ambos Predicadores deben pertenecer a la misma Zona.`,
      );
    }

    const newFamilyGroup = await this.findOrFail<FamilyGroup>({
      repository: this.familyGroupRepository,
      where: { id: newPreacher.theirFamilyGroup.id },
      relations: [
        'theirChurch',
        'theirPastor.member',
        'theirCopastor.member',
        'theirSupervisor.member',
        'theirZone',
        'theirPreacher.member',
        'disciples.member',
      ],
      moduleName: 'grupo familiar',
    });

    await this.detachPreacherRelations(currentPreacher, user);
    await this.detachFamilyGroupRelations(familyGroup, user);

    await this.detachPreacherRelations(newPreacher, user);
    await this.detachFamilyGroupRelations(newFamilyGroup, user);

    await this.attachFamilyGroupRelations(familyGroup, newPreacher, user);
    await this.attachPreacherRelations(newPreacher, familyGroup, user);

    await this.attachFamilyGroupRelations(
      newFamilyGroup,
      currentPreacher,
      user,
    );
    await this.attachPreacherRelations(currentPreacher, newFamilyGroup, user);

    await this.exchangeDisciplesBetweenFamilyGroups(
      familyGroup,
      newFamilyGroup,
      currentPreacher,
      newPreacher,
      user,
    );

    return familyGroup;
  }

  private async exchangeDisciplesBetweenFamilyGroups(
    sourceGroup: FamilyGroup,
    targetGroup: FamilyGroup,
    sourcePreacher: Preacher,
    targetPreacher: Preacher,
    user: User,
  ) {
    const sourceDisciples = sourceGroup.disciples ?? [];
    const targetDisciples = targetGroup.disciples ?? [];

    await Promise.all([
      ...sourceDisciples.map((disciple) =>
        this.discipleRepository.update(disciple.id, {
          theirPreacher: targetPreacher,
          updatedAt: new Date(),
          updatedBy: user,
        }),
      ),
      ...targetDisciples.map((disciple) =>
        this.discipleRepository.update(disciple.id, {
          theirPreacher: sourcePreacher,
          updatedAt: new Date(),
          updatedBy: user,
        }),
      ),
    ]);
  }

  private validatePreacherWithFamilyGroup(preacher: Preacher) {
    if (!preacher.theirFamilyGroup) {
      throw new BadRequestException(
        `El Predicador debe tener un Grupo Familiar asignado para poder intercambiar.`,
      );
    }
  }

  private async detachFamilyGroupRelations(
    familyGroup: FamilyGroup,
    user: User,
  ) {
    await this.familyGroupRepository.update(familyGroup.id, {
      theirPreacher: null,
      updatedAt: new Date(),
      updatedBy: user,
    });
  }

  private async detachPreacherRelations(preacher: Preacher, user: User) {
    await this.preacherRepository.update(preacher.id, {
      theirFamilyGroup: null,
      updatedAt: new Date(),
      updatedBy: user,
    });
  }

  private async attachFamilyGroupRelations(
    familyGroup: FamilyGroup,
    preacher: Preacher,
    user: User,
  ) {
    await this.familyGroupRepository.update(familyGroup.id, {
      theirPreacher: preacher,
      updatedAt: new Date(),
      updatedBy: user,
    });
  }

  private async attachPreacherRelations(
    preacher: Preacher,
    familyGroup: FamilyGroup,
    user: User,
  ) {
    await this.preacherRepository.update(preacher.id, {
      theirFamilyGroup: familyGroup,
      updatedAt: new Date(),
      updatedBy: user,
    });
  }
}
