import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrderValue, Repository } from 'typeorm';

import { CopastorSearchSubType } from '@/modules/copastor/enums/copastor-search-sub-type.enum';

import { CreateCopastorDto } from '@/modules/copastor/dto/create-copastor.dto';
import { UpdateCopastorDto } from '@/modules/copastor/dto/update-copastor.dto';
import { CoPastorPaginationDto } from '@/modules/copastor/dto/copastor-pagination.dto';
import { CoPastorSearchAndPaginationDto } from '@/modules/copastor/dto/copastor-search-and-pagination.dto';

import { copastorDataFormatter } from '@/modules/copastor/helpers/copastor-data-formatter.helper';

import { BaseService } from '@/common/services/base.service';
import { SearchStrategyFactory } from '@/common/strategies/search/search-strategy.factory';

import { MemberRole } from '@/common/enums/member-role.enum';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { RelationType } from '@/common/enums/relation-type.enum';

import { InactivateMemberDto } from '@/common/dtos/inactivate-member.dto';

import { createMinistryMember } from '@/common/helpers/create-ministry-member';
import { raiseLevelMinistryMember } from '@/common/helpers/raise-level-ministry-member';

import { MemberType } from '@/modules/offering/income/enums/member-type.enum';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Church } from '@/modules/church/entities/church.entity';
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
export class CopastorService extends BaseService {
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

  //* Create
  async create(body: CreateCopastorDto, user: User): Promise<Copastor> {
    try {
      const { church, pastor } = await this.validateCopastorCreation(body);

      const memberData = this.buildMemberData(body);
      const newMember = this.memberRepository.create(memberData);
      await this.memberRepository.save(newMember);

      const copastorData = this.buildCreateEntityData({
        user,
        member: {
          ...newMember,
          conversionDate: body.conversionDate ?? null,
          email: body.email ?? null,
          phoneNumber: body.phoneNumber ?? null,
        },
        extraProps: {
          ...body,
          relationType: body.relationType ?? null,
          theirChurch: church,
          theirPastor: pastor,
        },
      });

      const newCopastor = this.copastorRepository.create(copastorData);

      if (body.theirMinistries?.length > 0) {
        await createMinistryMember({
          theirMinistries: body.theirMinistries,
          ministryRepository: this.ministryRepository,
          ministryMemberRepository: this.ministryMemberRepository,
          newMember,
          user,
        });
      }

      return await this.copastorRepository.save(newCopastor);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      this.handleDBExceptions(error, {
        email: 'El correo electrónico ya está en uso.',
        copastor: 'El registro del Co-Pastor no pudo completarse.',
      });
    }
  }

  //* Find all
  async findAll(query: CoPastorPaginationDto): Promise<Copastor[]> {
    const { limit, offset = 0, order = 'ASC', isSimpleQuery, churchId } = query;

    try {
      if (isSimpleQuery) {
        return await this.findBasicQuery<Copastor>({
          order: order as FindOptionsOrderValue,
          churchId: churchId,
          churchRepository: this.churchRepository,
          mainRepository: this.copastorRepository,
          relations: ['member', 'theirPastor.member', 'theirChurch'],
        });
      }

      return await this.findDetailedQuery<Copastor>({
        limit,
        offset,
        order: order as FindOptionsOrderValue,
        churchId,
        mainRepository: this.copastorRepository,
        relations: [
          'updatedBy',
          'createdBy',
          'member',
          'member.ministries',
          'member.ministries.ministry',
          'member.ministries.ministry.theirChurch',
          'zones',
          'familyGroups',
          'theirChurch',
          'theirPastor.member',
          'supervisors.member',
          'preachers.member',
          'disciples.member',
        ],
        moduleKey: 'copastors',
        formatterData: copastorDataFormatter,
        relationLoadStrategy: 'query',
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find by filters
  async findByFilters(
    query: CoPastorSearchAndPaginationDto,
  ): Promise<Copastor[]> {
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

      return await searchStrategy.execute<Copastor>({
        params: query,
        church,
        relations: [
          'updatedBy',
          'createdBy',
          'member',
          'member.ministries',
          'member.ministries.ministry',
          'member.ministries.ministry.theirChurch',
          'zones',
          'familyGroups',
          'theirChurch',
          'theirPastor.member',
          'supervisors.member',
          'preachers.member',
          'disciples.member',
        ],
        mainRepository: this.copastorRepository,
        moduleKey: 'copastors',
        moduleName: 'co-pastores(as)',
        formatterData: copastorDataFormatter,
        relationLoadStrategy: 'query',
        ...personContext,
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Update
  async update(
    id: string,
    body: UpdateCopastorDto,
    user: User,
  ): Promise<Copastor | Pastor> {
    await this.validateId(id);

    const copastor = await this.findOrFail<Copastor>({
      repository: this.copastorRepository,
      where: { id },
      relations: [
        'theirChurch',
        'member',
        'member.ministries',
        'member.ministries.ministry',
        'member.ministries.ministry.theirChurch',
      ],
      moduleName: 'copastor',
    });

    this.validateRequiredRoles(body.roles as MemberRole[], [
      MemberRole.Copastor,
      MemberRole.Pastor,
    ]);

    this.validateRoleHierarchy({
      memberRoles: copastor.member.roles as MemberRole[],
      rolesToAssign: body.roles as MemberRole[],
      config: {
        mainRole: MemberRole.Copastor,
        forbiddenRoles: [
          MemberRole.Supervisor,
          MemberRole.Preacher,
          MemberRole.Treasurer,
          MemberRole.Disciple,
        ],
        breakStrictRoles: [MemberRole.Pastor],
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
      copastor,
      body.recordStatus as RecordStatus,
    );

    const isRaiseToPastor =
      copastor.member.roles.includes(MemberRole.Copastor) &&
      body.roles.includes(MemberRole.Pastor) &&
      copastor.recordStatus === RecordStatus.Active;

    let church: Church;
    let pastor: Pastor | null = null;
    let mustUpdateMember = true;

    if (!isRaiseToPastor) {
      ({ church, pastor, mustUpdateMember } = await this.resolvePastorRelation(
        copastor,
        body,
      ));
    }

    const savedMember = await this.updateEntityMember({
      entity: copastor,
      dto: body,
      mustUpdateMember,
      memberRepository: this.memberRepository,
    });

    if (
      copastor.member.roles.includes(MemberRole.Copastor) &&
      body.roles.includes(MemberRole.Pastor) &&
      copastor.recordStatus === RecordStatus.Active
    ) {
      return await this.raiseCopastorLevelToPastor(
        copastor,
        savedMember,
        body,
        user,
      );
    }

    const payload = this.buildUpdateEntityData({
      entityId: copastor.id,
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
        conversionDate: body.conversionDate ?? null,
        email: body.email ?? null,
        phoneNumber: body.phoneNumber ?? null,
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

    const updatedCopastor = await this.copastorRepository.preload(payload);

    await this.updateMinistriesIfNeeded({
      entity: copastor,
      theirMinistries: body.theirMinistries,
      savedMember,
      user,
      ministryRepository: this.ministryRepository,
      ministryMemberRepository: this.ministryMemberRepository,
    });

    await this.updateSubordinateRelationsIfPastorChanged(
      copastor,
      pastor,
      church,
      user,
    );

    return await this.copastorRepository.save(updatedCopastor);
  }

  //* Delete
  async remove(
    id: string,
    dto: InactivateMemberDto,
    user: User,
  ): Promise<void> {
    await this.validateId(id);

    const copastor = await this.findOrFail<Copastor>({
      repository: this.copastorRepository,
      where: { id },
      relations: [],
      moduleName: 'copastor',
    });

    await this.inactivateEntity({
      entity: copastor,
      user,
      entityRepository: this.copastorRepository,
      extraProps: {
        inactivationCategory: dto.memberInactivationCategory,
        inactivationReason: dto.memberInactivationReason,
        recordStatus: RecordStatus.Inactive,
      },
    });

    await this.cleanSubordinateRelations(copastor, user, [
      { repo: this.supervisorRepository, relation: 'theirCopastor' },
      { repo: this.zoneRepository, relation: 'theirCopastor' },
      { repo: this.preacherRepository, relation: 'theirCopastor' },
      { repo: this.familyGroupRepository, relation: 'theirCopastor' },
      { repo: this.discipleRepository, relation: 'theirCopastor' },
    ]);
  }

  // ---------------------------------------------------------------------------------------------- //

  //? Private methods
  //* Validations
  private async validateCopastorCreation(
    dto: CreateCopastorDto,
  ): Promise<{ church: Church; pastor: Pastor }> {
    const { roles, theirPastor } = dto;

    if (!roles.includes(MemberRole.Copastor)) {
      throw new BadRequestException(`El rol "Co-Pastor" deben ser incluidos.`);
    }

    const invalidRoles = [
      MemberRole.Pastor,
      MemberRole.Supervisor,
      MemberRole.Preacher,
      MemberRole.Treasurer,
      MemberRole.Disciple,
    ];

    if (roles.some((r: any) => invalidRoles.includes(r))) {
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
        `No se encontró Pastor con id: ${theirPastor}.`,
      );
    }

    if (pastor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
      );
    }

    if (!pastor.theirChurch) {
      throw new NotFoundException(
        `No se encontró la Iglesia asociada al Pastor.`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: pastor.theirChurch.id },
    });

    if (!church) {
      throw new NotFoundException(
        `No se encontró Iglesia con id: ${pastor.theirChurch.id}.`,
      );
    }

    if (church.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
      );
    }

    return { church, pastor };
  }

  //* Finders and actions
  private resolvePersonContext(searchSubType?: CopastorSearchSubType) {
    if (!searchSubType) return {};

    switch (searchSubType) {
      case CopastorSearchSubType.CopastorByPastorFirstNames:
      case CopastorSearchSubType.CopastorByPastorLastNames:
      case CopastorSearchSubType.CopastorByPastorFullNames:
        return {
          personRepository: this.pastorRepository,
          computedKey: 'theirPastor',
          personName: 'pastor',
        };

      case CopastorSearchSubType.ByCopastorFirstNames:
      case CopastorSearchSubType.ByCopastorLastNames:
      case CopastorSearchSubType.ByCopastorFullNames:
        return {
          personRepository: null,
          computedKey: '',
          personName: '',
        };
      default:
        throw new BadRequestException('Subtipo de búsqueda no válido');
    }
  }

  private async resolvePastorRelation(
    copastor: Copastor,
    dto: UpdateCopastorDto,
  ): Promise<{
    pastor: Pastor;
    church: Church;
    mustUpdateMember: boolean;
  }> {
    console.log(dto);

    if (copastor.theirPastor?.id === dto.theirPastor) {
      return {
        pastor: copastor.theirPastor,
        church: copastor.theirChurch,
        mustUpdateMember: true,
      };
    }

    if (!dto.theirPastor) {
      throw new NotFoundException(
        `Para actualizar un Co-Pastor, se debe asignar un Pastor.`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: dto.theirPastor },
      relations: ['theirChurch'],
    });

    if (!pastor) {
      throw new NotFoundException(
        `Pastor con el id: ${dto.theirPastor}, no fue encontrado.`,
      );
    }

    if (pastor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
      );
    }

    if (!pastor.theirChurch) {
      throw new BadRequestException(
        `No se encontró la Iglesia, verificar que Pastor tenga una Iglesia asignada.`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: pastor.theirChurch.id },
    });

    if (church.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
      );
    }

    return {
      pastor: pastor,
      church: church,
      mustUpdateMember: true,
    };
  }

  private async updateSubordinateRelationsIfPastorChanged(
    copastor: Copastor,
    newPastor: Pastor,
    newChurch: Church,
    user: User,
  ) {
    if (copastor.theirPastor?.id === newPastor.id) return;

    const repositories = [
      this.supervisorRepository,
      this.zoneRepository,
      this.preacherRepository,
      this.familyGroupRepository,
      this.discipleRepository,
    ];

    await Promise.all(
      repositories.map(async (repo: any) => {
        const items = await repo.find({ relations: ['theirCopastor'] });

        const connected = items.filter(
          (i: any) => i?.theirCopastor?.id === copastor.id,
        );

        await Promise.all(
          connected.map(async (item: any) => {
            await repo.update(item.id, {
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

  private async raiseCopastorLevelToPastor(
    copastor: Copastor,
    savedMember: Member,
    body: UpdateCopastorDto,
    user: User,
  ): Promise<Pastor> {
    const { theirChurch, theirMinistries } = body;

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
      throw new NotFoundException(
        `Iglesia con id: ${theirChurch} no fue encontrada.`,
      );
    }

    if (newChurch.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La Iglesia debe estar en estado "Activo".`,
      );
    }

    const newPastor = this.pastorRepository.create({
      member: savedMember,
      theirChurch: newChurch,
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

    const savedPastor = await this.pastorRepository.save(newPastor);

    const offeringsByOldCopastor = await this.offeringIncomeRepository.find({
      where: {
        copastor: { id: copastor.id },
      },
    });

    await Promise.all(
      offeringsByOldCopastor.map(async (offering) => {
        await this.offeringIncomeRepository.update(offering.id, {
          copastor: null,
          memberType: MemberType.Pastor,
          pastor: savedPastor,
          updatedAt: new Date(),
          updatedBy: user,
        });
      }),
    );

    await this.copastorRepository.remove(copastor);

    return savedPastor;
  }
}
