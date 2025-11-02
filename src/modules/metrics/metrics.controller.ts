import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { ReportPaginationDto } from '@/common/dtos/report-pagination.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { Auth } from '@/modules/auth/decorators/auth.decorator';
import { MetricsService } from '@/modules/metrics/metrics.service';
import { MetricSearchType } from '@/modules/metrics/enums/metrics-search-type.enum';

@ApiTags('Metrics')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description:
    '🔒 Unauthorized: Missing or invalid Bearer Token. Please provide a valid token to access this resource.',
})
@ApiInternalServerErrorResponse({
  description:
    '🚨 Internal Server Error: An unexpected error occurred on the server. Please check the server logs for more details.',
})
@ApiBadRequestResponse({
  description:
    '❌ Bad Request: The request contains invalid data or parameters. Please verify the input and try again.',
})
@ApiForbiddenResponse({
  description:
    '🚫 Forbidden: You do not have the necessary permissions to access this resource.',
})
@SkipThrottle()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  //* Balance summary
  @Get('/view-balance-summary')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Successfully completed: The operation was completed successfully and the response contains the requested data.',
  })
  @ApiNotFoundResponse({
    description:
      '❓ Not Found: The requested resource was not found. Please verify the provided parameters or URL.',
  })
  generateBalanceSummary(
    @Query() paginationDto: ReportPaginationDto,
  ): Promise<any> {
    return this.metricsService.generateBalanceSummary(paginationDto);
  }

  //? FIND BY TERM
  @Get(':term')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Successfully completed: The operation was completed successfully and the response contains the requested data.',
  })
  @ApiNotFoundResponse({
    description:
      '❓ Not Found: The requested resource was not found. Please verify the provided parameters or URL.',
  })
  @ApiParam({
    name: 'term',
    description:
      'A combination of identifiers separated by an ampersand (&). Examples include church ID with year, church ID with co-pastor ID, and church ID with district, etc.',
    examples: {
      church: {
        summary: 'Church ID',
        value: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
      },
      churchWithYear: {
        summary: 'Church ID and year',
        value: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&2025',
      },
      churchWithZone: {
        summary: 'Church ID and Zone ID',
        value:
          'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&d89c7e32-8a2b-4d1f-a6c8-b342db59d5e3',
      },
      churchWithCoPastor: {
        summary: 'Church ID and Co-Pastor ID',
        value:
          'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&d89c7e32-8a2b-4d1f-a6c8-b342db59d5e3',
      },
      churchWithDistrict: {
        summary: 'Church ID and district',
        value: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&Independencia',
      },
      churchWithMonthAndYear: {
        summary: 'Church ID and district and year',
        value: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&January&2025',
      },
      churchWithZonaAndMonthAndYear: {
        summary: 'Church ID and Zone ID and district and year',
        value:
          'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&January&2025',
      },
      churchWithCurrencyAndYear: {
        summary: 'Church ID and currency and year',
        value: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&PEN&2025',
      },
      churchWithStartMonthAndEndMonthAndYear: {
        summary: 'Church ID and start month and end month and year',
        value: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&January&January&2025',
      },
      churchWithTypeAndYear: {
        summary: 'Church ID and metric type and year',
        value:
          'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&members_by_proportion&2025',
      },
      churchWithTypeAndStartMonthAndEndMonthAndYear: {
        summary: 'Church ID and type and start month and end month and year',
        value:
          'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&members_by_proportion&January&January&2025',
      },
    },
  })
  @ApiQuery({
    name: 'searchType',
    enum: MetricSearchType,
    description: 'Choose one of the types to perform a search.',
    example: MetricSearchType.MembersFluctuationByYear,
  })
  @ApiQuery({
    name: 'allFamilyGroups',
    type: 'boolean',
    description:
      'Indicates whether all family groups should be included in the response.',
    example: false,
    required: false,
  })
  @ApiQuery({
    name: 'allZones',
    type: 'boolean',
    description: 'Indicates if all zones should be included in the response.',
    example: false,
    required: false,
  })
  @ApiQuery({
    name: 'allDistricts',
    type: 'boolean',
    description:
      'Indicates whether all districts should be included in the response.',
    example: false,
    required: false,
  })
  @ApiQuery({
    name: 'isSingleMonth',
    type: 'boolean',
    description:
      'Would you like to search by a single month or a range of months?',
    example: false,
    required: false,
  })
  findByTerm(
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<any> {
    return this.metricsService.findByTerm(term, searchTypeAndPaginationDto);
  }
}
