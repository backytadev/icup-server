import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  Between,
  FindOptionsOrderValue,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';

import { toZonedTime } from 'date-fns-tz';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { DashboardSearchType } from '@/common/enums/dashboard-search-type.enum';

import { ReportPaginationDto } from '@/common/dtos/report-pagination.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { MetricSearchType } from '@/modules/metrics/enums/metrics-search-type.enum';

import { OfferingIncomeSearchType } from '@/modules/offering/income/enums/offering-income-search-type.enum';
import { OfferingExpenseSearchType } from '@/modules/offering/expense/enums/offering-expense-search-type.enum';
import { OfferingIncomeCreationType } from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import { OfferingIncomeCreationSubType } from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';

import { lastSundayOfferingsDataFormatter } from '@/modules/metrics/helpers/dashboard/last-sunday-offerings-data-formatter.helper';
import { topOfferingsFamilyGroupsDataFormatter } from '@/modules/metrics/helpers/dashboard/top-offerings-family-groups-data-formatter.helper';

import { IncomeAndExpensesComparativeFormatter } from '@//modules/metrics/helpers/offering-comparative/income-and-expenses-comparative-formatter.helper';
import { comparativeOfferingIncomeByTypeFormatter } from '@//modules/metrics/helpers/offering-comparative/comparative-offering-income-by-type-formatter.helper';
import { generalComparativeOfferingIncomeFormatter } from '@//modules/metrics/helpers/offering-comparative/general-comparative-offering-income-formatter.helper';
import { comparativeOfferingExpensesByTypeFormatter } from '@//modules/metrics/helpers/offering-comparative/comparative-offering-expenses-by-type-formatter.helper';
import { generalComparativeOfferingExpensesFormatter } from '@//modules/metrics/helpers/offering-comparative/general-comparative-offering-expenses-formatter.helper';
import { ComparativeOfferingExpensesBySubTypeFormatter } from '@//modules/metrics/helpers/offering-comparative/comparative-offering-expenses-by-sub-type-formatter.helper';
import { offeringExpensesAndOfferingIncomeProportionFormatter } from '@//modules/metrics/helpers/offering-comparative/offering-expenses-and-offering-income-comparative-proportion-formatter.helper';

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

import { offeringExpenseChartFormatter } from '@/modules/metrics/helpers/offering-expense/offering-expense-chart-formatter.helper';
import { offeringExpenseReportFormatter } from '@/modules/metrics/helpers/offering-expense/offering-expense-report-formatter.helper';
import { offeringExpenseProportionFormatter } from '@/modules/metrics/helpers/offering-expense/offering-expense-proportion-formatter.helper';
import { offeringExpensesAdjustmentFormatter } from '@/modules/metrics/helpers/offering-expense/offering-expenses-adjustment-formatter.helper';

import { familyGroupFormatterByZone } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-zone.helper';
import { familyGroupFormatterByCopastorAndZone } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-copastor-and-zone.helper';
import { familyGroupProportionFormatter } from '@/modules/metrics/helpers/family-group/family-group-proportion-formatter.helper';
import { familyGroupFormatterByDistrict } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-district.helper';
import { familyGroupFluctuationFormatter } from '@/modules/metrics/helpers/family-group/family-group-fluctuation-formatter.helper';
import { familyGroupFormatterByServiceTime } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-service-time.helper';
import { familyGroupFormatterByRecordStatus } from '@/modules/metrics/helpers/family-group/family-group-formatter-by-record-status.helper';

import { memberProportionFormatter } from '@/modules/metrics/helpers/member/member-proportion-formatter.helper';
import { memberFormatterByCategory } from '@/modules/metrics/helpers/member/member-formatter-by-category.helper';
import { memberFluctuationFormatter } from '@/modules/metrics/helpers/member/member-fluctuation-formatter.helper';
import { memberFormatterByBirthMonth } from '@/modules/metrics/helpers/member/member-formatter-by-birth-month.helper';
import { memberFormatterByRecordStatus } from '@/modules/metrics/helpers/member/member-formatter-by-record-status.helper';
import { memberFormatterByMaritalStatus } from '@/modules/metrics/helpers/member/member-formatter-by-marital-status.helper';
import { memberFormatterByRoleAndGender } from '@/modules/metrics/helpers/member/member-formatter-by-role-and-gender.helper';
import { discipleFormatterByZoneAndGender } from '@/modules/metrics/helpers/member/disciple-formatter-by-zone-and-gender.helper';
import { preacherFormatterByZoneAndGender } from '@/modules/metrics/helpers/member/preacher-formatter-by-zone-and-gender.helper';
import { memberFormatterByDistrictAndGender } from '@/modules/metrics/helpers/member/member-formatter-by-district-and-gender.helper';
import { memberFormatterByCategoryAndGender } from '@/modules/metrics/helpers/member/member-formatter-by-category-and-gender.helper';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger('MetricsService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

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

    @InjectRepository(Disciple)
    private readonly discipleRepository: Repository<Disciple>,

    @InjectRepository(FamilyGroup)
    private readonly familyGroupRepository: Repository<FamilyGroup>,

    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,

    @InjectRepository(OfferingExpense)
    private readonly offeringExpenseRepository: Repository<OfferingExpense>,
  ) {}

  //? GENERE BALANCE SUMMARY
  async generateBalanceSummary(
    paginationDto: ReportPaginationDto,
  ): Promise<any> {
    const { churchId, endMonth, startMonth, year, currency } = paginationDto;

    const currentStartMonthDate = new Date(`${startMonth} 1, ${year}`);
    const currentEndMonthDate = new Date(`${endMonth} 1, ${year}`);

    const currentYearStartDate = subMonths(
      startOfMonth(currentStartMonthDate),
      1,
    );
    const currentYearEndDate = endOfMonth(currentEndMonthDate);

    const previousStartMonthDate = new Date(`January 1, ${+year - 1}`);
    const previousEndMonthDate = new Date(`January 1, ${+year - 1}`);

    const previousYearStartDate = startOfMonth(previousStartMonthDate);
    const previousYearEndDate = endOfMonth(previousEndMonthDate);

    try {
      const church = await this.churchRepository.findOne({
        where: {
          id: churchId,
          recordStatus: RecordStatus.Active,
        },
      });

      if (!church) return [];

      //? Resumen general (ingresos vs salidas)
      //* Current year
      const currentYearOfferingIncome =
        await this.offeringIncomeRepository.find({
          where: [
            {
              church: church,
              subType: Not(OfferingIncomeCreationSubType.ChurchGround),
              currency: currency,
              date: Between(currentYearStartDate, currentYearEndDate),
              recordStatus: RecordStatus.Active,
            },
            {
              church: church,
              subType: IsNull(),
              currency: currency,
              date: Between(currentYearStartDate, currentYearEndDate),
              recordStatus: RecordStatus.Active,
            },
          ],
          relations: ['church'],
        });

      const currentYearOfferingExpenses =
        await this.offeringExpenseRepository.find({
          where: {
            church: church,
            currency: currency,
            date: Between(currentYearStartDate, currentYearEndDate),
            recordStatus: RecordStatus.Active,
          },
          relations: ['church'],
        });

      //* Previous year
      const previousYearOfferingIncome =
        await this.offeringIncomeRepository.find({
          where: [
            {
              church: church,
              subType: Not(OfferingIncomeCreationSubType.ChurchGround),

              currency: currency,
              date: Between(previousYearStartDate, previousYearEndDate),
              recordStatus: RecordStatus.Active,
            },
            {
              church: church,
              subType: IsNull(),
              currency: currency,
              date: Between(previousYearStartDate, previousYearEndDate),
              recordStatus: RecordStatus.Active,
            },
          ],
          relations: ['church'],
        });

      const previousYearOfferingExpenses =
        await this.offeringExpenseRepository.find({
          where: {
            church: church,
            currency: currency,
            date: Between(previousYearStartDate, previousYearEndDate),
            recordStatus: RecordStatus.Active,
          },
          relations: ['church'],
        });

      //? Resumen de Ingreso

      //? Resumen de Egresos

      // * Return formatted data
      return IncomeAndExpensesComparativeFormatter({
        currentYearOfferingIncome: currentYearOfferingIncome,
        currentYearOfferingExpenses: currentYearOfferingExpenses,
        previousYearOfferingIncome: previousYearOfferingIncome,
        previousYearOfferingExpenses: previousYearOfferingExpenses,
        startMonth: startMonth,
        endMonth: endMonth,
      }) as any;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //? FIND BY TERM
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
      isSingleMonth,
      limit,
      offset,
    } = searchTypeAndPaginationDto;

    if (!term) {
      throw new BadRequestException(`El termino de búsqueda es requerido.`);
    }

    if (!searchType) {
      throw new BadRequestException(`El tipo de búsqueda es requerido1.`);
    }

    //? DASHBOARD
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

    //? MEMBER METRICS
    //* Members Proportion
    if (term && searchType === MetricSearchType.MembersByProportion) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church },
              order: {
                createdAt: order as FindOptionsOrderValue,
              },
              relations: ['member'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
          ]);

        return memberProportionFormatter({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members fluctuation analysis by year
    if (term && searchType === MetricSearchType.MembersFluctuationByYear) {
      const [churchId, yearValue] = term.split('&');
      const year = +yearValue;

      const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

      // New
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const newMembers = await Promise.all([
          this.pastorRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.copastorRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.supervisorRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.preacherRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.discipleRepository.find({
            where: {
              theirChurch: church,
              createdAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: { createdAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
        ]);

        // Inactive
        const inactiveMembers = await Promise.all([
          this.pastorRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.copastorRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.supervisorRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.preacherRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
          this.discipleRepository.find({
            where: {
              theirChurch: church,
              updatedAt: Between(startDate, endDate),
              recordStatus: RecordStatus.Inactive,
            },
            order: { updatedAt: order as FindOptionsOrderValue },
            relations: ['member', 'theirChurch'],
          }),
        ]);

        return memberFluctuationFormatter({
          newMembers,
          inactiveMembers,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by birth month
    if (term && searchType === MetricSearchType.MembersByBirthMonth) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByBirthMonth({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by category
    if (term && searchType === MetricSearchType.MembersByCategory) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member'],
            }),
          ]);

        return memberFormatterByCategory({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by category and gender
    if (term && searchType === MetricSearchType.MembersByCategoryAndGender) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByCategoryAndGender({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by role and gender
    if (term && searchType === MetricSearchType.MembersByRoleAndGender) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByRoleAndGender({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by marital status
    if (term && searchType === MetricSearchType.MembersByMaritalStatus) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: { theirChurch: church, recordStatus: RecordStatus.Active },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByMaritalStatus({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Disciples analysis by zone and gender
    if (term && searchType === MetricSearchType.DisciplesByZoneAndGender) {
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
            relations: ['member', 'zones'],
          });

          if (!copastor) return [];

          const zonesId = copastor.zones.map((zone) => zone?.id);

          const zones = await this.zoneRepository.find({
            where: {
              id: In(zonesId ?? []),
              recordStatus: RecordStatus.Active,
            },
            order: { zoneName: order as FindOptionsOrderValue },
            relations: [
              'theirCopastor.member',
              'theirSupervisor.member',
              'theirChurch',
              'disciples.member',
            ],
          });

          return discipleFormatterByZoneAndGender({
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
            relations: ['member', 'zones'],
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
              'disciples.member',
            ],
          });

          return discipleFormatterByZoneAndGender({
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

    //* Preachers analysis by zone and gender
    if (term && searchType === MetricSearchType.PreachersByZoneAndGender) {
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
            relations: ['member', 'zones'],
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
              'preachers.member',
            ],
          });

          return preacherFormatterByZoneAndGender({
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
            relations: ['member', 'zones'],
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
              'preachers.member',
            ],
          });

          return preacherFormatterByZoneAndGender({
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

    //* Members analysis by district and gender
    if (term && searchType === MetricSearchType.MembersByDistrictAndGender) {
      const [churchId, district] = term.split('&');

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: {
                theirChurch: church,
                member: {
                  residenceDistrict: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: {
                theirChurch: church,
                member: {
                  residenceDistrict: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: {
                theirChurch: church,
                member: {
                  residenceDistrict: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: {
                theirChurch: church,
                member: {
                  residenceDistrict: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: {
                theirChurch: church,
                member: {
                  residenceDistrict: district,
                },
                recordStatus: RecordStatus.Active,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByDistrictAndGender({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Members analysis by record status
    if (term && searchType === MetricSearchType.MembersByRecordStatus) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) return [];

        const [pastors, copastors, supervisors, preachers, disciples] =
          await Promise.all([
            this.pastorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.copastorRepository.find({
              where: {
                theirChurch: church,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.supervisorRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.preacherRepository.find({
              where: { theirChurch: church },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
            this.discipleRepository.find({
              where: {
                theirChurch: church,
              },
              order: { createdAt: order as FindOptionsOrderValue },
              relations: ['member', 'theirChurch'],
            }),
          ]);

        return memberFormatterByRecordStatus({
          pastors,
          copastors,
          supervisors,
          preachers,
          disciples,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

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

    //? OFFERING EXPENSE METRICS
    //* Offering expense proportion
    if (term && searchType === MetricSearchType.OfferingExpensesByProportion) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: { church: church },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        return offeringExpenseProportionFormatter({
          offeringExpenses: offeringExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Operational offering expenses
    if (term && searchType === MetricSearchType.OperationalOfferingExpenses) {
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.OperationalExpenses,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpenseChartFormatter({
            offeringExpenses,
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.OperationalExpenses,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpenseReportFormatter({
            offeringExpenses,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Maintenance and repair offering expenses
    if (
      term &&
      searchType === MetricSearchType.MaintenanceAndRepairOfferingExpenses
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.MaintenanceAndRepairExpenses,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpenseChartFormatter({
            offeringExpenses,
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.MaintenanceAndRepairExpenses,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpenseReportFormatter({
            offeringExpenses,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Decoration offering expenses
    if (term && searchType === MetricSearchType.DecorationOfferingExpenses) {
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.DecorationExpenses,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpenseChartFormatter({
            offeringExpenses,
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.DecorationExpenses,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpenseReportFormatter({
            offeringExpenses,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Equipment and technology and repair offering expenses
    if (
      term &&
      searchType === MetricSearchType.EquipmentAndTechnologyOfferingExpenses
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.EquipmentAndTechnologyExpenses,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpenseChartFormatter({
            offeringExpenses,
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.EquipmentAndTechnologyExpenses,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpenseReportFormatter({
            offeringExpenses,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Supplies offering expenses
    if (term && searchType === MetricSearchType.SuppliesOfferingExpenses) {
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.SuppliesExpenses,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpenseChartFormatter({
            offeringExpenses,
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.SuppliesExpenses,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpenseReportFormatter({
            offeringExpenses,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Planing events expenses
    if (term && searchType === MetricSearchType.PlaningEventsOfferingExpenses) {
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.PlaningEventsExpenses,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpenseChartFormatter({
            offeringExpenses,
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.PlaningEventsExpenses,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpenseReportFormatter({
            offeringExpenses,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Others Expenses
    if (term && searchType === MetricSearchType.OtherOfferingExpenses) {
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.OtherExpenses,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpenseChartFormatter({
            offeringExpenses,
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.OtherExpenses,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpenseReportFormatter({
            offeringExpenses,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //* Offering expenses adjustment
    if (term && searchType === MetricSearchType.OfferingExpensesAdjustment) {
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.ExpensesAdjustment,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpensesAdjustmentFormatter({
            offeringExpenses,
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

          const offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: OfferingExpenseSearchType.ExpensesAdjustment,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

          return offeringExpensesAdjustmentFormatter({
            offeringExpenses,
          }) as any;
        } catch (error) {
          this.handleDBExceptions(error);
        }
      }
    }

    //? OFFERING COMPARATIVE METRICS
    //* Offering comparative proportion
    if (
      term &&
      searchType ===
        MetricSearchType.OfferingExpensesAndOfferingIncomeByProportion
    ) {
      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: term,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: { church: church, recordStatus: RecordStatus.Active },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        const offeringIncome = await this.offeringIncomeRepository.find({
          where: { church: church, recordStatus: RecordStatus.Active },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        return offeringExpensesAndOfferingIncomeProportionFormatter({
          offeringExpenses,
          offeringIncome,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Income and expenses comparative
    if (
      term &&
      searchType === MetricSearchType.IncomeAndExpensesComparativeByYear
    ) {
      const [churchId, currency, yearValue] = term.split('&');
      const year = +yearValue;

      const currentStartMonthDate = new Date(`January 1, ${year}`);
      const currentEndMonthDate = new Date(`December 1, ${year}`);

      const currentYearStartDate = startOfMonth(currentStartMonthDate);
      const currentYearEndDate = endOfMonth(currentEndMonthDate);

      const previousStartMonthDate = new Date(`January 1, ${year - 1}`);
      const previousEndMonthDate = new Date(`December 1, ${year - 1}`);

      const previousYearStartDate = startOfMonth(previousStartMonthDate);
      const previousYearEndDate = endOfMonth(previousEndMonthDate);

      try {
        const church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
        });

        if (!church) return [];

        //* Current year
        const currentYearOfferingIncome =
          await this.offeringIncomeRepository.find({
            where: [
              {
                church: church,
                subType: Not(OfferingIncomeCreationSubType.ChurchGround),

                currency: currency,
                date: Between(currentYearStartDate, currentYearEndDate),
                recordStatus: RecordStatus.Active,
              },
              {
                church: church,
                subType: IsNull(),
                currency: currency,
                date: Between(currentYearStartDate, currentYearEndDate),
                recordStatus: RecordStatus.Active,
              },
            ],
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

        const currentYearOfferingExpenses =
          await this.offeringExpenseRepository.find({
            where: {
              church: church,
              currency: currency,
              date: Between(currentYearStartDate, currentYearEndDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

        //* Previous year
        const previousYearOfferingIncome =
          await this.offeringIncomeRepository.find({
            where: [
              {
                church: church,
                subType: Not(OfferingIncomeCreationSubType.ChurchGround),

                currency: currency,
                date: Between(previousYearStartDate, previousYearEndDate),
                recordStatus: RecordStatus.Active,
              },
              {
                church: church,
                subType: IsNull(),
                currency: currency,
                date: Between(previousYearStartDate, previousYearEndDate),
                recordStatus: RecordStatus.Active,
              },
            ],
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

        const previousYearOfferingExpenses =
          await this.offeringExpenseRepository.find({
            where: {
              church: church,
              currency: currency,
              date: Between(previousYearStartDate, previousYearEndDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });

        return IncomeAndExpensesComparativeFormatter({
          currentYearOfferingIncome: currentYearOfferingIncome,
          currentYearOfferingExpenses: currentYearOfferingExpenses,
          previousYearOfferingIncome: previousYearOfferingIncome,
          previousYearOfferingExpenses: previousYearOfferingExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* General comparative offering Income
    if (
      term &&
      searchType === MetricSearchType.GeneralComparativeOfferingIncome
    ) {
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
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return generalComparativeOfferingIncomeFormatter({
          offeringIncome: offeringIncome,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Comparative offering Income by type
    if (
      term &&
      searchType === MetricSearchType.ComparativeOfferingIncomeByType
    ) {
      const [churchId, type, yearValue] = term.split('&');
      const year = +yearValue;

      // const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      // const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

      const startMonthDate = new Date(`January 1, ${year}`);
      const endMonthDate = new Date(`December 1, ${year}`);

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

        let offeringIncome: OfferingIncome[];
        if (type !== OfferingIncomeCreationType.IncomeAdjustment) {
          offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              subType: type,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });
        }

        if (type === OfferingIncomeCreationType.IncomeAdjustment) {
          offeringIncome = await this.offeringIncomeRepository.find({
            where: {
              church: church,
              type: type,
              date: Between(startDate, endDate),
              recordStatus: RecordStatus.Active,
            },
            order: {
              createdAt: order as FindOptionsOrderValue,
            },
            relations: ['church'],
          });
        }

        return comparativeOfferingIncomeByTypeFormatter({
          offeringIncome: offeringIncome,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* General comparative offering expenses
    if (
      term &&
      searchType === MetricSearchType.GeneralComparativeOfferingExpenses
    ) {
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

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return generalComparativeOfferingExpensesFormatter({
          offeringExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Comparative offering Expenses by type
    if (
      term &&
      searchType === MetricSearchType.ComparativeOfferingExpensesByType
    ) {
      const [churchId, type, yearValue] = term.split('&');
      const year = +yearValue;

      // const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      // const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

      const startMonthDate = new Date(`January 1, ${year}`);
      const endMonthDate = new Date(`December 1, ${year}`);

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

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            type: type,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return comparativeOfferingExpensesByTypeFormatter({
          offeringExpenses,
        }) as any;
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //* Comparative offering expenses by sub type
    if (
      term &&
      searchType === MetricSearchType.ComparativeOfferingExpensesBySubType
    ) {
      const [churchId, type, startMonthName, endMonthName, year] =
        term.split('&');

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

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            type: type,
            date: Between(startDate, endDate),
            recordStatus: RecordStatus.Active,
          },
          order: {
            createdAt: order as FindOptionsOrderValue,
          },
          relations: ['church'],
        });

        return ComparativeOfferingExpensesBySubTypeFormatter({
          offeringExpenses,
        }) as any;
      } catch (error) {
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
