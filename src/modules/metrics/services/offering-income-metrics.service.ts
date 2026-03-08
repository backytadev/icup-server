import {
  Logger,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, In, Repository } from 'typeorm';

import { endOfMonth, startOfMonth } from 'date-fns';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { MetricSearchType } from '@/modules/metrics/enums/metrics-search-type.enum';

import { OfferingIncomeSearchType } from '@/modules/offering/income/enums/offering-income-search-type.enum';

import { offeringIncomeProportionFormatter } from '@/modules/metrics/helpers/offering-income/offering-income-proportion-formatter.helper';
import { offeringIncomeByActivitiesFormatter } from '@/modules/metrics/helpers/offering-income/offering-income-by-activities-formatter.helper';
import { offeringIncomeByFamilyGroupFormatter } from '@/modules/metrics/helpers/offering-income/offering-income-by-family-group-formatter.helper';
import { offeringIncomeByChurchGroundFormatter } from '@/modules/metrics/helpers/offering-income/offering-income-by-church-ground-formatter.helper';
import { offeringIncomeBySundaySchoolFormatter } from '@/modules/metrics/helpers/offering-income/offering-income-by-sunday-school-formatter.helper';
import { offeringIncomeByYouthServiceFormatter } from '@/modules/metrics/helpers/offering-income/offering-income-by-youth-service-formatter.helper';
import { offeringIncomeBySundayServiceFormatter } from '@/modules/metrics/helpers/offering-income/offering-income-by-sunday-service-formatter.helper';
import { offeringIncomeByUnitedServiceFormatter } from '@/modules/metrics/helpers/offering-income/offering-income-by-united-service-formatter.helper';
import { offeringIncomeBySpecialOfferingFormatter } from '@/modules/metrics/helpers/offering-income/offering-income-by-special-offering-formatter.helper';
import { offeringIncomeByFastingAndVigilAndEvangelismFormatter } from '@/modules/metrics/helpers/offering-income/offering-income-by-fasting-and-vigil-and-evangelism-formatter.helper';
import { offeringIncomeByIncomeAdjustmentFormatter } from '@/modules/metrics/helpers/offering-income/offering-income-by-income-adjustment-formatter.helper';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';

@Injectable()
export class OfferingIncomeMetricsService {
  private readonly logger = new Logger('OfferingIncomeMetricsService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,

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
      isSingleMonth,
    } = searchTypeAndPaginationDto;

    //? OFFERING INCOME METRICS
    //* Offering income proportion
    if (term && searchType === MetricSearchType.OfferingIncomeByProportion) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringIncome = await this.offeringIncomeRepository.find({
          where: { church: church },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
        });

        return offeringIncomeProportionFormatter({
          offeringIncome: offeringIncome,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Offering income by sunday service
    if (term && searchType === MetricSearchType.OfferingIncomeBySundayService) {
      if (isSingleMonth) {
        const [churchId, startMonthName, year] = term.split('&');

        const monthDate = new Date(`${startMonthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.SundayService,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeBySundayServiceFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.SundayService,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeBySundayServiceFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by family groups
    if (term && searchType === MetricSearchType.OfferingIncomeByFamilyGroup) {
      if (isSingleMonth) {
        const [churchId, zoneId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const zone = await this.zoneRepository.findOne({
            where: {
              id: zoneId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!zone) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.FamilyGroup,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: [
              'church',
              'familyGroup',
              'familyGroup.disciples.member',
              'familyGroup.theirSupervisor.member',
              'familyGroup.theirPreacher.member',
              'familyGroup.theirZone',
            ],
          });

          const offeringIncomeByZone = offeringIncome.filter(
            (offeringIncome) =>
              offeringIncome?.familyGroup?.theirZone?.id === zone?.id,
          );

          return offeringIncomeByFamilyGroupFormatter({
            offeringIncome: offeringIncomeByZone,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.FamilyGroup,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: [
              'church',
              'familyGroup',
              'familyGroup.disciples.member',
              'familyGroup.theirSupervisor.member',
              'familyGroup.theirPreacher.member',
              'familyGroup.theirZone',
            ],
          });

          return offeringIncomeByFamilyGroupFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by sunday school
    if (term && searchType === MetricSearchType.OfferingIncomeBySundaySchool) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.SundaySchool,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: [
              'church',
              'pastor.member',
              'copastor.member',
              'supervisor.member',
              'preacher.member',
              'disciple.member',
              'externalDonor',
            ],
          });

          return offeringIncomeBySundaySchoolFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.SundaySchool,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: [
              'church',
              'pastor.member',
              'copastor.member',
              'supervisor.member',
              'preacher.member',
              'disciple.member',
              'externalDonor',
            ],
          });

          return offeringIncomeBySundaySchoolFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by fasting and vigil
    if (
      term &&
      searchType ===
        MetricSearchType.OfferingIncomeByFastingAndVigilAndEvangelism
    ) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const OfferingIncomeByGeneralFastingAndGeneralVigilAndChurch =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: In([
                  OfferingIncomeSearchType.GeneralFasting,
                  OfferingIncomeSearchType.GeneralVigil,
                  OfferingIncomeSearchType.GeneralEvangelism,
                ]),

                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                date: order as FindOptionsOrderValue,
              },
              relations: ['church'],
            });

          const OfferingIncomeByZonalFastingAndZonalVigil =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: In([
                  OfferingIncomeSearchType.ZonalVigil,
                  OfferingIncomeSearchType.ZonalFasting,
                  OfferingIncomeSearchType.ZonalEvangelism,
                ]),

                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                createdAt: order as FindOptionsOrderValue,
              },
              relations: [
                'church',
                'zone',
                'zone.theirCopastor.member',
                'zone.theirSupervisor.member',
                'zone.disciples.member',
              ],
            });

          return offeringIncomeByFastingAndVigilAndEvangelismFormatter({
            offeringIncome: [
              ...OfferingIncomeByGeneralFastingAndGeneralVigilAndChurch,
              ...OfferingIncomeByZonalFastingAndZonalVigil,
            ],
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const OfferingIncomeByGeneralFastingAndGeneralVigilAndChurch =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: In([
                  OfferingIncomeSearchType.GeneralFasting,
                  OfferingIncomeSearchType.GeneralVigil,
                  OfferingIncomeSearchType.GeneralEvangelism,
                ]),

                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                date: order as FindOptionsOrderValue,
              },
              relations: ['church'],
            });

          const OfferingIncomeByZonalFastingAndZonalVigil =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: In([
                  OfferingIncomeSearchType.ZonalVigil,
                  OfferingIncomeSearchType.ZonalFasting,
                  OfferingIncomeSearchType.ZonalEvangelism,
                ]),

                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                createdAt: order as FindOptionsOrderValue,
              },
              relations: [
                'church',
                'zone',
                'zone.theirCopastor.member',
                'zone.theirSupervisor.member',
                'zone.disciples.member',
              ],
            });

          return offeringIncomeByFastingAndVigilAndEvangelismFormatter({
            offeringIncome: [
              ...OfferingIncomeByGeneralFastingAndGeneralVigilAndChurch,
              ...OfferingIncomeByZonalFastingAndZonalVigil,
            ],
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by youth service
    if (term && searchType === MetricSearchType.OfferingIncomeByYouthService) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.YouthService,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: [
              'church',
              'pastor.member',
              'copastor.member',
              'supervisor.member',
              'preacher.member',
              'disciple.member',
              'externalDonor',
            ],
          });

          return offeringIncomeByYouthServiceFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.YouthService,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: [
              'church',
              'pastor.member',
              'copastor.member',
              'supervisor.member',
              'preacher.member',
              'disciple.member',
              'externalDonor',
            ],
          });

          return offeringIncomeByYouthServiceFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by special offering
    if (
      term &&
      searchType === MetricSearchType.OfferingIncomeBySpecialOffering
    ) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncomeBySpecialOffering =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: OfferingIncomeSearchType.Special,
                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                createdAt: order as FindOptionsOrderValue,
              },
              relations: [
                'church',
                'pastor.member',
                'copastor.member',
                'supervisor.member',
                'preacher.member',
                'disciple.member',
                'externalDonor',
              ],
            });

          return offeringIncomeBySpecialOfferingFormatter({
            offeringIncome: offeringIncomeBySpecialOffering,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncomeBySpecialOffering =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: OfferingIncomeSearchType.Special,
                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                createdAt: order as FindOptionsOrderValue,
              },
              relations: [
                'church',
                'pastor.member',
                'copastor.member',
                'supervisor.member',
                'preacher.member',
                'disciple.member',
                'externalDonor',
              ],
            });

          return offeringIncomeBySpecialOfferingFormatter({
            offeringIncome: offeringIncomeBySpecialOffering,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by church ground
    if (term && searchType === MetricSearchType.OfferingIncomeByChurchGround) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncomeBySpecialOffering =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: OfferingIncomeSearchType.ChurchGround,
                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                createdAt: order as FindOptionsOrderValue,
              },
              relations: [
                'church',
                'pastor.member',
                'copastor.member',
                'supervisor.member',
                'preacher.member',
                'disciple.member',
                'externalDonor',
              ],
            });

          return offeringIncomeByChurchGroundFormatter({
            offeringIncome: offeringIncomeBySpecialOffering,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncomeBySpecialOffering =
            await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: OfferingIncomeSearchType.ChurchGround,
                date: Between(startDate, endDate),
                recordStatus: RecordStatus.Active,
              },
              order: {
                createdAt: order as FindOptionsOrderValue,
              },
              relations: [
                'church',
                'pastor.member',
                'copastor.member',
                'supervisor.member',
                'preacher.member',
                'disciple.member',
                'externalDonor',
              ],
            });

          return offeringIncomeByChurchGroundFormatter({
            offeringIncome: offeringIncomeBySpecialOffering,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by united service
    if (term && searchType === MetricSearchType.OfferingIncomeByUnitedService) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.UnitedService,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeByUnitedServiceFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.UnitedService,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeByUnitedServiceFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by activities
    if (term && searchType === MetricSearchType.OfferingIncomeByActivities) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.Activities,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeByActivitiesFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: OfferingIncomeSearchType.Activities,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeByActivitiesFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering income by income adjustment
    if (term && searchType === MetricSearchType.OfferingIncomeAdjustment) {
      if (isSingleMonth) {
        const [churchId, monthName, year] = term.split('&');

        const monthDate = new Date(`${monthName} 1, ${year}`);
        const startDate = startOfMonth(monthDate);
        const endDate = endOfMonth(monthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              type: OfferingIncomeSearchType.IncomeAdjustment,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeByIncomeAdjustmentFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }

      if (!isSingleMonth) {
        const [churchId, startMonthName, endMonthName, year] = term.split('&');

        const startMonthDate = new Date(`${startMonthName} 1, ${year}`);
        const endMonthDate = new Date(`${endMonthName} 1, ${year}`);

        const startDate = startOfMonth(startMonthDate);
        const endDate = endOfMonth(endMonthDate);

        try {
          const church = await this.churchRepository.findOne({
            where: {
              id: churchId,
              recordStatus: RecordStatus.Active,
            },
          });

          if (!church) return [];

          const offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              type: OfferingIncomeSearchType.IncomeAdjustment,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringIncomeByIncomeAdjustmentFormatter({
            offeringIncome: offeringIncome,
          }) as any;
        } catch (error) {
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
