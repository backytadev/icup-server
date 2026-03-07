import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventCategory } from '@/common/enums/event-category.enum';

export class CreateCalendarEventDto {
  @ApiProperty({
    example: 'Culto de Adoración',
    description: 'Título del evento',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: 'Un tiempo especial para adorar a Dios.',
    description: 'Descripción detallada del evento',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  description: string;

  @ApiProperty({
    example: '2024-05-20',
    description: 'Fecha del evento (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    example: '19:00',
    description: 'Hora del evento (HH:mm)',
  })
  @IsString()
  @IsNotEmpty()
  time: string;

  @ApiProperty({
    example: 'Av. Las Palmas 123, Lima',
    description: 'Ubicación física del evento',
  })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({
    example: -12.046374,
    description: 'Latitud de la ubicación',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    example: -77.042793,
    description: 'Longitud de la ubicación',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    enum: EventCategory,
    example: EventCategory.WorshipService,
    description: 'Categoría del evento',
  })
  @IsEnum(EventCategory)
  @IsNotEmpty()
  category: EventCategory;

  @ApiProperty({
    example: 'https://example.com/images/event.jpg',
    description: 'URL de la imagen del evento',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
