import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, Between, FindOptionsOrderValue, In, Repository } from 'typeorm';

import { toZonedTime } from 'date-fns-tz';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { DashboardSearchType } from '@/common/enums/dashboard-search-type.enum';

import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { OfferingIncomeSearchType } from '@/modules/offering/income/enums/offering-income-search-type.enum';

import { lastSundayOfferingsDataFormatter } from '@/modules/metrics/helpers/dashboard/last-sunday-offerings-data-formatter.helper';
import { topOfferingsFamilyGroupsDataFormatter } from '@/modules/metrics/helpers/dashboard/top-offerings-family-groups-data-formatter.helper';

import { Church } from '@/modules/church/entities/church.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';

@Injectable()
export class DashboardMetricsService {
  private readonly logger = new Logger('DashboardMetricsService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,
  ) {}

  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<any> {
    const {
      searchType,
      order = 'DESC',
      limit,
      offset,
    } = searchTypeAndPaginationDto;

    //* Last Sunday Offerings
    if (term && searchType === DashboardSearchType.LastSundaysOfferings) {
      const [dateTerm, churchId] = term.split('&');

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) {
          throw new NotFoundException(
            `No se encontró ninguna iglesia con este ID ${term}.`,
          );
        }

        const timeZone = 'America/Lima';
        const sundays = [];
        const zonedDate = toZonedTime(`${dateTerm} UTC`, timeZone);

        zonedDate.setDate(
          zonedDate.getUTCDay() === 0
            ? zonedDate.getUTCDate()
            : zonedDate.getUTCDate() - zonedDate.getUTCDay(),
        ); // Domingo mas cercano

        for (let i = 0; i < 7; i++) {
          sundays.push(zonedDate.toISOString().split('T')[0]);
          zonedDate.setDate(zonedDate.getUTCDate() - 7);
        }

        const currentYear = new Date().getFullYear();

        const offeringIncome = await this.offeringIncomeRepository.find({
          where: {
            subType: OfferingIncomeSearchType.SundayService,
            date: And(
              In(sundays),
              Between(
                new Date(`${currentYear}-01-01`),
                new Date(`${currentYear}-12-31`),
              ),
            ),
            church: church,
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'familyGroup',
            'church',
            'zone',
            'pastor.member',
            'copastor.member',
            'supervisor.member',
            'preacher.member',
            'disciple.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        return lastSundayOfferingsDataFormatter({
          offeringIncome: offeringIncome,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* Top Family groups Offerings
    if (term && searchType === DashboardSearchType.TopFamilyGroupsOfferings) {
      const [year, churchId] = term.split('&');

      try {
        const currentYear = year;
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) {
          throw new NotFoundException(
            `No se encontró ninguna iglesia con este Id.`,
          );
        }

        const offeringIncome = await this.offeringIncomeRepository.find({
          where: {
            subType: OfferingIncomeSearchType.FamilyGroup,
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'familyGroup',
            'familyGroup.theirChurch',
            'familyGroup.theirPreacher.member',
            'familyGroup.disciples.member',
            'zone',
            'church',
            'pastor.member',
            'copastor.member',
            'supervisor.member',
            'preacher.member',
            'disciple.member',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const filteredOfferingsByRecordStatus = offeringIncome.filter(
          (offeringIncome) =>
            offeringIncome.familyGroup?.recordStatus === RecordStatus.Active,
        );

        const filteredOfferingsByChurch =
          filteredOfferingsByRecordStatus.filter(
            (offeringIncome) =>
              offeringIncome.familyGroup?.theirChurch?.id === church?.id,
          );

        const filteredOfferingIncomeByCurrentYear =
          filteredOfferingsByChurch.filter((offeringIncome) => {
            const year = new Date(offeringIncome.date).getFullYear();
            return year === +currentYear;
          });

        return topOfferingsFamilyGroupsDataFormatter({
          offeringIncome: filteredOfferingIncomeByCurrentYear,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(`${error.message}`);
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
