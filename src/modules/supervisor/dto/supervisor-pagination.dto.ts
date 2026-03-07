import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

import { BasePaginationDto } from '@/common/dtos/base-pagination.dto';
import { MemberPaginationOptionsDto } from '@/common/dtos/member-pagination-options.dto';

export class SupervisorPaginationOptionsDto {
  @ApiProperty({
    name: 'withNullZone',
    type: 'boolean',
    description:
      'Indicates whether null zone relationships should be included in the response.',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  withNullZone?: boolean;
}

export class SupervisorPaginationDto extends IntersectionType(
  BasePaginationDto,
  MemberPaginationOptionsDto,
  SupervisorPaginationOptionsDto,
) {}
