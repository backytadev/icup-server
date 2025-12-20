import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
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
import { updateMinistryMember } from '@/common/helpers/update-ministry-member';
import { validationExistsChangesMinistryMember } from '@/common/helpers/validation-exists-changes-ministry-member';

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

  //* Create pastor
  async create(createPastorDto: CreatePastorDto, user: User): Promise<Pastor> {
    try {
      const { church } = await this.validatePastorCreation(createPastorDto);

      const memberData = this.buildMemberData(createPastorDto);
      const newMember = this.memberRepository.create(memberData);
      await this.memberRepository.save(newMember);

      const pastorData = this.buildCreatePastorData(
        createPastorDto,
        user,
        church,
        newMember,
      );
      const newPastor = this.pastorRepository.create(pastorData);

      if (createPastorDto.theirMinistries?.length > 0) {
        await createMinistryMember({
          theirMinistries: createPastorDto.theirMinistries,
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
    if (!searchType) throw new BadRequestException('searchType es requerido');

    try {
      const church = await this.findOrFail<Church>({
        repository: this.churchRepository,
        where: { id: churchId },
        moduleName: 'iglesia',
      });

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
  async update(
    id: string,
    updateDto: UpdatePastorDto,
    user: User,
  ): Promise<Pastor> {
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

    this.validateRequiredRoles(updateDto.roles as MemberRole[]);
    this.validateRoleHierarchy(pastor, updateDto.roles as MemberRole[]);
    this.validateRecordStatusUpdate(
      pastor,
      updateDto.recordStatus as RecordStatus,
    );

    const { church, memberToUpdate } = await this.resolveChurchRelation(
      pastor,
      updateDto,
    );

    const savedMember = await this.updatePastorMember(
      pastor,
      memberToUpdate,
      updateDto,
    );

    const payload = this.buildUpdatePastorPayload(
      pastor,
      updateDto,
      user,
      savedMember,
      church,
    );

    const updatedPastor = await this.pastorRepository.preload(payload);

    await this.updatePastorMinistriesIfNeeded(
      pastor,
      updateDto.theirMinistries,
      savedMember,
      user,
    );

    await this.updateSubordinateRelationsIfChurchChanged(pastor, church, user);

    return await this.pastorRepository.save(updatedPastor);
  }

  async remove(
    id: string,
    inactivateMemberDto: InactivateMemberDto,
    user: User,
  ): Promise<void> {
    const pastor = await this.validatePastorToRemove(id);

    await this.inactivatePastor(pastor, inactivateMemberDto, user);

    await this.cleanSubordinateRelations(pastor, user);
  }

  // ---------------------------------------------------------------------------------------------- //

  //? Private methods
  //* Validations
  private validateRequiredRoles(roles: MemberRole[]): void {
    if (!roles)
      throw new BadRequestException(
        `Los roles son requeridos para actualizar el Pastor.`,
      );

    if (!roles.some((role) => ['disciple', 'pastor'].includes(role))) {
      throw new BadRequestException(
        `Los roles deben incluir "discípulo" y "pastor".`,
      );
    }
  }

  private validateRoleHierarchy(pastor: Pastor, roles: MemberRole[]): void {
    const forbiddenIfPastor = [
      MemberRole.Copastor,
      MemberRole.Supervisor,
      MemberRole.Preacher,
      MemberRole.Treasurer,
      MemberRole.Disciple,
    ];

    const isStrictPastor =
      pastor.member.roles.includes(MemberRole.Pastor) &&
      !pastor.member.roles.some((r: any) => forbiddenIfPastor.includes(r));

    if (isStrictPastor && roles.some((r) => forbiddenIfPastor.includes(r))) {
      throw new BadRequestException(
        `No se puede asignar un rol inferior sin pasar por la jerarquía: [discípulo, predicador, supervisor, copastor, pastor]`,
      );
    }
  }

  private validateRecordStatusUpdate(
    pastor: Pastor,
    newStatus: RecordStatus,
  ): void {
    if (
      pastor.recordStatus === RecordStatus.Active &&
      newStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
      );
    }
  }

  private async validatePastorToRemove(id: string): Promise<Pastor> {
    if (!isUUID(id)) {
      throw new BadRequestException('UUID no valido.');
    }

    const pastor = await this.pastorRepository.findOneBy({ id });

    if (!pastor) {
      throw new NotFoundException(`Pastor con id: ${id} no fue encontrado.`);
    }

    return pastor;
  }

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
  ): Promise<{ church: Church; memberToUpdate: boolean }> {
    if (pastor.theirChurch?.id === dto.theirChurch) {
      return { church: pastor.theirChurch, memberToUpdate: true };
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

    return { church: newChurch, memberToUpdate: true };
  }

  private async updatePastorMember(
    pastor: Pastor,
    updateMember: boolean,
    dto: UpdatePastorDto,
  ): Promise<Member> {
    if (!updateMember) return pastor.member;

    const updatedMember = await this.memberRepository.preload({
      id: pastor.member.id,
      ...dto,
      numberChildren: +dto.numberChildren,
      conversionDate: dto.conversionDate ?? null,
      email: dto.email ?? null,
      phoneNumber: dto.phoneNumber ?? null,
    });

    return await this.memberRepository.save(updatedMember);
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

  private async updatePastorMinistriesIfNeeded(
    pastor: Pastor,
    theirMinistries: any[],
    savedMember: Member,
    user: User,
  ) {
    const hasChanges = validationExistsChangesMinistryMember({
      memberEntity: pastor,
      theirMinistries,
    });

    if (!hasChanges) return;

    await updateMinistryMember({
      theirMinistries,
      ministryRepository: this.ministryRepository,
      ministryMemberRepository: this.ministryMemberRepository,
      savedMember,
      user,
    });
  }

  private async inactivatePastor(
    pastor: Pastor,
    dto: InactivateMemberDto,
    user: User,
  ): Promise<void> {
    const { memberInactivationCategory, memberInactivationReason } = dto;

    try {
      const updatedPastor = await this.pastorRepository.preload({
        id: pastor.id,
        updatedAt: new Date(),
        updatedBy: user,
        inactivationCategory: memberInactivationCategory,
        inactivationReason: memberInactivationReason,
        recordStatus: RecordStatus.Inactive,
      });

      await this.pastorRepository.save(updatedPastor);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private async cleanSubordinateRelations(
    pastor: Pastor,
    user: User,
  ): Promise<void> {
    const repositories = [
      this.ministryRepository,
      this.copastorRepository,
      this.supervisorRepository,
      this.zoneRepository,
      this.preacherRepository,
      this.familyGroupRepository,
      this.discipleRepository,
    ];

    try {
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
                theirPastor: null,
                updatedAt: new Date(),
                updatedBy: user,
              });
            }),
          );
        }),
      );
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Builders
  private buildMemberData(dto: CreatePastorDto): Partial<Member> {
    return {
      firstNames: dto.firstNames,
      lastNames: dto.lastNames,
      gender: dto.gender,
      originCountry: dto.originCountry,
      birthDate: dto.birthDate,
      maritalStatus: dto.maritalStatus,
      numberChildren: +dto.numberChildren,
      conversionDate: dto.conversionDate ?? null,
      email: dto.email ?? null,
      phoneNumber: dto.phoneNumber ?? null,
      residenceCountry: dto.residenceCountry,
      residenceDepartment: dto.residenceDepartment,
      residenceProvince: dto.residenceProvince,
      residenceDistrict: dto.residenceDistrict,
      residenceUrbanSector: dto.residenceUrbanSector,
      residenceAddress: dto.residenceAddress,
      referenceAddress: dto.referenceAddress,
      roles: dto.roles,
    };
  }

  private buildCreatePastorData(
    dto: CreatePastorDto,
    user: User,
    church: Church,
    member: Member,
  ): Partial<Pastor> {
    return {
      member,
      theirChurch: church,
      relationType: dto.relationType ?? null,
      createdAt: new Date(),
      createdBy: user,
    };
  }

  private buildUpdatePastorPayload(
    pastor: Pastor,
    dto: UpdatePastorDto,
    user: User,
    savedMember: Member,
    church: Church,
  ): Partial<Pastor> {
    return {
      id: pastor.id,
      member: savedMember,
      theirChurch: church,
      relationType: dto.relationType ?? null,
      updatedAt: new Date(),
      updatedBy: user,
      inactivationCategory:
        dto.recordStatus === RecordStatus.Active
          ? null
          : dto.memberInactivationCategory,
      inactivationReason:
        dto.recordStatus === RecordStatus.Active
          ? null
          : dto.memberInactivationReason,
      recordStatus: dto.recordStatus,
    };
  }
}
