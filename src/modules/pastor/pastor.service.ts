import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrderValue, Repository } from 'typeorm';

import { pastorDataFormatter } from '@/modules/pastor/helpers/pastor-data-formatter.helper';

import { CreatePastorDto } from '@/modules/pastor/dto/create-pastor.dto';
import { UpdatePastorDto } from '@/modules/pastor/dto/update-pastor.dto';
import { PastorPaginationDto } from '@/modules/pastor/dto/pastor-pagination.dto';
import { PastorSearchAndPaginationDto } from '@/modules/pastor/dto/pastor-search-and-pagination.dto';

import { SearchStrategyFactory } from '@/common/strategies/search/search-strategy.factory';
import { BaseService } from '@/common/services/base.service';

import { MemberRole } from '@/common/enums/member-role.enum';
import { RecordStatus } from '@/common/enums/record-status.enum';

import { InactivateMemberDto } from '@/common/dtos/inactivate-member.dto';

import { createMinistryMember } from '@/common/helpers/create-ministry-member';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Member } from '@/modules/member/entities/member.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { MinistryMember } from '@/modules/ministry/entities/ministry-member.entity';

@Injectable()
export class PastorService extends BaseService {
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

    private readonly searchStrategyFactory: SearchStrategyFactory,
  ) {
    super();
  }

  //* Create
  async create(body: CreatePastorDto, user: User): Promise<Pastor> {
    try {
      const { church } = await this.validatePastorCreation(body);

      const memberData = this.buildMemberData(body);
      const newMember = this.memberRepository.create(memberData);
      await this.memberRepository.save(newMember);

      const pastorData = this.buildCreateEntityData({
        user,
        extraProps: {
          ...body,
          theirChurch: church,
          relationType: body.relationType ?? null,
        },
        member: {
          ...newMember,
          conversionDate: body.conversionDate ?? null,
          email: body.email ?? null,
          phoneNumber: body.phoneNumber ?? null,
        },
      });

      const newPastor = this.pastorRepository.create(pastorData);

      if (body.theirMinistries?.length > 0) {
        await createMinistryMember({
          theirMinistries: body.theirMinistries,
          ministryRepository: this.ministryRepository,
          ministryMemberRepository: this.ministryMemberRepository,
          newMember,
          user,
        });
      }

      return await this.pastorRepository.save(newPastor);
    } catch (error) {
      this.handleDBExceptions(error, {
        email: 'El correo electrónico ya está en uso.',
        pastor: 'El registro del pastor no pudo completarse.',
      });
    }
  }

  //* Find all
  async findAll(query: PastorPaginationDto): Promise<Pastor[]> {
    const { limit, offset = 0, order = 'ASC', isSimpleQuery, churchId } = query;

    try {
      if (isSimpleQuery) {
        return await this.findBasicQuery<Pastor>({
          order: order as FindOptionsOrderValue,
          churchId: churchId,
          churchRepository: this.churchRepository,
          mainRepository: this.pastorRepository,
          relations: ['member', 'theirChurch'],
        });
      }

      return await this.findDetailedQuery<Pastor>({
        limit,
        offset,
        order: order as FindOptionsOrderValue,
        churchId,
        mainRepository: this.pastorRepository,
        relations: [
          'updatedBy',
          'createdBy',
          'member',
          'member.ministries',
          'member.ministries.ministry',
          'member.ministries.ministry.theirChurch',
          'theirChurch',
          'familyGroups',
          'ministries',
          'zones',
          'copastors.member',
          'supervisors.member',
          'preachers.member',
          'disciples.member',
        ],
        moduleKey: 'pastors',
        formatterData: pastorDataFormatter,
        relationLoadStrategy: 'query',
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find by filters
  async findByFilters(query: PastorSearchAndPaginationDto): Promise<Pastor[]> {
    const { term, searchType, churchId } = query;

    if (!term) throw new BadRequestException('El término es requerido');
    if (!searchType)
      throw new BadRequestException('El tipo de búsqueda es requerido');

    try {
      const church = await this.findOrFail<Church>({
        repository: this.churchRepository,
        where: { id: churchId },
        moduleName: 'iglesia',
      });

      console.log(searchType);

      const searchStrategy = this.searchStrategyFactory.getStrategy(
        searchType as any,
      );

      return await searchStrategy.execute<Pastor>({
        params: query,
        church,
        relations: [
          'member',
          'member.ministries',
          'member.ministries.ministry',
          'member.ministries.ministry.theirChurch',
          'updatedBy',
          'createdBy',
          'theirChurch',
          'zones',
          'familyGroups',
          'copastors.member',
          'supervisors.member',
          'preachers.member',
          'disciples.member',
        ],
        mainRepository: this.pastorRepository,
        moduleKey: 'pastors',
        moduleName: 'pastores(as)',
        formatterData: pastorDataFormatter,
        relationLoadStrategy: 'query',
        personRepository: null,
        computedKey: '',
        personName: '',
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Update
  async update(id: string, body: UpdatePastorDto, user: User): Promise<Pastor> {
    await this.validateId(id);

    const pastor = await this.findOrFail<Pastor>({
      repository: this.pastorRepository,
      where: { id },
      relations: [
        'theirChurch',
        'member',
        'member.ministries',
        'member.ministries.ministry',
        'member.ministries.ministry.theirChurch',
      ],
      moduleName: 'pastor',
    });

    this.validateRequiredRoles(body.roles as MemberRole[], [MemberRole.Pastor]);

    this.validateRoleHierarchy({
      memberRoles: pastor.member.roles as MemberRole[],
      rolesToAssign: body.roles as MemberRole[],
      config: {
        mainRole: MemberRole.Pastor,
        forbiddenRoles: [
          MemberRole.Copastor,
          MemberRole.Supervisor,
          MemberRole.Preacher,
          MemberRole.Treasurer,
          MemberRole.Disciple,
        ],
        breakStrictRoles: [],
        hierarchyOrder: [
          MemberRole.Disciple,
          MemberRole.Preacher,
          MemberRole.Supervisor,
          MemberRole.Copastor,
          MemberRole.Pastor,
        ],
      },
    });

    this.validateRecordStatusUpdate(pastor, body.recordStatus as RecordStatus);

    const { church, mustUpdateMember } = await this.resolveChurchRelation(
      pastor,
      body,
    );

    const savedMember = await this.updateEntityMember({
      entity: pastor,
      dto: body,
      mustUpdateMember,
      memberRepository: this.memberRepository,
    });

    const payload = this.buildUpdateEntityData({
      entityId: pastor.id,
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

    const updatedPastor = await this.pastorRepository.preload(payload);

    await this.updateMinistriesIfNeeded({
      entity: pastor,
      theirMinistries: body.theirMinistries,
      savedMember,
      user,
      ministryRepository: this.ministryRepository,
      ministryMemberRepository: this.ministryMemberRepository,
    });

    await this.updateSubordinateRelationsIfChurchChanged(pastor, church, user);

    return await this.pastorRepository.save(updatedPastor);
  }

  //* Delete
  async remove(
    id: string,
    dto: InactivateMemberDto,
    user: User,
  ): Promise<void> {
    await this.validateId(id);

    const pastor = await this.findOrFail<Pastor>({
      repository: this.pastorRepository,
      where: { id },
      relations: [],
      moduleName: 'pastor',
    });

    await this.inactivateEntity({
      entity: pastor,
      user,
      entityRepository: this.pastorRepository,
      extraProps: {
        inactivationCategory: dto.memberInactivationCategory,
        inactivationReason: dto.memberInactivationReason,
        recordStatus: RecordStatus.Inactive,
      },
    });

    await this.cleanSubordinateRelations(pastor, user, [
      { repo: this.ministryRepository, relation: 'theirPastor' },
      { repo: this.copastorRepository, relation: 'theirPastor' },
      { repo: this.supervisorRepository, relation: 'theirPastor' },
      { repo: this.zoneRepository, relation: 'theirPastor' },
      { repo: this.preacherRepository, relation: 'theirPastor' },
      { repo: this.familyGroupRepository, relation: 'theirPastor' },
      { repo: this.discipleRepository, relation: 'theirPastor' },
    ]);
  }

  // ---------------------------------------------------------------------------------------------- //

  //? Private methods
  //* Validations
  private async validatePastorCreation(
    dto: CreatePastorDto,
  ): Promise<{ church: Church }> {
    const { roles, theirChurch } = dto;

    if (!roles.includes(MemberRole.Pastor)) {
      throw new BadRequestException(`El rol "Pastor" debe ser incluido.`);
    }

    const invalidRoles = [
      MemberRole.Copastor,
      MemberRole.Supervisor,
      MemberRole.Preacher,
      MemberRole.Treasurer,
      MemberRole.Disciple,
    ];

    if (roles.some((r: any) => invalidRoles.includes(r))) {
      throw new BadRequestException(
        `Para crear un Pastor, solo se requiere el rol: "Pastor".`,
      );
    }

    if (!theirChurch) {
      throw new NotFoundException(
        `Para crear un Pastor, se debe asignarle una Iglesia.`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: theirChurch },
    });

    if (!church) {
      throw new NotFoundException(
        `No se encontró Iglesia con id: ${theirChurch}.`,
      );
    }

    if (church.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
      );
    }

    return { church };
  }

  //* Finders and actions
  private async resolveChurchRelation(
    pastor: Pastor,
    dto: UpdatePastorDto,
  ): Promise<{ church: Church; mustUpdateMember: boolean }> {
    if (pastor.theirChurch?.id === dto.theirChurch) {
      return { church: pastor.theirChurch, mustUpdateMember: true };
    }

    if (!dto.theirChurch) {
      throw new NotFoundException(
        `Para actualizar un Pastor se debe asignar una Iglesia.`,
      );
    }

    const newChurch = await this.churchRepository.findOne({
      where: { id: dto.theirChurch },
    });

    if (!newChurch)
      throw new NotFoundException(
        `Iglesia con id ${dto.theirChurch} no fue encontrada.`,
      );

    if (newChurch.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
      );
    }

    return { church: newChurch, mustUpdateMember: true };
  }

  private async updateSubordinateRelationsIfChurchChanged(
    pastor: Pastor,
    church: Church,
    user: User,
  ): Promise<void> {
    if (pastor.theirChurch?.id === church.id) return;

    const repositories = [
      this.copastorRepository,
      this.supervisorRepository,
      this.zoneRepository,
      this.preacherRepository,
      this.familyGroupRepository,
      this.discipleRepository,
    ];

    await Promise.all(
      repositories.map(async (repo: any) => {
        const items = await repo.find({
          relations: ['theirPastor'],
        });

        const filtered = items.filter(
          (i: any) => i?.theirPastor?.id === pastor.id,
        );

        await Promise.all(
          filtered.map(async (item: any) => {
            await repo.update(item.id, {
              theirChurch: church,
              updatedAt: new Date(),
              updatedBy: user,
            });
          }),
        );
      }),
    );
  }
}
