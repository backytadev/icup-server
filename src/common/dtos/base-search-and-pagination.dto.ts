import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsOptional, IsString, Min } from 'class-validator';

export class BaseSearchAndPaginationDto {
  @ApiProperty({
    example: 'john.doe',
    description: 'The term to search for.',
  })
  @IsOptional()
  term?: string;

  @ApiProperty({
    default: 10,
    example: 10,
    description: 'How many rows do you need?',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiProperty({
    default: 0,
    example: 0,
    required: false,
    description: 'How many rows do you want to skip?',
  })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number;

  @ApiProperty({
    default: 'DESC',
    example: 'DESC',
    required: false,
    description: 'What type of order do you need the records in?',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  order?: string;

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
