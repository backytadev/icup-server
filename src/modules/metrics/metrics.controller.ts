import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { Auth } from '@/common/decorators/auth.decorator';
import { ReportPaginationDto } from '@/common/dtos/report-pagination.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { MetricsService } from '@/modules/metrics/metrics.service';
import {
  MetricsSimpleSwagger,
  MetricsFindByTermSwagger,
} from '@/modules/metrics/decorators/metrics-swagger.decorator';

@ApiTags('Metrics')
@ApiBearerAuth()
@SkipThrottle()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  //* Balance summary
  @Get('/balance/summary/general')
  @Auth()
  @MetricsSimpleSwagger('Financial balance summary retrieved successfully')
  generateFinancialBalanceSummary(
    @Query() paginationDto: ReportPaginationDto,
  ): Promise<any> {
    return this.metricsService.generateFinancialBalanceSummary(paginationDto);
  }

  //* Income details by month
  @Get('/balance/income/monthly-detail-by-type')
  @Auth()
  @MetricsSimpleSwagger('Monthly income detail by type retrieved successfully')
  getIncomeMonthlyDetailByType(
    @Query() paginationDto: ReportPaginationDto,
  ): Promise<any> {
    return this.metricsService.getIncomeMonthlyDetailByType(paginationDto);
  }

  //* Expense details by month
  @Get('/balance/expenses/monthly-detail-by-type')
  @Auth()
  @MetricsSimpleSwagger('Monthly expense detail by type retrieved successfully')
  getExpenseMonthlyDetailByType(
    @Query() paginationDto: ReportPaginationDto,
  ): Promise<any> {
    return this.metricsService.getExpenseMonthlyDetailByType(paginationDto);
  }

  @Get('/balance/expenses/monthly-detail-by-sub-type')
  @Auth()
  @MetricsSimpleSwagger(
    'Monthly expense detail by sub-type retrieved successfully',
  )
  getExpenseMonthlyDetailBySubType(
    @Query() paginationDto: ReportPaginationDto,
  ): Promise<any> {
    return this.metricsService.getExpenseMonthlyDetailBySubType(paginationDto);
  }

  //* Find by term
  @Get(':term')
  @Auth()
  @MetricsFindByTermSwagger()
  findByTerm(
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<any> {
    return this.metricsService.findByTerm(term, searchTypeAndPaginationDto);
  }
}
