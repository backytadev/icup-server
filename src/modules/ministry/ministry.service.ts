import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrderValue, Repository } from 'typeorm';

import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { CreateMinistryDto } from '@/modules/ministry/dto/create-ministry.dto';
import { UpdateMinistryDto } from '@/modules/ministry/dto/update-ministry.dto';
import { InactivateMinistryDto } from '@/modules/ministry/dto/inactivate-ministry.dto';

import {
  MinistryType,
  MinistryTypeNames,
} from '@/modules/ministry/enums/ministry-type.enum';
import { generateCodeMinistry } from '@/modules/ministry/helpers/generate-code-ministry';
import { ministryDataFormatter } from '@/modules/ministry/helpers/ministry-data-formatter.helper';
import { MinistrySearchAndPaginationDto } from '@/modules/ministry/dto/ministry-search-and-pagination.dto';

import { User } from '@/modules/user/entities/user.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';

import { BaseService } from '@/common/services/base.service';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { SearchStrategyFactory } from '@/common/strategies/search/search-strategy.factory';

import { MinistryPaginationDto } from '@/modules/ministry/dto/ministry-pagination.dto';
import { MinistrySearchSubType } from '@/modules/ministry/enums/ministry-search-sub-type.enum';

@Injectable()
export class MinistryService extends BaseService {
  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(Ministry)
    private readonly ministryRepository: Repository<Ministry>,

    @InjectRepository(Pastor)
    private readonly pastorRepository: Repository<Pastor>,

    private readonly searchStrategyFactory: SearchStrategyFactory,
  ) {
    super();
  }

  //* Create
  async create(body: CreateMinistryDto, user: User): Promise<Ministry> {
    try {
      const { pastor, church } = await this.validateMinistryCreation(body);

      const data = this.buildCreateMinistryData(body, user, pastor, church);

      const newMinistry = this.ministryRepository.create(data);

      return await this.ministryRepository.save(newMinistry);
    } catch (error) {
      this.handleDBExceptions(error, {
        email: 'El correo electrónico ya está en uso.',
        ministry: 'El nombre del ministerio ya está en uso.',
      });
    }
  }

  //* Find all
  async findAll(query: MinistryPaginationDto): Promise<Ministry[]> {
    const { limit, offset = 0, order = 'ASC', isSimpleQuery, churchId } = query;

    try {
      if (isSimpleQuery) {
        return await this.findBasicQuery<Ministry>({
          order: order as FindOptionsOrderValue,
          churchId: churchId,
          churchRepository: this.churchRepository,
          mainRepository: this.ministryRepository,
          relations: [],
        });
      }

      return await this.findDetailedQuery<Ministry>({
        limit,
        offset,
        order: order as FindOptionsOrderValue,
        churchId,
        mainRepository: this.ministryRepository,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor.member',
          'members',
          'members.member',
          'members.ministry',
        ],
        moduleKey: 'ministries',
        formatterData: ministryDataFormatter,
        relationLoadStrategy: 'query',
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find by filters
  async findByFilters(
    query: MinistrySearchAndPaginationDto,
  ): Promise<Ministry[]> {
    const { term, searchType, searchSubType, churchId } = query;

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

      const personContext = this.resolvePersonContext(searchSubType);

      return await searchStrategy.execute<Ministry>({
        params: query,
        church,
        relations: [
          'updatedBy',
          'createdBy',
          'theirChurch',
          'theirPastor.member',
          'members',
          'members.member',
          'members.ministry',
        ],
        mainRepository: this.ministryRepository,
        moduleKey: 'ministries',
        moduleName: 'ministerios',
        formatterData: ministryDataFormatter,
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
    body: UpdateMinistryDto,
    user: User,
  ): Promise<Ministry> {
    await this.validateId(id);

    const ministry = await this.findOrFail<Ministry>({
      repository: this.ministryRepository,
      where: { id },
      relations: ['theirPastor.member', 'theirChurch', 'members.member'],
      moduleName: 'ministerio',
    });

    await this.validateMinistryUpdate(ministry, body);
    const newRelations = await this.resolveRelations(ministry, body);

    try {
      const payload = this.buildUpdateData(ministry, body, user, newRelations);

      const updatedMinistry = await this.ministryRepository.preload(payload);
      return await this.ministryRepository.save(updatedMinistry);
    } catch (error) {
      this.handleDBExceptions(error, {
        ministry: 'El nombre del ministerio ya está en uso.',
      });
    }
  }

  //* Delete
  async remove(id: string, query: InactivateMinistryDto, user: User) {
    await this.validateId(id);

    console.log(id);

    const ministry = await this.findOrFail<Ministry>({
      repository: this.ministryRepository,
      where: { id },
      relations: ['theirPastor.member', 'theirChurch', 'members.member'],
      moduleName: 'ministerio',
    });

    await this.inactivateMinistry(ministry, query, user);
  }

  // ---------------------------------------------------------------------------------------------- //

  //? Private methods
  //* Validations
  private async validateMinistryCreation(
    dto: CreateMinistryDto,
  ): Promise<{ pastor: Pastor; church: Church }> {
    const { theirPastor, ministryType } = dto;

    if (!theirPastor) {
      throw new NotFoundException(
        `Para crear un Ministerio, debes asignarle un Pastor.`,
      );
    }

    const pastor = await this.pastorRepository.findOne({
      where: { id: theirPastor },
      relations: ['theirChurch', 'member'],
    });

    if (!pastor) {
      throw new NotFoundException(
        `No se encontró Pastor con el id: ${theirPastor}.`,
      );
    }

    if (pastor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
      );
    }

    if (!pastor.theirChurch) {
      throw new NotFoundException(
        `No se encontró la Iglesia, verifique que el Pastor tenga una Iglesia asignada.`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: pastor.theirChurch.id },
    });

    if (!church) {
      throw new NotFoundException(
        `No se encontró la Iglesia asignada al Pastor.`,
      );
    }

    if (church.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
      );
    }

    const existMinistry = await this.ministryRepository.findOne({
      where: {
        ministryType,
        theirPastor: { id: pastor.id },
        theirChurch: { id: church.id },
      },
    });

    if (existMinistry) {
      throw new BadRequestException(
        `El ministerio ya existe con los siguientes datos: Tipo: ${
          MinistryTypeNames[ministryType as MinistryType]
        }, Pastor: ${pastor.member.firstNames} ${
          pastor.member.lastNames
        }, Iglesia: ${church.abbreviatedChurchName}.`,
      );
    }

    return { pastor, church };
  }

  private async validateMinistryUpdate(
    ministry: Ministry,
    updateDto: UpdateMinistryDto,
  ): Promise<void> {
    const { recordStatus } = updateDto;

    if (
      ministry.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar el registro a "Inactivo", se debe eliminar.`,
      );
    }
  }

  //* Finders and actions
  private resolvePersonContext(searchSubType?: MinistrySearchSubType) {
    if (!searchSubType) return {};

    switch (searchSubType) {
      case MinistrySearchSubType.MinistryByPastorFirstNames:
      case MinistrySearchSubType.MinistryByPastorLastNames:
      case MinistrySearchSubType.MinistryByPastorFullNames:
        return {
          personRepository: this.pastorRepository,
          computedKey: 'theirPastor',
          personName: 'pastor',
        };

      default:
        throw new BadRequestException('Subtipo de búsqueda no válido');
    }
  }

  private async inactivateMinistry(
    ministry: Ministry,
    dto: InactivateMinistryDto,
    user: User,
  ): Promise<void> {
    try {
      const updatedMinistry = await this.ministryRepository.preload({
        id: ministry.id,
        updatedAt: new Date(),
        updatedBy: user,
        inactivationCategory: dto.ministryInactivationCategory,
        inactivationReason: dto.ministryInactivationReason,
        theirPastor: null,
        theirChurch: null,
        recordStatus: RecordStatus.Inactive,
      });

      await this.ministryRepository.save(updatedMinistry);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private async resolveRelations(
    ministry: Ministry,
    updateDto: UpdateMinistryDto,
  ): Promise<{ pastor: Pastor; church: Church }> {
    const { theirPastor, ministryType } = updateDto;

    if (ministry.theirPastor?.id === theirPastor) {
      return {
        pastor: ministry.theirPastor,
        church: ministry.theirChurch,
      };
    }

    if (!theirPastor) {
      throw new BadRequestException(
        `Para actualizar un Ministerio, se debe asignar un Pastor.`,
      );
    }

    const newPastor = await this.pastorRepository.findOne({
      where: { id: theirPastor },
      relations: ['theirChurch', 'member'],
    });

    if (!newPastor) {
      throw new NotFoundException(
        `Pastor con el id: ${theirPastor}, no fue encontrado.`,
      );
    }

    if (newPastor.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Pastor debe ser "Activo".`,
      );
    }

    if (!newPastor.theirChurch) {
      throw new BadRequestException(
        `No se encontró la Iglesia, verifique que el Pastor tenga una Iglesia asignada.`,
      );
    }

    const church = await this.churchRepository.findOne({
      where: { id: newPastor.theirChurch.id },
    });

    if (church.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(
        `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
      );
    }

    const ministryExists = await this.ministryRepository.findOne({
      where: {
        theirPastor: { id: newPastor.id },
        ministryType,
      },
    });

    if (ministryExists) {
      throw new ConflictException(
        `El pastor "${newPastor.member.firstNames} ${newPastor.member.lastNames}" ya está asignado a un ministerio de tipo "${
          MinistryTypeNames[ministryType as MinistryType]
        }".`,
      );
    }

    return { pastor: newPastor, church };
  }

  //* Builders
  private buildCreateMinistryData(
    dto: CreateMinistryDto,
    user: User,
    pastor: Pastor,
    church: Church,
  ): Partial<Ministry> {
    const { customMinistryName } = dto;

    return {
      ...dto,
      email: dto.email ?? null,
      phoneNumber: dto.phoneNumber ?? null,
      ministryCode: generateCodeMinistry(customMinistryName),
      theirChurch: church,
      theirPastor: pastor,
      createdAt: new Date(),
      createdBy: user,
    };
  }

  private buildUpdateData(
    ministry: Ministry,
    updateDto: UpdateMinistryDto,
    user: User,
    relations: { pastor: Pastor; church: Church },
  ): Partial<Ministry> {
    const {
      recordStatus,
      ministryInactivationCategory,
      ministryInactivationReason,
      customMinistryName,
    } = updateDto;

    return {
      id: ministry.id,
      ...updateDto,
      ministryCode:
        customMinistryName !== ministry.customMinistryName
          ? generateCodeMinistry(customMinistryName)
          : ministry.ministryCode,
      theirPastor: relations.pastor,
      theirChurch: relations.church,
      updatedAt: new Date(),
      updatedBy: user,
      inactivationCategory:
        recordStatus === RecordStatus.Active
          ? null
          : ministryInactivationCategory,
      inactivationReason:
        recordStatus === RecordStatus.Active
          ? null
          : ministryInactivationReason,
      recordStatus,
    };
  }
}
