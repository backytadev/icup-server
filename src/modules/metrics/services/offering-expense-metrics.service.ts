import {
  Logger,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, Repository } from 'typeorm';

import { endOfMonth, startOfMonth } from 'date-fns';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { MetricSearchType } from '@/modules/metrics/enums/metrics-search-type.enum';

import { OfferingExpenseSearchType } from '@/modules/offering/expense/enums/offering-expense-search-type.enum';

import { offeringExpenseChartFormatter } from '@/modules/metrics/helpers/offering-expense/offering-expense-chart-formatter.helper';
import { offeringExpenseReportFormatter } from '@/modules/metrics/helpers/offering-expense/offering-expense-report-formatter.helper';
import { offeringExpenseProportionFormatter } from '@/modules/metrics/helpers/offering-expense/offering-expense-proportion-formatter.helper';
import { offeringExpensesAdjustmentFormatter } from '@/modules/metrics/helpers/offering-expense/offering-expenses-adjustment-formatter.helper';

import { Church } from '@/modules/church/entities/church.entity';
import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';

@Injectable()
export class OfferingExpenseMetricsService {
  private readonly logger = new Logger('OfferingExpenseMetricsService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(OfferingExpense)
    private readonly offeringExpenseRepository: Repository<OfferingExpense>,
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
