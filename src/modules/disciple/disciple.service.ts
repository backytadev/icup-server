import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository, FindOptionsOrderValue } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { MemberRole } from '@/common/enums/member-role.enum';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { RelationType } from '@/common/enums/relation-type.enum';

import { InactivateMemberDto } from '@/common/dtos/inactivate-member.dto';

import { BaseService } from '@/common/services/base.service';
import { MemberSearchStrategyFactory } from '@/common/strategies/search/member-search-strategy.factory';
import { createMinistryMember } from '@/common/helpers/create-ministry-member';

import { raiseLevelMinistryMember } from '@/common/helpers/raise-level-ministry-member';

import { discipleDataFormatter } from '@/modules/disciple/helpers/disciple-data-formatter.helper';

import { CreateDiscipleDto } from '@/modules/disciple/dto/create-disciple.dto';
import { UpdateDiscipleDto } from '@/modules/disciple/dto/update-disciple.dto';
import { DisciplePaginationDto } from '@/modules/disciple/dto/disciple-pagination.dto';
import { DiscipleSearchAndPaginationDto } from '@/modules/disciple/dto/disciple-search-and-pagination.dto';

import { MemberOfferingType } from '@/modules/offering/income/enums/member-offering-type.enum';

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
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { MinistryMember } from '@/modules/ministry/entities/ministry-member.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';

@Injectable()
export class DiscipleService extends BaseService {
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
  async create(body: CreateDiscipleDto, user: User): Promise<Disciple> {
    try {
      const {
        church,
        pastor,
        copastor,
        supervisor,
        zone,
        preacher,
        familyGroup,
      } = await this.validateDiscipleCreation(body);

      const memberData = this.buildMemberData(body);
      const newMember = this.memberRepository.create(memberData);
      await this.memberRepository.save(newMember);

      const discipleData = this.buildCreateEntityData({
        user,
        member: {
          ...newMember,
          conversionDate: body.conversionDate ?? null,
          email: body.email ?? null,
          phoneNumber: body.phoneNumber ?? null,
        },
        extraProps: {
          theirChurch: church ?? null,
          theirPastor: pastor ?? null,
          theirCopastor: copastor ?? null,
          theirSupervisor: supervisor ?? null,
          theirZone: zone ?? null,
          theirPreacher: preacher ?? null,
          theirFamilyGroup: familyGroup ?? null,
          relationType: body.relationType ?? null,
        },
      });

      const newDisciple = this.discipleRepository.create(discipleData);

      if (body.theirMinistries?.length > 0) {
        await createMinistryMember({
          theirMinistries: body.theirMinistries,
          ministryRepository: this.ministryRepository,
          ministryMemberRepository: this.ministryMemberRepository,
          newMember,
          user,
        });
      }

      return await this.discipleRepository.save(newDisciple);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.handleDBExceptions(error, {
        disciple: 'El registro del Discípulo no pudo completarse.',
      });
    }
  }

  //* Find all
  async findAll(query: DisciplePaginationDto): Promise<Disciple[]> {
    const { limit, offset = 0, order = 'ASC', isSimpleQuery, churchId } = query;

    try {
      if (isSimpleQuery) {
        return await this.findBasicQuery<Disciple>({
          order: order as FindOptionsOrderValue,
          churchId: churchId,
          churchRepository: this.churchRepository,
          mainRepository: this.discipleRepository,
          relations: ['member'],
        });
      }

      return await this.findDetailedQuery<Disciple>({
        limit,
        offset,
        order: order as FindOptionsOrderValue,
        churchId,
        mainRepository: this.discipleRepository,
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
          'theirPreacher.member',
          'theirFamilyGroup',
        ],
        moduleKey: 'disciples',
        formatterData: discipleDataFormatter,
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find by filters
  async findByFilters(
    query: DiscipleSearchAndPaginationDto,
  ): Promise<Disciple[]> {
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
        preacherRepository: this.preacherRepository,
      });

      return await searchStrategy.execute<Disciple>({
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
          'theirPreacher.member',
          'theirFamilyGroup',
        ],
        mainRepository: this.discipleRepository,
        familyGroupRepository: this.familyGroupRepository,
        zoneRepository: this.zoneRepository,
        moduleKey: 'disciples',
        moduleName: 'discípulos',
        formatterData: discipleDataFormatter,
        ...personContext,
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Update
  async update(
    id: string,
    dto: UpdateDiscipleDto,
    user: User,
  ): Promise<Disciple | Preacher> {
    await this.validateId(id);

    const disciple = await this.findOrFail<Disciple>({
      repository: this.discipleRepository,
      where: { id },
      relations: [
        'member',
        'member.ministries',
        'member.ministries.ministry',
        'theirChurch',
        'theirPastor.member',
        'theirCopastor.member',
        'theirSupervisor.member',
        'theirPreacher.member',
        'theirZone',
        'theirFamilyGroup',
      ],
      moduleName: 'discípulo',
    });

    this.validateRequiredRoles(dto.roles as MemberRole[], [
      MemberRole.Disciple,
      MemberRole.Preacher,
    ]);

    this.validateRoleHierarchy({
      memberRoles: disciple.member.roles as MemberRole[],
      rolesToAssign: dto.roles as MemberRole[],
      config: {
        mainRole: MemberRole.Disciple,
        forbiddenRoles: [],
        breakStrictRoles: [MemberRole.Preacher],
        hierarchyOrder: [
          MemberRole.Disciple,
          MemberRole.Preacher,
          MemberRole.Supervisor,
          MemberRole.Copastor,
          MemberRole.Pastor,
        ],
      },
    });

    this.validateRecordStatusUpdate(disciple, dto.recordStatus as RecordStatus);

    const isRaiseToPreacher =
      disciple.member.roles.includes(MemberRole.Disciple) &&
      dto.roles.includes(MemberRole.Preacher) &&
      disciple.recordStatus === RecordStatus.Active;

    let church: Church;
    let pastor: Pastor;
    let copastor: Copastor | null = null;
    let supervisor: Supervisor | null = null;
    let zone: Zone | null = null;
    let familyGroup: FamilyGroup | null = null;
    let mustUpdateMember = true;

    if (!isRaiseToPreacher) {
      ({
        church,
        pastor,
        copastor,
        supervisor,
        zone,
        familyGroup,
        mustUpdateMember,
      } = await this.resolveDiscipleRelation(disciple, dto));
    }

    const savedMember = await this.updateEntityMember({
      entity: disciple,
      dto,
      mustUpdateMember,
      memberRepository: this.memberRepository,
    });

    if (isRaiseToPreacher) {
      return this.raiseDiscipleLevelToPreacher(
        disciple,
        savedMember,
        dto,
        user,
      );
    }

    const payload = this.buildUpdateEntityData({
      entityId: disciple.id,
      user,
      savedMember,
      extraProps: {
        ...dto,
        theirChurch: church,
        theirPastor: pastor,
        theirCopastor: copastor,
        theirSupervisor: supervisor,
        theirZone: zone,
        theirFamilyGroup: familyGroup,
        relationType: dto.relationType ?? null,
        inactivationCategory:
          dto.recordStatus === RecordStatus.Active
            ? null
            : dto.memberInactivationCategory,
        inactivationReason:
          dto.recordStatus === RecordStatus.Active
            ? null
            : dto.memberInactivationReason,
        recordStatus: dto.recordStatus,
      },
    });

    const updatedDisciple = await this.discipleRepository.preload(payload);

    await this.updateMinistriesIfNeeded({
      entity: disciple,
      theirMinistries: dto.theirMinistries,
      savedMember,
      user,
      ministryRepository: this.ministryRepository,
      ministryMemberRepository: this.ministryMemberRepository,
    });

    return await this.discipleRepository.save(updatedDisciple);
  }

  //* Inactivate
  async remove(
    id: string,
    dto: InactivateMemberDto,
    user: User,
  ): Promise<void> {
    await this.validateId(id);

    const disciple = await this.findOrFail<Disciple>({
      repository: this.discipleRepository,
      where: { id },
      relations: [],
      moduleName: 'disciple',
    });

    await this.inactivateEntity({
      entity: disciple,
      user,
      entityRepository: this.discipleRepository,
      extraProps: {
        inactivationCategory: dto.memberInactivationCategory,
        inactivationReason: dto.memberInactivationReason,
        recordStatus: RecordStatus.Inactive,
      },
    });
  }

  // ---------------------------------------------------------------------------------------------- //

  //? Private methods
  //* Validations
  private async validateDiscipleCreation(dto: CreateDiscipleDto): Promise<{
    church: Church | null;
    pastor: Pastor | null;
    copastor: Copastor | null;
    supervisor: Supervisor | null;
    zone: Zone | null;
    preacher: Preacher | null;
    familyGroup: FamilyGroup | null;
  }> {
    const { roles, relationType, theirFamilyGroup, theirPastor } = dto;

    //* Roles
    if (!roles.includes(MemberRole.Disciple)) {
      throw new BadRequestException(`El rol "Discípulo" debe ser incluido.`);
    }

    const invalidRoles = [
      MemberRole.Pastor,
      MemberRole.Copastor,
      MemberRole.Supervisor,
      MemberRole.Preacher,
      MemberRole.Treasurer,
    ];

    if (roles.some((r: any) => invalidRoles.includes(r))) {
      throw new BadRequestException(
        `Para crear un Discípulo solo se permite el rol "Discípulo".`,
      );
    }

    switch (relationType) {
      case RelationType.OnlyRelatedHierarchicalCover:
      case RelationType.RelatedBothMinistriesAndHierarchicalCover:
        return this.resolveDiscipleByFamilyGroup(theirFamilyGroup);

      case RelationType.OnlyRelatedMinistries:
        return this.resolveDiscipleByPastorOnlyMinistries(theirPastor);

      default:
        throw new BadRequestException(
          'Tipo de relación no válido para Discípulo.',
        );
    }
  }

  private async resolveDiscipleByFamilyGroup(familyGroupId?: string): Promise<{
    church: Church;
    pastor: Pastor;
    copastor: Copastor;
    supervisor: Supervisor;
    zone: Zone;
    preacher: Preacher;
    familyGroup: FamilyGroup;
  }> {
    if (!familyGroupId) {
      throw new NotFoundException(`Debe asignar un Grupo Familiar.`);
    }

    const familyGroup = await this.familyGroupRepository.findOne({
      where: { id: familyGroupId },
      relations: [
        'theirChurch',
        'theirPastor',
        'theirCopastor',
        'theirSupervisor',
        'theirZone',
        'theirPreacher',
      ],
    });

    if (!familyGroup) {
      throw new NotFoundException(
        `No se encontró Grupo Familiar con id: ${familyGroupId}`,
      );
    }

    if (familyGroup.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(`El Grupo Familiar debe estar activo.`);
    }

    if (
      !familyGroup.theirChurch ||
      !familyGroup.theirPastor ||
      !familyGroup.theirCopastor ||
      !familyGroup.theirSupervisor ||
      !familyGroup.theirZone ||
      !familyGroup.theirPreacher
    ) {
      throw new NotFoundException(
        `El Grupo Familiar no tiene jerarquía completa asignada.`,
      );
    }

    if (familyGroup.theirChurch.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(`La Iglesia debe estar activa.`);
    }

    return {
      familyGroup,
      preacher: familyGroup.theirPreacher,
      zone: familyGroup.theirZone,
      supervisor: familyGroup.theirSupervisor,
      copastor: familyGroup.theirCopastor,
      pastor: familyGroup.theirPastor,
      church: familyGroup.theirChurch,
    };
  }

  private async resolveDiscipleByPastorOnlyMinistries(
    pastorId?: string,
  ): Promise<{
    church: Church;
    pastor: Pastor;
    copastor: null;
    supervisor: null;
    zone: null;
    preacher: null;
    familyGroup: null;
  }> {
    if (!pastorId) {
      throw new NotFoundException(`Debe asignar un Pastor.`);
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: pastorId },
      relations: ['theirChurch'],
    });

    if (!pastor || pastor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(`El Pastor debe estar activo.`);
    }

    if (!pastor.theirChurch) {
      throw new NotFoundException(`El Pastor no tiene Iglesia asignada.`);
    }

    if (pastor.theirChurch.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(`La Iglesia debe estar activa.`);
    }

    return {
      pastor,
      church: pastor.theirChurch,
      copastor: null,
      supervisor: null,
      zone: null,
      preacher: null,
      familyGroup: null,
    };
  }

  private async resolveDiscipleRelation(
    disciple: Disciple,
    dto: UpdateDiscipleDto,
  ): Promise<{
    church: Church;
    pastor: Pastor;
    copastor: Copastor | null;
    supervisor: Supervisor | null;
    zone: Zone | null;
    preacher: Preacher | null;
    familyGroup: FamilyGroup | null;
    mustUpdateMember: boolean;
  }> {
    const { relationType, theirFamilyGroup, theirPastor } = dto;

    if (
      relationType === RelationType.OnlyRelatedHierarchicalCover ||
      relationType === RelationType.RelatedBothMinistriesAndHierarchicalCover
    ) {
      if (!theirFamilyGroup) {
        throw new NotFoundException(`Debe asignar un Grupo Familiar.`);
      }

      const familyGroup = await this.familyGroupRepository.findOne({
        where: { id: theirFamilyGroup },
        relations: [
          'theirPastor',
          'theirCopastor',
          'theirChurch',
          'theirZone',
          'theirPreacher',
        ],
      });

      if (!familyGroup || familyGroup.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(`Grupo familiar inválido o inactivo.`);
      }

      return {
        familyGroup,
        church: familyGroup.theirChurch,
        pastor: familyGroup.theirPastor,
        copastor: familyGroup.theirCopastor,
        supervisor: familyGroup.theirSupervisor,
        preacher: familyGroup.theirPreacher,
        zone: familyGroup.theirZone,
        mustUpdateMember: true,
      };
    }

    if (relationType === RelationType.OnlyRelatedMinistries) {
      if (!theirPastor) {
        throw new NotFoundException(`Debe asignar un Pastor.`);
      }

      const pastor = await this.pastorRepository.findOne({
        where: { id: theirPastor },
        relations: ['theirChurch'],
      });

      return {
        church: pastor.theirChurch,
        pastor: pastor,
        copastor: null,
        supervisor: null,
        preacher: null,
        zone: null,
        familyGroup: null,
        mustUpdateMember: true,
      };
    }

    throw new BadRequestException(`Tipo de relación no válido.`);
  }

  private async raiseDiscipleLevelToPreacher(
    disciple: Disciple,
    savedMember: Member,
    body: UpdateDiscipleDto,
    user: User,
  ): Promise<Preacher> {
    const { theirSupervisor, theirPastor, theirMinistries } = body;

    let pastor: Pastor;
    let copastor: Copastor;
    let supervisor: Supervisor | null = null;
    let church: Church;

    if (theirSupervisor) {
      supervisor = await this.supervisorRepository.findOne({
        where: { id: theirSupervisor },
        relations: ['theirPastor', 'theirPastor', 'theirChurch'],
      });

      pastor = supervisor.theirPastor;
      copastor = supervisor.theirCopastor;
      church = supervisor.theirChurch;
    } else {
      pastor = await this.pastorRepository.findOne({
        where: { id: theirPastor },
        relations: ['theirChurch'],
      });

      church = pastor.theirChurch;
    }

    const newPreacher = this.preacherRepository.create({
      member: savedMember,
      theirChurch: church,
      theirPastor: pastor,
      theirCopastor: copastor,
      theirSupervisor: supervisor,
      theirZone: supervisor.theirZone,
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

    const savedPreacher = await this.preacherRepository.save(newPreacher);

    const offerings = await this.offeringIncomeRepository.find({
      where: { disciple: { id: disciple.id } },
    });

    await Promise.all(
      offerings.map((o) =>
        this.offeringIncomeRepository.update(o.id, {
          disciple: null,
          preacher: savedPreacher,
          memberType: MemberOfferingType.Preacher,
          updatedAt: new Date(),
          updatedBy: user,
        }),
      ),
    );
    await this.discipleRepository.remove(disciple);

    return savedPreacher;
  }
}
