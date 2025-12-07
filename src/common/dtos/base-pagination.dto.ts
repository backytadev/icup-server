import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsOptional, IsString, Min } from 'class-validator';

export class BasePaginationDto {
  @ApiProperty({
    default: 10,
    example: 10,
    required: false,
    description: 'How many rows do you need?',
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
    example: '23876342347+33498735335',
    required: false,
    description: 'Optional date range filter',
  })
  @IsOptional()
  @IsString()
  searchDate?: string;

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
}
