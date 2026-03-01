import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository, FindOptionsOrderValue } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CreateSupervisorDto } from '@/modules/supervisor/dto/create-supervisor.dto';
import { UpdateSupervisorDto } from '@/modules/supervisor/dto/update-supervisor.dto';
import { SupervisorPaginationDto } from '@/modules/supervisor/dto/supervisor-pagination.dto';
import { SupervisorSearchAndPaginationDto } from '@/modules/supervisor/dto/supervisor-search-and-pagination.dto';

import { SupervisorSearchSubType } from '@/modules/supervisor/enums/supervisor-search-sub-type.num';
import { supervisorDataFormatter } from '@/modules/supervisor/helpers/supervisor-data-formatter.helper';

import { MemberRole } from '@/common/enums/member-role.enum';
import { RelationType } from '@/common/enums/relation-type.enum';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { InactivateMemberDto } from '@/common/dtos/inactivate-member.dto';

import { BaseService } from '@/common/services/base.service';
import { SearchStrategyFactory } from '@/common/strategies/search/search-strategy.factory';

import { createMinistryMember } from '@/common/helpers/create-ministry-member';
import { raiseLevelMinistryMember } from '@/common/helpers/raise-level-ministry-member';

import { MemberOfferingType } from '@/modules/offering/income/enums/member-offering-type.enum';

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
export class SupervisorService extends BaseService {
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

    private readonly searchStrategyFactory: SearchStrategyFactory,
  ) {
    super();
  }

  //  todo: isRelationDirect el boolean solo se usa para valiar en actualizar pero ya no usar solo usar el type relation para condcionar
  //* Create
  async create(body: CreateSupervisorDto, user: User): Promise<Supervisor> {
    try {
      const { church, pastor, copastor } =
        await this.validateSupervisorCreation(body);

      const memberData = this.buildMemberData(body);
      const newMember = this.memberRepository.create(memberData);
      await this.memberRepository.save(newMember);

      const supervisorData = this.buildCreateEntityData({
        user,
        member: {
          ...newMember,
          conversionDate: body.conversionDate ?? null,
          email: body.email ?? null,
          phoneNumber: body.phoneNumber ?? null,
        },
        extraProps: {
          ...body,
          theirChurch: church,
          theirPastor: pastor,
          theirCopastor: copastor,
          relationType: body.relationType ?? null,
        },
      });

      const newSupervisor = this.supervisorRepository.create(supervisorData);

      if (body.theirMinistries?.length > 0) {
        await createMinistryMember({
          theirMinistries: body.theirMinistries,
          ministryRepository: this.ministryRepository,
          ministryMemberRepository: this.ministryMemberRepository,
          newMember,
          user,
        });
      }

      return await this.supervisorRepository.save(newSupervisor);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.handleDBExceptions(error, {
        supervisor: 'El registro del Supervisor no pudo completarse.',
      });
    }
  }

  //* Find all
  async findAll(query: SupervisorPaginationDto): Promise<Supervisor[]> {
    const {
      limit,
      offset = 0,
      order = 'ASC',
      isSimpleQuery,
      churchId,
      // withNullZone,
    } = query;

    try {
      if (isSimpleQuery) {
        return await this.findBasicQuery<Supervisor>({
          order: order as FindOptionsOrderValue,
          churchId: churchId,
          // withNullZone,
          churchRepository: this.churchRepository,
          mainRepository: this.supervisorRepository,
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
      }

      return await this.findDetailedQuery<Supervisor>({
        limit,
        offset,
        order: order as FindOptionsOrderValue,
        churchId,
        mainRepository: this.supervisorRepository,
        churchRepository: this.churchRepository,
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
        moduleKey: 'supervisors',
        formatterData: supervisorDataFormatter,
        relationLoadStrategy: 'query',
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find by filters
  async findByFilters(
    query: SupervisorSearchAndPaginationDto,
  ): Promise<Supervisor[]> {
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

      return await searchStrategy.execute<Supervisor>({
        params: query,
        church,
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
        zoneRepository: this.zoneRepository,
        copastorRepository: this.copastorRepository,
        mainRepository: this.supervisorRepository,
        moduleKey: 'supervisors',
        moduleName: 'supervisores(as)',
        formatterData: supervisorDataFormatter,
        relationLoadStrategy: 'query',
        ...personContext,
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // todo: revisar en el front si el checjkbox de isRelationDirect es necesario si no para ignorar este campo
  //* Update
  async update(
    id: string,
    body: UpdateSupervisorDto,
    user: User,
  ): Promise<Supervisor | Copastor> {
    await this.validateId(id);

    const supervisor = await this.findOrFail<Supervisor>({
      repository: this.supervisorRepository,
      where: { id },
      relations: [
        'theirCopastor',
        'theirPastor',
        'theirChurch',
        'member',
        'member.ministries',
        'member.ministries.ministry',
        'member.ministries.ministry.theirChurch',
      ],
      moduleName: 'supervisor',
    });

    this.validateRequiredRoles(body.roles as MemberRole[], [
      MemberRole.Supervisor,
      MemberRole.Copastor,
    ]);

    this.validateRoleHierarchy({
      memberRoles: supervisor.member.roles as MemberRole[],
      rolesToAssign: body.roles as MemberRole[],
      config: {
        mainRole: MemberRole.Supervisor,
        forbiddenRoles: [MemberRole.Disciple, MemberRole.Preacher],
        breakStrictRoles: [MemberRole.Copastor, MemberRole.Pastor],
        hierarchyOrder: [
          MemberRole.Disciple,
          MemberRole.Preacher,
          MemberRole.Supervisor,
          MemberRole.Copastor,
          MemberRole.Pastor,
        ],
      },
    });

    this.validateRecordStatusUpdate(
      supervisor,
      body.recordStatus as RecordStatus,
    );

    const isRaiseToCopastor =
      supervisor.member.roles.includes(MemberRole.Supervisor) &&
      body.roles.includes(MemberRole.Copastor) &&
      supervisor.recordStatus === RecordStatus.Active;

    let church: Church;
    let pastor: Pastor;
    let copastor: Copastor | null = null;
    let mustUpdateMember = true;

    if (!isRaiseToCopastor) {
      ({ church, pastor, copastor, mustUpdateMember } =
        await this.resolveSupervisorRelation(supervisor, body));
    }

    const savedMember = await this.updateEntityMember({
      entity: supervisor,
      dto: body,
      mustUpdateMember,
      memberRepository: this.memberRepository,
    });

    if (isRaiseToCopastor) {
      return await this.raiseSupervisorLevelToCopastor(
        supervisor,
        savedMember,
        body,
        user,
      );
    }

    const payload = this.buildUpdateEntityData({
      entityId: supervisor.id,
      user,
      savedMember: {
        ...savedMember,
        conversionDate: body.conversionDate ?? null,
        email: body.email ?? null,
        phoneNumber: body.phoneNumber ?? null,
      },
      extraProps: {
        ...body,
        theirChurch: church,
        theirPastor: pastor,
        theirCopastor: copastor,
        // isDirectRelationToPastor: body.isDirectRelationToPastor ?? false, // 🧷 referencia
        relationType: body.relationType ?? null,
        inactivationCategory:
          body.recordStatus === RecordStatus.Active
            ? null
            : body.memberInactivationCategory,
        inactivationReason:
          body.recordStatus === RecordStatus.Active
            ? null
            : body.memberInactivationReason,
        recordStatus: body.recordStatus,
      },
    });

    const updatedSupervisor = await this.supervisorRepository.preload(payload);

    //* Update ministries if needed
    await this.updateMinistriesIfNeeded({
      entity: supervisor,
      theirMinistries: body.theirMinistries,
      savedMember,
      user,
      ministryRepository: this.ministryRepository,
      ministryMemberRepository: this.ministryMemberRepository,
    });

    //* Update subordinate relations if hierarchy changed
    await this.updateSubordinateRelationsIfCopastorChanged(
      supervisor,
      copastor,
      pastor,
      church,
      user,
    );

    return await this.supervisorRepository.save(updatedSupervisor);
  }

  //* Delete
  async remove(
    id: string,
    dto: InactivateMemberDto,
    user: User,
  ): Promise<void> {
    await this.validateId(id);

    const supervisor = await this.findOrFail<Supervisor>({
      repository: this.supervisorRepository,
      where: { id },
      relations: [],
      moduleName: 'supervisor',
    });

    await this.inactivateEntity({
      entity: supervisor,
      user,
      entityRepository: this.supervisorRepository,
      extraProps: {
        inactivationCategory: dto.memberInactivationCategory,
        inactivationReason: dto.memberInactivationReason,
        recordStatus: RecordStatus.Inactive,
      },
    });

    await this.cleanSubordinateRelations(supervisor, user, [
      { repo: this.zoneRepository, relation: 'theirSupervisor' },
      { repo: this.preacherRepository, relation: 'theirSupervisor' },
      { repo: this.familyGroupRepository, relation: 'theirSupervisor' },
      { repo: this.discipleRepository, relation: 'theirSupervisor' },
    ]);
  }

  // ---------------------------------------------------------------------------------------------- //

  //? Private methods
  //* Validations
  private async validateSupervisorCreation(dto: CreateSupervisorDto): Promise<{
    church: Church;
    pastor: Pastor | null;
    copastor: Copastor | null;
  }> {
    const {
      roles,
      relationType,
      theirCopastor,
      theirPastorRelationDirect,
      theirPastorOnlyMinistries,
    } = dto;

    //* Roles
    if (!roles.includes(MemberRole.Supervisor)) {
      throw new BadRequestException(`El rol "Supervisor" debe ser incluido.`);
    }

    const invalidRoles = [
      MemberRole.Pastor,
      MemberRole.Copastor,
      MemberRole.Preacher,
      MemberRole.Disciple,
    ];

    if (roles.some((r: any) => invalidRoles.includes(r))) {
      throw new BadRequestException(
        `Para crear un Supervisor solo se permiten los roles "Supervisor" o "Tesorero".`,
      );
    }

    switch (relationType) {
      case RelationType.OnlyRelatedHierarchicalCover:
      case RelationType.RelatedBothMinistriesAndHierarchicalCover:
        return this.resolveSupervisorByCopastor(theirCopastor);

      case RelationType.OnlyRelatedMinistries:
        return this.resolveSupervisorByPastorOnlyMinistries(
          theirPastorOnlyMinistries,
        );

      case RelationType.RelatedDirectToPastor:
        return this.resolveSupervisorDirectToPastor(theirPastorRelationDirect);

      default:
        throw new BadRequestException(
          'Tipo de relación no válido para Supervisor.',
        );
    }
  }

  //* Finders and actions
  private resolvePersonContext(searchSubType?: SupervisorSearchSubType) {
    if (!searchSubType) return {};

    switch (searchSubType) {
      case SupervisorSearchSubType.SupervisorByPastorFirstNames:
      case SupervisorSearchSubType.SupervisorByPastorLastNames:
      case SupervisorSearchSubType.SupervisorByPastorFullNames:
        return {
          personRepository: this.pastorRepository,
          computedKey: 'theirPastor',
          personName: 'pastor',
        };

      case SupervisorSearchSubType.SupervisorByCopastorFirstNames:
      case SupervisorSearchSubType.SupervisorByCopastorLastNames:
      case SupervisorSearchSubType.SupervisorByCopastorFullNames:
        return {
          personRepository: this.copastorRepository,
          computedKey: 'theirCopastor',
          personName: 'co-pastor',
        };

      case SupervisorSearchSubType.BySupervisorFirstNames:
      case SupervisorSearchSubType.BySupervisorLastNames:
      case SupervisorSearchSubType.BySupervisorFullNames:
        return {
          personRepository: null,
          computedKey: '',
          personName: '',
        };
      default:
        throw new BadRequestException('Subtipo de búsqueda no válido');
    }
  }

  private async resolveSupervisorByCopastor(
    copastorId?: string,
  ): Promise<{ church: Church; pastor: Pastor; copastor: Copastor }> {
    if (!copastorId) {
      throw new NotFoundException(`Debe asignar un Co-Pastor.`);
    }

    const copastor = await this.copastorRepository.findOne({
      where: { id: copastorId },
      relations: ['theirPastor', 'theirChurch'],
    });

    if (!copastor)
      throw new NotFoundException(
        `No se encontró Co-Pastor con id: ${copastorId}`,
      );

    if (copastor.recordStatus === RecordStatus.Inactive)
      throw new BadRequestException(`El Co-Pastor debe estar activo.`);

    if (!copastor.theirPastor || !copastor.theirChurch)
      throw new NotFoundException(
        `El Co-Pastor no tiene Pastor o Iglesia asignados.`,
      );

    if (copastor.theirChurch.recordStatus === RecordStatus.Inactive)
      throw new BadRequestException(`La Iglesia debe estar activa.`);

    return {
      copastor,
      pastor: copastor.theirPastor,
      church: copastor.theirChurch,
    };
  }

  private async resolveSupervisorByPastorOnlyMinistries(
    pastorId?: string,
  ): Promise<{ church: Church; pastor: Pastor; copastor: null }> {
    if (!pastorId) throw new NotFoundException(`Debe asignar un Pastor.`);

    const pastor = await this.pastorRepository.findOne({
      where: { id: pastorId },
      relations: ['theirChurch'],
    });

    if (!pastor || pastor.recordStatus === RecordStatus.Inactive)
      throw new BadRequestException(`El Pastor debe estar activo.`);

    if (!pastor.theirChurch)
      throw new NotFoundException(`El Pastor no tiene Iglesia asignada.`);

    if (pastor.theirChurch.recordStatus === RecordStatus.Inactive)
      throw new BadRequestException(`La Iglesia debe estar activa.`);

    return {
      pastor,
      church: pastor.theirChurch,
      copastor: null,
    };
  }

  private async resolveSupervisorDirectToPastor(
    pastorId?: string,
  ): Promise<{ church: Church; pastor: Pastor; copastor: null }> {
    if (!pastorId) throw new NotFoundException(`Debe asignar un Pastor.`);

    const pastor = await this.pastorRepository.findOne({
      where: { id: pastorId },
      relations: ['theirChurch'],
    });

    if (!pastor || pastor.recordStatus === RecordStatus.Inactive)
      throw new BadRequestException(`El Pastor debe estar activo.`);

    if (!pastor.theirChurch)
      throw new NotFoundException(`El Pastor no tiene Iglesia asignada.`);

    if (pastor.theirChurch.recordStatus === RecordStatus.Inactive)
      throw new BadRequestException(`La Iglesia debe estar activa.`);

    return {
      pastor,
      church: pastor.theirChurch,
      copastor: null,
    };
  }

  private async resolveSupervisorRelation(
    supervisor: Supervisor, // validation for relation type priority
    dto: UpdateSupervisorDto,
  ): Promise<{
    pastor: Pastor;
    church: Church;
    copastor: Copastor | null;
    mustUpdateMember: boolean;
  }> {
    const {
      relationType,
      theirCopastor,
      theirPastorRelationDirect,
      theirPastorOnlyMinistries,
    } = dto;

    //* Relation with Copastor
    if (
      relationType === RelationType.OnlyRelatedHierarchicalCover ||
      relationType === RelationType.RelatedBothMinistriesAndHierarchicalCover
    ) {
      if (!theirCopastor) {
        throw new NotFoundException(
          `Debe asignar un Co-Pastor para relación jerárquica.`,
        );
      }

      const copastor = await this.copastorRepository.findOne({
        where: { id: theirCopastor },
        relations: ['theirPastor', 'theirChurch'],
      });

      if (!copastor || copastor.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(`Co-Pastor inválido o inactivo.`);
      }

      return {
        copastor,
        pastor: copastor.theirPastor,
        church: copastor.theirChurch,
        mustUpdateMember: true,
      };
    }

    //* Direct relation to Pastor
    if (relationType === RelationType.RelatedDirectToPastor) {
      if (!theirPastorRelationDirect) {
        throw new NotFoundException(
          `Debe asignar un Pastor para relación directa.`,
        );
      }

      const pastor = await this.pastorRepository.findOne({
        where: { id: theirPastorRelationDirect },
        relations: ['theirChurch'],
      });

      if (!pastor || pastor.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(`Pastor inválido o inactivo.`);
      }

      return {
        copastor: null,
        pastor,
        church: pastor.theirChurch,
        mustUpdateMember: true,
      };
    }

    //* Only ministries
    if (relationType === RelationType.OnlyRelatedMinistries) {
      if (!theirPastorOnlyMinistries) {
        throw new NotFoundException(
          `Debe asignar un Pastor para relación por ministerios.`,
        );
      }

      const pastor = await this.pastorRepository.findOne({
        where: { id: theirPastorOnlyMinistries },
        relations: ['theirChurch'],
      });

      return {
        copastor: null,
        pastor,
        church: pastor.theirChurch,
        mustUpdateMember: true,
      };
    }

    throw new BadRequestException(`Tipo de relación no válido.`);
  }

  private async updateSubordinateRelationsIfCopastorChanged(
    supervisor: Supervisor,
    newCopastor: Copastor,
    newPastor: Pastor,
    newChurch: Church,
    user: User,
  ) {
    if (supervisor.theirCopastor?.id === newCopastor?.id) return;

    const repositories = [
      this.zoneRepository,
      this.preacherRepository,
      this.familyGroupRepository,
      this.discipleRepository,
    ];

    await Promise.all(
      repositories.map(async (repo: any) => {
        const items = await repo.find({ relations: ['theirSupervisor'] });

        const connected = items.filter(
          (i: any) => i?.theirSupervisor?.id === supervisor.id,
        );

        await Promise.all(
          connected.map(async (item: any) => {
            await repo.update(item.id, {
              theirCopastor: newCopastor,
              theirChurch: newChurch,
              theirPastor: newPastor,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );
      }),
    );
  }

  private async raiseSupervisorLevelToCopastor(
    supervisor: Supervisor,
    savedMember: Member,
    body: UpdateSupervisorDto,
    user: User,
  ): Promise<Copastor> {
    const { theirPastor, theirMinistries } = body;

    if (!theirPastor) {
      throw new NotFoundException(
        `Para promover de Supervisor a Co-Pastor se le debe asignar un Pastor.`,
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

    if (newPastor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(`El Pastor debe estar en estado "Activo".`);
    }

    if (!newPastor.theirChurch) {
      throw new BadRequestException(
        `El Pastor debe tener una Iglesia asignada.`,
      );
    }

    const newChurch = await this.churchRepository.findOne({
      where: { id: newPastor.theirChurch.id },
      relations: ['theirMainChurch'],
    });

    if (newChurch.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La Iglesia debe estar en estado "Activo".`,
      );
    }

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

    const offeringsByOldSupervisor = await this.offeringIncomeRepository.find({
      where: {
        supervisor: { id: supervisor.id },
      },
    });

    await Promise.all(
      offeringsByOldSupervisor.map((offering) =>
        this.offeringIncomeRepository.update(offering.id, {
          supervisor: null,
          memberType: MemberOfferingType.Copastor,
          copastor: savedCopastor,
          updatedAt: new Date(),
          updatedBy: user,
        }),
      ),
    );

    await this.supervisorRepository.remove(supervisor);

    return savedCopastor;
  }
}
