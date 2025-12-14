import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

import { BasePaginationDto } from '@/common/dtos/base-pagination.dto';

export class UserPaginationOptionsDto {
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
}

export class UserPaginationDto extends IntersectionType(
  BasePaginationDto,
  UserPaginationOptionsDto,
) {}
