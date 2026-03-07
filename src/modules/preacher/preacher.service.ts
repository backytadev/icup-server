import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository, FindOptionsOrderValue } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseService } from '@/common/services/base.service';
import { MemberSearchStrategyFactory } from '@/common/strategies/search/member-search-strategy.factory';

import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { preacherDataFormatter } from '@/modules/preacher/helpers/preacher-data-formatter.helper';

import { CreatePreacherDto } from '@/modules/preacher/dto/create-preacher.dto';
import { UpdatePreacherDto } from '@/modules/preacher/dto/update-preacher.dto';
import { PreacherPaginationDto } from '@/modules/preacher/dto/preacher-pagination.dto';
import { PreacherSearchAndPaginationDto } from '@/modules/preacher/dto/preacher-search-and-pagination.dto';

import { MemberRole } from '@/common/enums/member-role.enum';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { RelationType } from '@/common/enums/relation-type.enum';

import { InactivateMemberDto } from '@/common/dtos/inactivate-member.dto';

import { createMinistryMember } from '@/common/helpers/create-ministry-member';
import { raiseLevelMinistryMember } from '@/common/helpers/raise-level-ministry-member';

import { MemberOfferingType } from '@/modules/offering/income/enums/member-offering-type.enum';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Member } from '@/modules/member/entities/member.entity';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { MinistryMember } from '@/modules/ministry/entities/ministry-member.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';

@Injectable()
export class PreacherService extends BaseService {
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

    private readonly searchStrategyFactory: MemberSearchStrategyFactory,
  ) {
    super();
  }

  //* Create
  async create(body: CreatePreacherDto, user: User): Promise<Preacher> {
    try {
      const { church, pastor, copastor, supervisor, zone } =
        await this.validatePreacherCreation(body);

      const memberData = this.buildMemberData(body);
      const newMember = this.memberRepository.create(memberData);
      await this.memberRepository.save(newMember);

      const preacherData = this.buildCreateEntityData({
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
          theirSupervisor: supervisor,
          theirZone: zone,
          relationType: body.relationType ?? null,
        },
      });

      const newPreacher = this.preacherRepository.create(preacherData);

      if (body.theirMinistries?.length > 0) {
        await createMinistryMember({
          theirMinistries: body.theirMinistries,
          ministryRepository: this.ministryRepository,
          ministryMemberRepository: this.ministryMemberRepository,
          newMember,
          user,
        });
      }

      return await this.preacherRepository.save(newPreacher);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.handleDBExceptions(error, {
        preacher: 'El registro del Predicador no pudo completarse.',
      });
    }
  }

  //* Fin all
  async findAll(query: PreacherPaginationDto): Promise<Preacher[]> {
    const { limit, offset = 0, order = 'ASC', isSimpleQuery, churchId } = query;

    try {
      if (isSimpleQuery) {
        return await this.findBasicQuery<Preacher>({
          order: order as FindOptionsOrderValue,
          churchId: churchId,
          churchRepository: this.churchRepository,
          mainRepository: this.preacherRepository,
          relations: ['member'],
        });
      }

      return await this.findDetailedQuery<Preacher>({
        limit,
        offset,
        order: order as FindOptionsOrderValue,
        churchId,
        mainRepository: this.preacherRepository,
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
          'theirSupervisor.member',
          'theirZone',
          'theirFamilyGroup',
          'disciples.member',
        ],
        moduleKey: 'preachers',
        formatterData: preacherDataFormatter,
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find by filters
  async findByFilters(
    query: PreacherSearchAndPaginationDto,
  ): Promise<Preacher[]> {
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

      const searchStrategy = this.searchStrategyFactory.getStrategy(searchType);

      const personContext = this.resolvePersonContext(searchSubType as string, {
        pastorRepository: this.pastorRepository,
        copastorRepository: this.copastorRepository,
        supervisorRepository: this.supervisorRepository,
      });

      return await searchStrategy.execute<Preacher>({
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
          'theirSupervisor.member',
          'theirZone',
          'theirFamilyGroup',
          'disciples.member',
        ],
        mainRepository: this.preacherRepository,
        familyGroupRepository: this.familyGroupRepository,
        zoneRepository: this.zoneRepository,
        moduleKey: 'preachers',
        moduleName: 'predicadores(as)',
        formatterData: preacherDataFormatter,
        ...personContext,
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Update
  async update(
    id: string,
    body: UpdatePreacherDto,
    user: User,
  ): Promise<Preacher | Supervisor> {
    await this.validateId(id);

    const preacher = await this.findOrFail<Preacher>({
      repository: this.preacherRepository,
      where: { id },
      relations: [
        'member',
        'member.ministries',
        'member.ministries.ministry',
        'theirSupervisor',
        'theirCopastor',
        'theirPastor',
        'theirChurch',
        'theirZone',
      ],
      moduleName: 'preacher',
    });

    this.validateRequiredRoles(body.roles as MemberRole[], [
      MemberRole.Preacher,
      MemberRole.Supervisor,
    ]);

    this.validateRoleHierarchy({
      memberRoles: preacher.member.roles as MemberRole[],
      rolesToAssign: body.roles as MemberRole[],
      config: {
        mainRole: MemberRole.Preacher,
        forbiddenRoles: [MemberRole.Disciple],
        breakStrictRoles: [MemberRole.Supervisor, MemberRole.Copastor],
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
      preacher,
      body.recordStatus as RecordStatus,
    );

    const isRaiseToSupervisor =
      preacher.member.roles.includes(MemberRole.Preacher) &&
      body.roles.includes(MemberRole.Supervisor) &&
      preacher.recordStatus === RecordStatus.Active;

    let church: Church;
    let pastor: Pastor;
    let copastor: Copastor | null = null;
    let supervisor: Supervisor | null = null;
    let zone: Zone | null = null;
    let mustUpdateMember = true;

    if (!isRaiseToSupervisor) {
      ({ church, pastor, copastor, supervisor, zone, mustUpdateMember } =
        await this.resolvePreacherRelation(preacher, body));
    }

    const savedMember = await this.updateEntityMember({
      entity: preacher,
      dto: body,
      mustUpdateMember,
      memberRepository: this.memberRepository,
    });

    if (isRaiseToSupervisor) {
      return await this.raisePreacherLevelToSupervisor(
        preacher,
        savedMember,
        body,
        user,
      );
    }

    const payload = this.buildUpdateEntityData({
      entityId: preacher.id,
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
        theirSupervisor: supervisor,
        theirZone: zone,
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

    const updatedPreacher = await this.preacherRepository.preload(payload);

    await this.updateMinistriesIfNeeded({
      entity: preacher,
      theirMinistries: body.theirMinistries,
      savedMember,
      user,
      ministryRepository: this.ministryRepository,
      ministryMemberRepository: this.ministryMemberRepository,
    });

    await this.updateSubordinateRelationsIfSupervisorChanged(
      preacher,
      supervisor,
      pastor,
      copastor,
      church,
      zone,
      user,
    );

    return await this.preacherRepository.save(updatedPreacher);
  }

  //* Delete
  async remove(
    id: string,
    dto: InactivateMemberDto,
    user: User,
  ): Promise<void> {
    await this.validateId(id);

    const preacher = await this.findOrFail<Preacher>({
      repository: this.preacherRepository,
      where: { id },
      relations: [],
      moduleName: 'preacher',
    });

    await this.inactivateEntity({
      entity: preacher,
      user,
      entityRepository: this.preacherRepository,
      extraProps: {
        inactivationCategory: dto.memberInactivationCategory,
        inactivationReason: dto.memberInactivationReason,
        recordStatus: RecordStatus.Inactive,
      },
    });

    await this.cleanSubordinateRelations(preacher, user, [
      { repo: this.familyGroupRepository, relation: 'theirPreacher' },
      { repo: this.discipleRepository, relation: 'theirPreacher' },
    ]);
  }

  // ---------------------------------------------------------------------------------------------- //

  //? Private methods
  //* Validations
  private async validatePreacherCreation(dto: CreatePreacherDto): Promise<{
    church: Church;
    pastor: Pastor | null;
    copastor: Copastor | null;
    supervisor: Supervisor | null;
    zone: Zone | null;
  }> {
    const { roles, relationType, theirSupervisor, theirPastorOnlyMinistries } =
      dto;

    //* Roles
    if (!roles.includes(MemberRole.Preacher)) {
      throw new BadRequestException(`El rol "Predicador" debe ser incluido.`);
    }

    const invalidRoles = [
      MemberRole.Pastor,
      MemberRole.Copastor,
      MemberRole.Supervisor,
      MemberRole.Disciple,
    ];

    if (roles.some((r: any) => invalidRoles.includes(r))) {
      throw new BadRequestException(
        `Para crear un Predicador solo se permiten los roles "Predicador" o "Tesorero".`,
      );
    }

    switch (relationType) {
      case RelationType.OnlyRelatedHierarchicalCover:
      case RelationType.RelatedBothMinistriesAndHierarchicalCover:
        return this.resolvePreacherBySupervisor(theirSupervisor);

      case RelationType.OnlyRelatedMinistries:
        return this.resolvePreacherByPastorOnlyMinistries(
          theirPastorOnlyMinistries,
        );

      default:
        throw new BadRequestException(
          'Tipo de relación no válido para Predicador.',
        );
    }
  }

  //* Finders and actions
  private async resolvePreacherBySupervisor(supervisorId?: string): Promise<{
    church: Church;
    pastor: Pastor;
    copastor: Copastor;
    supervisor: Supervisor;
    zone: Zone;
  }> {
    if (!supervisorId) {
      throw new NotFoundException(`Debe asignar un Supervisor.`);
    }

    const supervisor = await this.supervisorRepository.findOne({
      where: { id: supervisorId },
      relations: ['theirZone', 'theirCopastor', 'theirPastor', 'theirChurch'],
    });

    if (!supervisor)
      throw new NotFoundException(
        `No se encontró Supervisor con id: ${supervisorId}`,
      );

    if (supervisor.recordStatus === RecordStatus.Inactive)
      throw new BadRequestException(`El Supervisor debe estar activo.`);

    if (
      !supervisor.theirZone ||
      !supervisor.theirCopastor ||
      !supervisor.theirPastor ||
      !supervisor.theirChurch
    ) {
      throw new NotFoundException(
        `El Supervisor no tiene jerarquía completa asignada.`,
      );
    }

    if (supervisor.theirChurch.recordStatus === RecordStatus.Inactive)
      throw new BadRequestException(`La Iglesia debe estar activa.`);

    return {
      supervisor,
      zone: supervisor.theirZone,
      copastor: supervisor.theirCopastor,
      pastor: supervisor.theirPastor,
      church: supervisor.theirChurch,
    };
  }

  private async resolvePreacherByPastorOnlyMinistries(
    pastorId?: string,
  ): Promise<{
    church: Church;
    pastor: Pastor;
    copastor: null;
    supervisor: null;
    zone: null;
  }> {
    if (!pastorId) {
      throw new NotFoundException(`Debe asignar un Pastor.`);
    }

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
      supervisor: null,
      zone: null,
    };
  }

  private async resolvePreacherRelation(
    preacher: Preacher,
    dto: UpdatePreacherDto,
  ): Promise<{
    church: Church;
    pastor: Pastor;
    copastor: Copastor | null;
    supervisor: Supervisor | null;
    zone: Zone | null;
    mustUpdateMember: boolean;
  }> {
    const {
      relationType,
      theirSupervisor,
      theirPastorRelationDirect,
      theirPastorOnlyMinistries,
    } = dto;

    if (
      relationType === RelationType.OnlyRelatedHierarchicalCover ||
      relationType === RelationType.RelatedBothMinistriesAndHierarchicalCover
    ) {
      if (!theirSupervisor) {
        throw new NotFoundException(`Debe asignar un Supervisor.`);
      }

      const supervisor = await this.supervisorRepository.findOne({
        where: { id: theirSupervisor },
        relations: ['theirPastor', 'theirCopastor', 'theirChurch', 'theirZone'],
      });

      if (!supervisor || supervisor.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(`Supervisor inválido o inactivo.`);
      }

      return {
        supervisor,
        copastor: supervisor.theirCopastor,
        pastor: supervisor.theirPastor,
        church: supervisor.theirChurch,
        zone: supervisor.theirZone,
        mustUpdateMember: true,
      };
    }

    if (relationType === RelationType.RelatedDirectToPastor) {
      if (!theirPastorRelationDirect) {
        throw new NotFoundException(`Debe asignar un Pastor.`);
      }

      const pastor = await this.pastorRepository.findOne({
        where: { id: theirPastorRelationDirect },
        relations: ['theirChurch'],
      });

      return {
        supervisor: null,
        copastor: null,
        pastor,
        church: pastor.theirChurch,
        zone: null,
        mustUpdateMember: true,
      };
    }

    if (relationType === RelationType.OnlyRelatedMinistries) {
      if (!theirPastorOnlyMinistries) {
        throw new NotFoundException(`Debe asignar un Pastor.`);
      }

      const pastor = await this.pastorRepository.findOne({
        where: { id: theirPastorOnlyMinistries },
        relations: ['theirChurch'],
      });

      return {
        supervisor: null,
        copastor: null,
        pastor,
        church: pastor.theirChurch,
        zone: null,
        mustUpdateMember: true,
      };
    }

    throw new BadRequestException(`Tipo de relación no válido.`);
  }

  private async raisePreacherLevelToSupervisor(
    preacher: Preacher,
    savedMember: Member,
    body: UpdatePreacherDto,
    user: User,
  ): Promise<Supervisor> {
    const { theirCopastor, theirPastorRelationDirect, theirMinistries } = body;

    let pastor: Pastor;
    let copastor: Copastor | null = null;
    let church: Church;

    if (theirCopastor) {
      copastor = await this.copastorRepository.findOne({
        where: { id: theirCopastor },
        relations: ['theirPastor', 'theirChurch'],
      });

      pastor = copastor.theirPastor;
      church = copastor.theirChurch;
    } else {
      pastor = await this.pastorRepository.findOne({
        where: { id: theirPastorRelationDirect },
        relations: ['theirChurch'],
      });

      church = pastor.theirChurch;
    }

    const newSupervisor = this.supervisorRepository.create({
      member: savedMember,
      theirChurch: church,
      theirPastor: pastor,
      theirCopastor: copastor,
      // isDirectRelationToPastor: isDirectRelationToPastor,
      relationType:
        theirMinistries?.length > 0
          ? RelationType.RelatedBothMinistriesAndHierarchicalCover
          : RelationType.OnlyRelatedHierarchicalCover,
      createdAt: new Date(),
      createdBy: user,
    });

    if (theirMinistries?.length > 0) {
      await raiseLevelMinistryMember({
        theirMinistries,
        savedMember,
        ministryRepository: this.ministryRepository,
        ministryMemberRepository: this.ministryMemberRepository,
        user,
      });
    }

    const savedSupervisor = await this.supervisorRepository.save(newSupervisor);

    const offerings = await this.offeringIncomeRepository.find({
      where: { preacher: { id: preacher.id } },
    });

    await Promise.all(
      offerings.map((o) =>
        this.offeringIncomeRepository.update(o.id, {
          preacher: null,
          supervisor: savedSupervisor,
          memberType: MemberOfferingType.Supervisor,
          updatedAt: new Date(),
          updatedBy: user,
        }),
      ),
    );

    await this.preacherRepository.remove(preacher);

    return savedSupervisor;
  }

  private async updateSubordinateRelationsIfSupervisorChanged(
    preacher: Preacher,
    newSupervisor: Supervisor | null,
    newPastor: Pastor,
    newCopastor: Copastor | null,
    newChurch: Church,
    newZone: Zone | null,
    user: User,
  ) {
    if (preacher.theirSupervisor?.id === newSupervisor?.id) return;

    const repositories = [this.familyGroupRepository, this.discipleRepository];

    await Promise.all(
      repositories.map(async (repo: any) => {
        const items = await repo.find({ relations: ['theirPreacher'] });

        const connected = items.filter(
          (i: any) => i?.theirPreacher?.id === preacher.id,
        );

        await Promise.all(
          connected.map((item: any) =>
            repo.update(item.id, {
              theirSupervisor: newSupervisor,
              theirPastor: newPastor,
              theirCopastor: newCopastor,
              theirChurch: newChurch,
              theirZone: newZone,
              updatedAt: new Date(),
              updatedBy: user,
            }),
          ),
        );
      }),
    );
  }
}
