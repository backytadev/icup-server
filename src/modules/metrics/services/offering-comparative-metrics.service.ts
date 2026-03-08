import {
  Logger,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsOrderValue,
  IsNull,
  Not,
  Repository,
} from 'typeorm';

import { endOfMonth, startOfMonth } from 'date-fns';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { MetricSearchType } from '@/modules/metrics/enums/metrics-search-type.enum';

import { OfferingIncomeCreationType } from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import { OfferingIncomeCreationSubType } from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';

import { IncomeAndExpensesComparativeFormatter } from '@//modules/metrics/helpers/offering-comparative/income-and-expenses-comparative-formatter.helper';
import { comparativeOfferingIncomeByTypeFormatter } from '@//modules/metrics/helpers/offering-comparative/comparative-offering-income-by-type-formatter.helper';
import { generalComparativeOfferingIncomeFormatter } from '@//modules/metrics/helpers/offering-comparative/general-comparative-offering-income-formatter.helper';
import { comparativeOfferingExpensesByTypeFormatter } from '@//modules/metrics/helpers/offering-comparative/comparative-offering-expenses-by-type-formatter.helper';
import { generalComparativeOfferingExpensesFormatter } from '@//modules/metrics/helpers/offering-comparative/general-comparative-offering-expenses-formatter.helper';
import { ComparativeOfferingExpensesBySubTypeFormatter } from '@//modules/metrics/helpers/offering-comparative/comparative-offering-expenses-by-sub-type-formatter.helper';
import { offeringExpensesAndOfferingIncomeProportionFormatter } from '@//modules/metrics/helpers/offering-comparative/offering-expenses-and-offering-income-comparative-proportion-formatter.helper';

import { Church } from '@/modules/church/entities/church.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';

@Injectable()
export class OfferingComparativeMetricsService {
  private readonly logger = new Logger('OfferingComparativeMetricsService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,

    @InjectRepository(OfferingExpense)
    private readonly offeringExpenseRepository: Repository<OfferingExpense>,
  ) {}

  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<any> {
    const { searchType, order = 'DESC' } = searchTypeAndPaginationDto;

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
          church,
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

    //todo:  tomar de aqui la refencia para la data
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
