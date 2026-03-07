import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { EventCategory } from '@/common/enums/event-category.enum';

export class CalendarEventPaginationDto extends PaginationDto {
  @ApiProperty({
    enum: EventCategory,
    required: false,
    description: 'Filtrar por categoría de evento',
  })
  @IsEnum(EventCategory)
  @IsOptional()
  category?: EventCategory;

  @ApiProperty({
    required: false,
    description: 'Buscar por título o descripción',
  })
  @IsString()
  @IsOptional()
  term?: string;
}
