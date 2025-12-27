import {
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { isUUID } from 'class-validator';

import {
  FindSimpleQueryProps,
  FindDetailedQueryProps,
} from '@/common/interfaces/find-query-props.interface';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { MemberRole, MemberRoleNames } from '@/common/enums/member-role.enum';

import { updateMinistryMember } from '@/common/helpers/update-ministry-member';
import { validationExistsChangesMinistryMember } from '@/common/helpers/validation-exists-changes-ministry-member';

import { InactivateEntity } from '@/common/interfaces/inactivate-entity.interface';
import { FindOrFailProps } from '@/common/interfaces/find-or-fail-props.interface';
import { UpdateEntityMember } from '@/common/interfaces/update-entity-member.interface';
import { ValidateRoleHierarchy } from '@/common/interfaces/role-hierarchy-config.interface';
import { BuildCreateEntityData } from '@/common/interfaces/build-create-entity-data.interface';
import { UpdateMinistriesMember } from '@/common/interfaces/build-update-entity-data.interface';
import { UpdateMinistriesIfNeeded } from '@/common/interfaces/update-ministries-if-needed.interface';

import { User } from '@/modules/user/entities/user.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Member } from '@/modules/member/entities/member.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';

export class BaseService {
  protected readonly logger = new Logger(this.constructor.name);

  //* Validations
  protected async validateId(
    id: string,
    message = 'UUID inválido',
  ): Promise<void> {
    if (!isUUID(id)) {
      throw new BadRequestException(message);
    }
  }

  protected validateResult<T>(
    items: T[],
    message = 'No existen registros disponibles para mostrar.',
  ): T[] {
    if (!items || items.length === 0) {
      throw new NotFoundException(message);
    }
    return items;
  }

  protected async validateChurch(
    churchId: string,
    churchRepository: Repository<Church>,
  ): Promise<Church | null> {
    if (!churchId) {
      throw new BadRequestException(
        `El identificador de la iglesia es obligatorio para realizar esta operación.`,
      );
    }

    const church = await churchRepository.findOne({
      where: { id: churchId, recordStatus: RecordStatus.Active },
    });

    if (!church) {
      throw new NotFoundException(
        `Iglesia con id ${churchId} no fue encontrada.`,
      );
    }

    return church;
  }

  protected validateRecordStatusUpdate(
    entity: Pastor | Copastor | Church | Ministry,
    newStatus: RecordStatus,
  ): void {
    if (
      entity.recordStatus === RecordStatus.Active &&
      newStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
      );
    }
  }

  protected validateRequiredRoles(
    roles: MemberRole[],
    allowedRoles: MemberRole[],
  ): void {
    if (!roles)
      throw new BadRequestException(
        `Los roles son requeridos para actualizar un Co-Pastor.`,
      );

    if (!roles.some((role) => [...allowedRoles].includes(role))) {
      throw new BadRequestException(
        `Los roles deben incluir ${allowedRoles.map((role) => MemberRoleNames[role as MemberRole]).join(', ')}.`,
      );
    }
  }

  protected validateRoleHierarchy({
    memberRoles,
    rolesToAssign,
    config,
  }: ValidateRoleHierarchy): void {
    const {
      mainRole,
      forbiddenRoles,
      breakStrictRoles = [],
      hierarchyOrder,
    } = config;

    const isStrict =
      memberRoles.includes(mainRole) &&
      !memberRoles.some((r) => forbiddenRoles.includes(r)) &&
      !memberRoles.some((r) => breakStrictRoles.includes(r));

    if (isStrict && rolesToAssign.some((r) => forbiddenRoles.includes(r))) {
      throw new BadRequestException(this.buildHierarchyMessage(hierarchyOrder));
    }
  }

  //* Finders
  protected async findOrFail<T>({
    repository,
    where,
    relations = [],
    select = [],
    moduleName = '',
  }: FindOrFailProps<T>): Promise<T> {
    const [field, value] = Object.entries(where)[0];

    const data = await repository.findOne({
      where,
      relations,
      ...(select && { select }),
    });

    if (!data) {
      throw new NotFoundException(
        `No se encontró ningún ${moduleName} con ${field}: ${value}`,
      );
    }

    return data;
  }

  protected async findBasicQuery<T>({
    mainRepository,
    churchRepository,
    churchId,
    relations,
    order,
  }: FindSimpleQueryProps<T>): Promise<T[]> {
    let church: Church | null = null;
    if (churchId && churchRepository) {
      church = await this.validateChurch(churchId, churchRepository);
    }

    const data = await mainRepository.find({
      where: {
        recordStatus: RecordStatus.Active,
        ...(church && { theirChurch: church }),
      } as any,
      order: { createdAt: order } as any,
      relations,
    });

    return this.validateResult(data);
  }

  protected async findDetailedQuery<T>({
    mainRepository,
    churchRepository,
    churchId,
    relations,
    limit,
    offset,
    order,
    moduleKey,
    formatterData,
    relationLoadStrategy = 'join',
  }: FindDetailedQueryProps<T>): Promise<T[]> {
    let church: Church | null = null;
    if (churchId && churchRepository) {
      church = await this.validateChurch(churchId, churchRepository);
    }

    const data = await mainRepository.find({
      where: {
        recordStatus: RecordStatus.Active,
        ...(church && { theirChurch: church }),
      } as any,
      take: limit,
      skip: offset,
      relations,
      relationLoadStrategy,
      order: { createdAt: order } as any,
    });

    this.validateResult(data);

    let mainChurch: T | null = null;
    if (moduleKey === 'churches') {
      mainChurch = await mainRepository.findOne({
        where: { isAnexe: false, recordStatus: RecordStatus.Active } as any,
      });
    }

    return formatterData({
      [moduleKey]: data,
      ...(mainChurch && { mainChurch }),
    });
  }

  //* Cleaners and Updaters
  protected async cleanSubordinateRelations(
    entity: Church | Pastor | Copastor,
    user: User,
    relationGroups: { repo: Repository<any>; relation: string }[],
  ): Promise<void> {
    try {
      await Promise.all(
        relationGroups.map(async ({ repo, relation }) => {
          const related = await repo.find({ relations: [relation] });

          const filtered = related.filter(
            (item: any) => item?.[relation]?.id === entity.id,
          );

          await Promise.all(
            filtered.map(async (item: any) => {
              await repo.update(item.id, {
                [relation]: null,
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

  protected async updateMinistriesIfNeeded({
    entity,
    theirMinistries,
    savedMember,
    user,
    ministryRepository,
    ministryMemberRepository,
  }: UpdateMinistriesIfNeeded) {
    const hasChanges = validationExistsChangesMinistryMember({
      memberEntity: entity,
      theirMinistries,
    });

    if (!hasChanges) return;

    await updateMinistryMember({
      theirMinistries,
      ministryRepository: ministryRepository,
      ministryMemberRepository: ministryMemberRepository,
      savedMember,
      user,
    });
  }

  protected async updateEntityMember({
    entity,
    mustUpdateMember,
    dto,
    memberRepository,
  }: UpdateEntityMember): Promise<Member> {
    if (!mustUpdateMember) return entity.member;

    const updatedMember = await memberRepository.preload({
      id: entity.member.id,
      ...dto,
      numberChildren: +dto.numberChildren,
      conversionDate: dto.conversionDate ?? null,
      email: dto.email ?? null,
      phoneNumber: dto.phoneNumber ?? null,
    });

    return await memberRepository.save(updatedMember);
  }

  protected async inactivateEntity({
    entity,
    user,
    entityRepository,
    extraProps,
  }: InactivateEntity): Promise<void> {
    try {
      const updated = await entityRepository.preload({
        id: entity.id,
        updatedAt: new Date(),
        updatedBy: user,
        ...extraProps,
      });

      await entityRepository.save(updated);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.handleDBExceptions(error);
    }
  }

  //* Builders
  protected buildMemberData(dto: any): Partial<Member> {
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

  protected buildCreateEntityData({
    user,
    extraProps,
    member,
  }: BuildCreateEntityData): Partial<any> {
    return {
      ...(member && { member: member }),
      createdAt: new Date(),
      createdBy: user,
      ...extraProps,
    };
  }

  protected buildUpdateEntityData({
    entityId,
    user,
    savedMember,
    extraProps,
  }: UpdateMinistriesMember): Partial<any> {
    return {
      id: entityId,
      ...(savedMember && { member: savedMember }),
      updatedAt: new Date(),
      updatedBy: user,
      ...extraProps,
    };
  }

  //* Handlers
  protected handleDBExceptions(
    error: any,
    customMessages?: Record<string, string>,
  ): never {
    if (error?.code === '23505') {
      const detail: string = error.detail ?? '';

      if (customMessages) {
        for (const key of Object.keys(customMessages)) {
          if (detail.includes(key)) {
            throw new BadRequestException(customMessages[key]);
          }
        }
      }

      throw new BadRequestException('Ya existe un registro con ese valor.');
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      error.response.message ??
        'Sucedió un error inesperado, hable con el administrador.',
    );
  }

  // Privates
  private buildHierarchyMessage(hierarchy: MemberRole[]): string {
    return `No se puede asignar un rol inferior sin pasar por la jerarquía: [${hierarchy
      .map((h) => MemberRoleNames[h as MemberRole])
      .join(', ')}]`;
  }
}
