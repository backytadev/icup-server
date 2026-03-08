import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, Repository } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { BaseService } from '@/common/services/base.service';

import { OfferingIncomeSearchStrategyFactory } from '@/modules/offering/income/strategies/offering-income-search-strategy.factory';
import { OfferingIncomeSearchAndPaginationDto } from '@/modules/offering/income/dto/offering-income-search-and-pagination.dto';

import { offeringIncomeDataFormatter } from '@/modules/offering/income/helpers/offering-income-data-formatter.helper';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';

@Injectable()
export class OfferingIncomeReadService extends BaseService {
  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,

    @InjectRepository(Preacher)
    private readonly preacherRepository: Repository<Preacher>,

    @InjectRepository(Supervisor)
    private readonly supervisorRepository: Repository<Supervisor>,

    @InjectRepository(FamilyGroup)
    private readonly familyGroupRepository: Repository<FamilyGroup>,

    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,

    private readonly searchStrategyFactory: OfferingIncomeSearchStrategyFactory,
  ) {
    super();
  }

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const {
      limit,
      offset = 0,
      order = 'ASC',
      churchId,
      searchDate,
    } = paginationDto;

    try {
      let church: Church;
      if (churchId) {
        church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) {
          throw new NotFoundException(
            `Iglesia con id ${churchId} no fue encontrada.`,
          );
        }
      }

      if (searchDate) {
        const [fromTimestamp, toTimestamp] = searchDate?.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const fromDate = new Date(fromTimestamp);
        const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

        const offeringIncome = await this.offeringIncomeRepository.find({
          where: {
            church: church,
            date: Between(fromDate, toDate),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'church',
            'pastor.member',
            'copastor.member',
            'supervisor.member',
            'preacher.member',
            'disciple.member',
            'familyGroup.theirPreacher.member',
            'zone.theirSupervisor.member',
            'externalDonor',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (offeringIncome.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringIncome: offeringIncome,
        }) as any;
      }

      if (!searchDate) {
        const offeringIncome = await this.offeringIncomeRepository.find({
          where: {
            church: church,

            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'church',
            'pastor.member',
            'copastor.member',
            'supervisor.member',
            'preacher.member',
            'disciple.member',
            'familyGroup.theirPreacher.member',
            'zone.theirSupervisor.member',
            'externalDonor',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (offeringIncome.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringIncome: offeringIncome,
        }) as any;
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error, {
        email: 'El correo electrónico ya está en uso.',
      });
    }
  }

  //* FIND BY FILTERS
  async findByFilters(
    dto: OfferingIncomeSearchAndPaginationDto,
  ): Promise<OfferingIncome[]> {
    const {
      searchType,
      searchSubType,
      term,
      limit,
      offset = 0,
      order,
      churchId,
    } = dto;

    if (!term) {
      throw new BadRequestException(`El termino de búsqueda es requerido.`);
    }

    if (!searchType) {
      throw new BadRequestException(`El tipo de búsqueda es requerido.`);
    }

    //* Search Church
    let church: Church;
    if (churchId) {
      church = await this.churchRepository.findOne({
        where: { id: churchId, recordStatus: RecordStatus.Active },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (!church) {
        throw new NotFoundException(
          `Iglesia con id ${churchId} no fue encontrada.`,
        );
      }
    }

    //? Delegate to strategy
    const strategy = this.searchStrategyFactory.getStrategy(
      searchType,
      searchSubType,
    );

    return strategy.execute({
      term,
      searchType,
      searchSubType,
      limit,
      offset,
      order,
      church,
      offeringIncomeRepository: this.offeringIncomeRepository,
      zoneRepository: this.zoneRepository,
      preacherRepository: this.preacherRepository,
      supervisorRepository: this.supervisorRepository,
      familyGroupRepository: this.familyGroupRepository,
    });
  }
}
