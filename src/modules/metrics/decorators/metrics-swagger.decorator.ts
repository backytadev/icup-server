import { applyDecorators } from '@nestjs/common';
import { ApiParam, ApiQuery } from '@nestjs/swagger';

import { SwaggerResponses } from '@/common/swagger/swagger.response';
import { MetricSearchType } from '@/modules/metrics/enums/metrics-search-type.enum';

export const MetricsSimpleSwagger = (
  description = 'Metrics data retrieved successfully',
) =>
  applyDecorators(
    SwaggerResponses.ok(description),
    SwaggerResponses.defaultResponses(),
  );

export const MetricsFindByTermSwagger = () =>
  applyDecorators(
    SwaggerResponses.ok('Metrics data retrieved successfully'),
    SwaggerResponses.defaultResponses(),
    ApiParam({
      name: 'term',
      description:
        'A combination of identifiers separated by an ampersand (&). Examples include church ID with year, church ID with co-pastor ID, church ID with district, etc.',
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
          summary: 'Church ID and month and year',
          value: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&January&2025',
        },
        churchWithZoneAndMonthAndYear: {
          summary: 'Church ID, Zone ID, month and year',
          value:
            'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&January&2025',
        },
        churchWithCurrencyAndYear: {
          summary: 'Church ID, currency and year',
          value: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&PEN&2025',
        },
        churchWithStartAndEndMonthAndYear: {
          summary: 'Church ID, start month, end month and year',
          value: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&January&January&2025',
        },
        churchWithTypeAndYear: {
          summary: 'Church ID, metric type and year',
          value:
            'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&members_by_proportion&2025',
        },
        churchWithTypeAndStartAndEndMonthAndYear: {
          summary: 'Church ID, type, start month, end month and year',
          value:
            'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27&members_by_proportion&January&January&2025',
        },
      },
    }),
    ApiQuery({
      name: 'searchType',
      enum: MetricSearchType,
      description: 'Choose one of the metric types to perform a search.',
      example: MetricSearchType.MembersFluctuationByYear,
    }),
    ApiQuery({
      name: 'allFamilyGroups',
      type: 'boolean',
      description: 'Include all family groups in the response.',
      example: false,
      required: false,
    }),
    ApiQuery({
      name: 'allZones',
      type: 'boolean',
      description: 'Include all zones in the response.',
      example: false,
      required: false,
    }),
    ApiQuery({
      name: 'allDistricts',
      type: 'boolean',
      description: 'Include all districts in the response.',
      example: false,
      required: false,
    }),
    ApiQuery({
      name: 'isSingleMonth',
      type: 'boolean',
      description: 'Search by a single month instead of a month range.',
      example: false,
      required: false,
    }),
  );
