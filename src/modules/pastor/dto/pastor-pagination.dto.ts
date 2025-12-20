import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { BasePaginationDto } from '@/common/dtos/base-pagination.dto';
import { Transform, Type } from 'class-transformer';

export class PastorPaginationOptionsDto {
  @ApiProperty({
    name: 'isSimpleQuery',
    example: 'false',
    required: false,
    type: 'boolean',
    description:
      'Specifies whether the query should be simple (without loading relations) or full (including relations).',
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  isSimpleQuery?: boolean;

  @ApiProperty({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  churchId?: string;
}

export class PastorPaginationDto extends IntersectionType(
  BasePaginationDto,
  PastorPaginationOptionsDto,
) {}
