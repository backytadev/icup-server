import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrderValue, Repository } from 'typeorm';

import { Church } from '@/modules/church/entities/church.entity';

import { generateCodeChurch } from '@/modules/church/helpers/generate-code-church';
import { churchDataFormatter } from '@/modules/church/helpers/church-data-formatter.helper';

import { CreateChurchDto } from '@/modules/church/dto/create-church.dto';
import { UpdateChurchDto } from '@/modules/church/dto/update-church.dto';
import { InactivateChurchDto } from '@/modules/church/dto/inactivate-church.dto';

import { BaseService } from '@/common/services/base.service';
import { RecordStatus } from '@/common/enums/record-status.enum';

import { SearchStrategyFactory } from '@/common/strategies/search/search-strategy.factory';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { ChurchSearchAndPaginationDto } from '@/modules/church/dto/church-search-and-pagination.dto';

import { User } from '@/modules/user/entities/user.entity';
import { Zone } from '@/modules/zone/entities/zone.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';

@Injectable()
export class ChurchService extends BaseService {
  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

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

    private readonly searchStrategyFactory: SearchStrategyFactory,
  ) {
    super();
  }

  //* Create
  async create(body: CreateChurchDto, user: User): Promise<Church> {
    try {
      const mainChurch = await this.validateChurchCreation(body);
      const data = this.buildCreateData(body, user, mainChurch);
      const newChurch = this.churchRepository.create(data);

      return await this.churchRepository.save(newChurch);
    } catch (error) {
      this.handleDBExceptions(error, {
        email: 'El correo electrónico ya está en uso.',
        church: 'El nombre de iglesia ya está en uso.',
      });
    }
  }

  //* Find main church
  async findMainChurch(query: PaginationDto): Promise<Church[]> {
    const { limit = 1, offset = 0, order = 'ASC' } = query;

    try {
      const mainChurch = await this.churchRepository.find({
        where: { isAnexe: false, recordStatus: RecordStatus.Active },
        take: limit,
        skip: offset,
        order: { createdAt: order as FindOptionsOrderValue },
      });

      return mainChurch;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find all
  async findAll(query: PaginationDto): Promise<Church[]> {
    const { limit, offset = 0, order = 'ASC', isSimpleQuery } = query;

    try {
      if (isSimpleQuery) {
        return await this.findBasicQuery<Church>({
          order: order as FindOptionsOrderValue,
          mainRepository: this.churchRepository,
          relations: [],
        });
      }

      return await this.findDetailedQuery<Church>({
        limit,
        offset,
        order: order as FindOptionsOrderValue,
        mainRepository: this.churchRepository,
        relations: [
          'updatedBy',
          'createdBy',
          'anexes',
          'zones',
          'ministries',
          'familyGroups',
          'pastors.member',
          'copastors.member',
          'supervisors.member',
          'preachers.member',
          'disciples.member',
        ],
        moduleKey: 'churches',
        formatterData: churchDataFormatter,
        relationLoadStrategy: 'query',
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find by filters
  async findByFilters(query: ChurchSearchAndPaginationDto): Promise<Church[]> {
    const { term, searchType } = query;

    if (!term) throw new BadRequestException('El término es requerido');
    if (!searchType) throw new BadRequestException('searchType es requerido');

    try {
      const searchStrategy = this.searchStrategyFactory.getStrategy(
        searchType as any,
      );

      return searchStrategy.execute<Church>({
        params: query,
        relations: [
          'anexes',
          'zones',
          'familyGroups',
          'pastors.member',
          'copastors.member',
          'supervisors.member',
          'preachers.member',
          'disciples.member',
          'updatedBy',
          'createdBy',
        ],
        mainRepository: this.churchRepository,
        moduleKey: 'churches',
        formatterData: churchDataFormatter,
        relationLoadStrategy: 'query',
      });
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Update
  async update(id: string, body: UpdateChurchDto, user: User): Promise<Church> {
    await this.validateId(id);

    const church = await this.findOrFail<Church>({
      repository: this.churchRepository,
      where: { id },
      relations: ['theirMainChurch'],
      moduleName: 'iglesia',
    });

    this.validateChurchUpdate(church, body);

    const { theirMainChurch } = body;
    let newMainChurch: Church | null = null;

    if (
      church.isAnexe &&
      theirMainChurch &&
      church.theirMainChurch?.id !== theirMainChurch
    ) {
      newMainChurch = await this.validateNewMainChurch(theirMainChurch);
    }

    try {
      const payload = this.buildUpdateData(church, body, user, newMainChurch);

      const updatedChurch = await this.churchRepository.preload(payload);
      return await this.churchRepository.save(updatedChurch);
    } catch (error) {
      this.handleDBExceptions(error, {
        email: 'El correo electrónico ya está en uso.',
        church: 'El nombre de iglesia ya está en uso.',
      });
    }
  }

  //* Delete
  async remove(id: string, query: InactivateChurchDto, user: User) {
    await this.validateId(id);

    const church = await this.findOrFail<Church>({
      repository: this.churchRepository,
      where: { id },
      relations: ['theirMainChurch'],
      moduleName: 'iglesia',
    });

    if (!church.isAnexe) {
      throw new BadRequestException(
        `La iglesia central no puede ser eliminada.`,
      );
    }

    await this.inactivateChurch(church, query, user);
    await this.clearChurchRelations(church.id, user);
  }

  // ---------------------------------------------------------------------------------------------- //

  //? Private methods
  //* Validations
  private async validateChurchCreation(
    dto: CreateChurchDto,
  ): Promise<Church | null> {
    const { theirMainChurch } = dto;

    const mainChurch = await this.churchRepository.findOne({
      where: { isAnexe: false },
    });

    if (mainChurch && !theirMainChurch) {
      throw new BadRequestException(
        `Ya existe una iglesia central, solo puedes crear iglesias anexos.`,
      );
    }

    if (theirMainChurch) {
      const central = await this.churchRepository.findOne({
        where: { id: theirMainChurch },
        relations: ['anexes'],
      });

      if (!central) {
        throw new NotFoundException(
          `No se encontró iglesia con id ${theirMainChurch}`,
        );
      }

      if (central.isAnexe) {
        throw new BadRequestException(
          `No puedes asignar una Iglesia anexo como Iglesia Central.`,
        );
      }

      if (central.recordStatus === RecordStatus.Inactive) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Iglesia Central debe ser "Activo"`,
        );
      }

      return central;
    }

    return null;
  }

  private validateChurchUpdate(
    church: Church,
    updateDto: UpdateChurchDto,
  ): void {
    const { isAnexe, theirMainChurch, recordStatus } = updateDto;

    if (church.isAnexe && !isAnexe) {
      throw new BadRequestException(
        'No se puede cambiar una iglesia anexa a una central.',
      );
    }

    if (!church.isAnexe && theirMainChurch) {
      throw new BadRequestException(
        'No se puede cambiar la iglesia central a un anexo.',
      );
    }

    if (
      church.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar el registro a "Inactivo", se debe eliminar.`,
      );
    }
  }

  private async validateNewMainChurch(mainChurchId: string): Promise<Church> {
    const newMainChurch = await this.churchRepository.findOne({
      where: { id: mainChurchId },
      relations: [
        'anexes',
        'pastors',
        'copastors',
        'supervisors',
        'zones',
        'preachers',
        'familyGroups',
        'disciples',
      ],
      relationLoadStrategy: 'query',
    });

    if (!newMainChurch) {
      throw new NotFoundException(
        `No se encontró Iglesia Central con id ${mainChurchId}`,
      );
    }

    if (newMainChurch.isAnexe) {
      throw new BadRequestException(
        'No se puede asignar una Iglesia Anexo como Iglesia Central',
      );
    }

    if (newMainChurch.recordStatus === RecordStatus.Inactive) {
      throw new BadRequestException(`La Iglesia Central debe estar "Activa"`);
    }

    return newMainChurch;
  }

  //* Finders and actions
  private async clearChurchRelations(
    churchId: string,
    user: User,
  ): Promise<void> {
    const repositories = [
      this.ministryRepository,
      this.pastorRepository,
      this.copastorRepository,
      this.supervisorRepository,
      this.zoneRepository,
      this.preacherRepository,
      this.familyGroupRepository,
      this.discipleRepository,
    ];

    const now = new Date();

    try {
      await Promise.all(
        repositories.map(async (repo: any) => {
          const items = await repo.find({
            relations: ['theirChurch'],
          });

          const filtered = items.filter(
            (item: any) => item?.theirChurch?.id === churchId,
          );

          await Promise.all(
            filtered.map(async (item: any) => {
              await repo.update(item.id, {
                theirChurch: null,
                updatedAt: now,
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

  private async inactivateChurch(
    church: Church,
    dto: InactivateChurchDto,
    user: User,
  ): Promise<void> {
    try {
      const updated = await this.churchRepository.preload({
        id: church.id,
        updatedAt: new Date(),
        updatedBy: user,
        inactivationCategory: dto.churchInactivationCategory,
        inactivationReason: dto.churchInactivationReason,
        recordStatus: RecordStatus.Inactive,
      });

      await this.churchRepository.save(updated);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Builders
  private buildCreateData(
    dto: CreateChurchDto,
    createdBy: User,
    mainChurch: Church | null,
  ): Partial<Church> {
    const { abbreviatedChurchName } = dto;

    return {
      ...dto,
      isAnexe: !!mainChurch,
      churchCode: generateCodeChurch(abbreviatedChurchName),
      theirMainChurch: mainChurch,
      createdAt: new Date(),
      createdBy,
    };
  }

  private buildUpdateData(
    church: Church,
    updateDto: UpdateChurchDto,
    user: User,
    mainChurch: Church | null,
  ): Partial<Church> {
    const {
      recordStatus,
      churchInactivationCategory,
      churchInactivationReason,
    } = updateDto;

    return {
      id: church.id,
      ...updateDto,
      churchCode:
        updateDto.abbreviatedChurchName !== church.abbreviatedChurchName
          ? generateCodeChurch(updateDto.abbreviatedChurchName)
          : church.churchCode,
      theirMainChurch: mainChurch ?? church.theirMainChurch,
      updatedAt: new Date(),
      updatedBy: user,
      inactivationCategory:
        recordStatus === RecordStatus.Active
          ? null
          : churchInactivationCategory,
      inactivationReason:
        recordStatus === RecordStatus.Active ? null : churchInactivationReason,
      recordStatus,
    };
  }
}
