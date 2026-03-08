import { applyDecorators } from '@nestjs/common';
import { ApiProduces, ApiQuery } from '@nestjs/swagger';
import type { SwaggerEnumType } from '@nestjs/swagger/dist/types/swagger-enum.type';

import { SwaggerResponses } from '@/common/swagger/swagger.response';

const CHURCH_ID_QUERY = ApiQuery({
  name: 'churchId',
  type: 'string',
  description:
    'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
  example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
  required: false,
});

export interface ReportSwaggerProps {
  description?: string;
  paramDescription?: string;
  paramExample?: string;
  showChurchId?: boolean;
  searchTypeEnum?: SwaggerEnumType;
  searchTypeExample?: unknown;
  searchSubTypeEnum?: SwaggerEnumType;
  searchSubTypeExample?: unknown;
}

export const ReportGeneralSwagger = ({
  description = 'Report generated successfully',
  showChurchId = false,
}: ReportSwaggerProps) => {
  const decorators = [
    SwaggerResponses.ok(description),
    ApiProduces('application/pdf'),
    SwaggerResponses.defaultResponses(),
  ];

  if (showChurchId) decorators.push(CHURCH_ID_QUERY);

  return applyDecorators(...decorators);
};

export const ReportSearchSwagger = ({
  description = 'Report generated successfully',
  showChurchId = false,
  searchTypeEnum,
  searchTypeExample,
  searchSubTypeEnum,
  searchSubTypeExample,
}: ReportSwaggerProps) => {
  const decorators = [
    SwaggerResponses.ok(description),
    ApiProduces('application/pdf'),
    SwaggerResponses.defaultResponses(),
  ];

  if (searchTypeEnum) {
    decorators.push(
      ApiQuery({
        name: 'searchType',
        enum: searchTypeEnum,
        description: 'Choose one of the types to perform a search.',
        example: searchTypeExample,
      }),
    );
  }

  if (searchSubTypeEnum) {
    decorators.push(
      ApiQuery({
        name: 'searchSubType',
        enum: searchSubTypeEnum,
        required: false,
        description: 'Choose one of the types to perform a search.',
        example: searchSubTypeExample,
      }),
    );
  }

  if (showChurchId) decorators.push(CHURCH_ID_QUERY);

  return applyDecorators(...decorators);
};

export const ReportByIdSwagger = ({
  description = 'Report generated successfully',
  paramDescription = 'Unique identifier of the resource.',
  paramExample = 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
}: ReportSwaggerProps) =>
  applyDecorators(
    SwaggerResponses.param('id', paramDescription, paramExample),
    SwaggerResponses.ok(description),
    ApiProduces('application/pdf'),
    SwaggerResponses.defaultResponses(),
  );
