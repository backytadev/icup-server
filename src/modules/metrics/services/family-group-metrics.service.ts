import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, In, Repository } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { MetricSearchType } from '@/modules/metrics/enums/metrics-search-type.enum';

import { familyGroupFormatterByZone } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-zone.helper';
import { familyGroupFormatterByCopastorAndZone } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-copastor-and-zone.helper';
import { familyGroupProportionFormatter } from '@/modules/metrics/helpers/family-group/family-group-proportion-formatter.helper';
import { familyGroupFormatterByDistrict } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-district.helper';
import { familyGroupFluctuationFormatter } from '@/modules/metrics/helpers/family-group/family-group-fluctuation-formatter.helper';
import { familyGroupFormatterByServiceTime } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-service-time.helper';
import { familyGroupFormatterByRecordStatus } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-record-status.helper';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';

@Injectable()
export class FamilyGroupMetricsService {
  private readonly logger = new Logger('FamilyGroupMetricsService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(Copastor)
    private readonly copastorRepository: Repository<Copastor>,

    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,

    @InjectRepository(FamilyGroup)
    private readonly familyGroupRepository: Repository<FamilyGroup>,
  ) {}

  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<any> {
    const {
      searchType,
      order = 'DESC',
      allZones,
      allFamilyGroups,
      allDistricts,
    } = searchTypeAndPaginationDto;

    //? FAMILY GROUP METRICS
    //* Family groups Proportion
    if (term && searchType === MetricSearchType.FamilyGroupsByProportion) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const familyGroups = await this.familyGroupRepository.find({
          where: { theirChurch: church },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        return familyGroupProportionFormatter({
          familyGroups,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Family groups fluctuation by year
    if (term && searchType === MetricSearchType.FamilyGroupsFluctuationByYear) {
      const [churchId, valueYear] = term.split('&');
      const year = +valueYear;

      const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        // New
        const activeFamilyGroups = await this.familyGroupRepository.find({
          where: {
            theirChurch: church,
            createdAt: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
          relations: ['theirChurch'],
        });

        // Inactive
        const inactiveFamilyGroups = await this.familyGroupRepository.find({
          where: {
            theirChurch: church,
            updatedAt: Between(startDate, endDate),
            recordStatus: RecordStatus.Inactive,
          },
          order: { createdAt: order as FindOptionsOrderValue },
          relations: ['theirChurch'],
        });

        return familyGroupFluctuationFormatter({
          activeFamilyGroups,
          inactiveFamilyGroups,
          church,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Family Groups by zone
    if (term && searchType === MetricSearchType.FamilyGroupsByZone) {
      const [churchId, zoneId] = term.split('&');

      if (!allFamilyGroups) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const zone = await this.zoneRepository.findOne({
            where: {
              id: zoneId,
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            relations: ['familyGroups'],
          });

          if (!zone) return [];

          const familyGroupsId = zone.familyGroups.map(
            (familyGroup) => familyGroup?.id,
          );

          const familyGroups = await this.familyGroupRepository.find({
            where: {
              id: In(familyGroupsId),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirPreacher.member',
              'theirChurch',
              'disciples.member',
            ],
          });

          return familyGroupFormatterByZone({
            familyGroups,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }

      if (allFamilyGroups) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const zones = await this.zoneRepository.find({
            where: {
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            relations: ['familyGroups'],
          });

          const familyGroupsByZone = zones
            .map((zone) => zone.familyGroups)
            .flat();

          const familyGroupsId = familyGroupsByZone.map(
            (familyGroup) => familyGroup.id,
          );

          const familyGroups = await this.familyGroupRepository.find({
            where: {
              id: In(familyGroupsId),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirPreacher.member',
              'theirChurch',
              'disciples.member',
            ],
          });

          return familyGroupFormatterByZone({
            familyGroups,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //* Family Groups by copastor and zone
    if (term && searchType === MetricSearchType.FamilyGroupsByCopastorAndZone) {
      const [churchId, copastorId] = term.split('&');

      if (!allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const copastor = await this.copastorRepository.findOne({
            where: {
              id: copastorId,
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['zones'],
          });

          if (!copastor) return [];

          const zonesId = copastor.zones.map((zone) => zone?.id);

          const zones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirChurch',
              'familyGroups',
            ],
          });

          return familyGroupFormatterByCopastorAndZone({
            zones,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }

      if (allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const copastors = await this.copastorRepository.find({
            where: {
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['zones'],
          });

          const zonesByCopastor = copastors
            .map((copastor) => copastor?.zones)
            .flat();

          const zonesId = zonesByCopastor.map((zone) => zone?.id);

          const allZones = await this.zoneRepository.find({
            where: {
              id: In(zonesId),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirChurch',
              'familyGroups',
            ],
          });

          return familyGroupFormatterByCopastorAndZone({
            zones: allZones,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //* Family groups analysis by district
    if (term && searchType === MetricSearchType.FamilyGroupsByDistrict) {
      const [churchId, district] = term.split('&');

      if (!allDistricts) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const familyGroups = await this.familyGroupRepository.find({
            where: {
              theirChurch: church,
              district: district,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['theirChurch'],
          });

          return familyGroupFormatterByDistrict({
            familyGroups,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }

      if (allDistricts) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const familyGroups = await this.familyGroupRepository.find({
            where: {
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['theirChurch'],
          });

          return familyGroupFormatterByDistrict({
            familyGroups,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //* Family Groups analysis by service time
    if (term && searchType === MetricSearchType.FamilyGroupsByServiceTime) {
      const [churchId, zoneId] = term.split('&');

      if (!allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const zone = await this.zoneRepository.findOne({
            where: {
              id: zoneId,
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: [
              'familyGroups',
              'familyGroups.theirChurch',
              'familyGroups.theirSupervisor.member',
              'familyGroups.theirCopastor.member',
            ],
          });

          if (!zone) return [];

          const timeStringToMinutes = (time: string): number => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
          };

          const familyGroups = zone.familyGroups;

          const familyGroupsSorted = familyGroups.sort(
            (a, b) =>
              timeStringToMinutes(a.serviceTime) -
              timeStringToMinutes(b.serviceTime),
          );

          return familyGroupFormatterByServiceTime({
            familyGroups: familyGroupsSorted,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }

      if (allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const allZones = await this.zoneRepository.find({
            where: {
              theirChurch: church,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['familyGroups', 'familyGroups.theirChurch'],
          });

          const timeStringToMinutes = (time: string): number => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours * 60 + minutes;
          };

          const familyGroupsSorted = allZones
            .map((zone) => zone.familyGroups)
            .flat()
            .sort(
              (a, b) =>
                timeStringToMinutes(a.serviceTime) -
                timeStringToMinutes(b.serviceTime),
            )
            .filter(
              (familyGroup) => familyGroup.recordStatus === RecordStatus.Active,
            );

          return familyGroupFormatterByServiceTime({
            familyGroups: familyGroupsSorted,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }
    }

    //* Family Groups analysis by record status
    if (term && searchType === MetricSearchType.FamilyGroupsByRecordStatus) {
      const [churchId, zoneId] = term.split('&');

      if (!allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const zone = await this.zoneRepository.findOne({
            where: {
              id: zoneId,
              theirChurch: church,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: [
              'familyGroups',
              'familyGroups.theirSupervisor.member',
              'familyGroups.theirCopastor.member',
              'familyGroups.theirChurch',
              'familyGroups.theirZone',
            ],
          });

          if (!zone) return [];

          const familyGroups = zone?.familyGroups;

          return familyGroupFormatterByRecordStatus({
            familyGroups,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
      }

      if (allZones) {
        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
          });

          if (!church) return [];

          const allZones = await this.zoneRepository.find({
            where: {
              theirChurch: church,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: [
              'familyGroups',
              'familyGroups.theirSupervisor.member',
              'familyGroups.theirCopastor.member',
              'familyGroups.theirChurch',
              'familyGroups.theirZone',
            ],
          });

          const familyGroups = allZones
            .map((zone) => zone?.familyGroups)
            .flat();

          return familyGroupFormatterByRecordStatus({
            familyGroups,
          }) as any;
        } catch (error) {
          if (error instanceof NotFoundException) {
            throw error;
          }

          this.handleDBExceptions(error);
        }
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
