import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { CalendarEventCategory } from '@/common/enums/calendar-event-category.enum';
import { CalendarEventStatus } from '@/common/enums/calendar-event-status.enum';
import { CalendarEventTargetGroup } from '@/common/enums/calendar-event-target-group.enum';
import { Type } from 'class-transformer';

export class CreateCalendarEventDto {
  @ApiProperty({
    example: 'Culto de Adoración',
    description: 'Título del evento',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, {
    message: 'El titulo debe tener al menos 3 caracteres.',
  })
  @MaxLength(100, {
    message: 'El titulo no puede superar los 100 caracteres.',
  })
  title: string;

  @ApiProperty({
    example: 'Un tiempo especial para adorar a Dios.',
    description: 'Descripción del evento',
  })
  @IsString({ message: 'La descripción debe ser un texto válido.' })
  @IsOptional()
  description: string;

  @ApiProperty({
    example: '2026-03-15T19:00:00-05:00',
    description: 'Fecha y hora de inicio (ISO 8601)',
  })
  @IsDateString(
    {},
    {
      message:
        'La fecha de inicio debe tener un formato de fecha válido (ISO 8601).',
    },
  )
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria.' })
  startDate: string;

  @ApiProperty({
    example: '2026-03-15T21:00:00-05:00',
    description: 'Fecha y hora de fin (ISO 8601)',
    required: false,
  })
  @IsDateString(
    {},
    {
      message:
        'La fecha de fin debe tener un formato de fecha válido (ISO 8601).',
    },
  )
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    example: 'Auditorio Municipal de Surco',
    description: 'Nombre del lugar',
    required: false,
  })
  @IsString({ message: 'El nombre del lugar debe ser un texto válido.' })
  @IsOptional()
  locationName?: string;

  @ApiProperty({
    example: 'Frente al parque, portón azul',
    description: 'Referencia del lugar',
    required: false,
  })
  @IsString({ message: 'La referencia del lugar debe ser un texto válido.' })
  @IsOptional()
  locationReference?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'La latitud debe ser un número válido.' })
  @Min(-90, { message: 'La latitud mínima es -90.' })
  @Max(90, { message: 'La latitud máxima es 90.' })
  @IsOptional()
  latitude?: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'La longitud debe ser un número válido.' })
  @Min(-180, { message: 'La longitud mínima es -180.' })
  @Max(180, { message: 'La longitud máxima es 180.' })
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    enum: CalendarEventCategory,
    example: CalendarEventCategory.WorshipService,
    description: 'Categoría del evento',
  })
  @IsEnum(CalendarEventCategory, {
    message: 'La categoría del evento no es válida.',
  })
  @IsNotEmpty({ message: 'La categoría del evento es obligatoria.' })
  category: CalendarEventCategory;

  @ApiProperty({
    enum: CalendarEventStatus,
    example: CalendarEventStatus.Draft,
    description: 'Estado del evento',
    required: false,
  })
  @IsEnum(CalendarEventStatus, {
    message: 'El estado del evento no es válido.',
  })
  @IsOptional()
  status?: CalendarEventStatus;

  @ApiProperty({
    enum: CalendarEventTargetGroup,
    isArray: true,
    example: [CalendarEventTargetGroup.General],
    description: 'Grupos destino para notificaciones',
    required: false,
  })
  @IsArray({ message: 'Los grupos destino deben enviarse en un arreglo.' })
  @IsEnum(CalendarEventTargetGroup, {
    each: true,
    message:
      'Cada grupo destino debe ser uno de los siguientes valores: general, youth, leaders, children, women, men, preachers.',
  })
  @IsOptional()
  targetGroups?: CalendarEventTargetGroup[];

  @ApiProperty({
    example: true,
    description: 'Visible en el calendario público',
    required: false,
  })
  @IsBoolean({
    message: 'El campo "isPublic" debe ser verdadero o falso.',
  })
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({
    example: [
      `https://res.cloudinary.com/example/image/upload/v1111737494/calendar-events/x6224doorez3s5vwlvpkh.png`,
      `https://res.cloudinary.com/example/image/upload/v1111737494/calendar-events/x6224doorez3s5vwlvpkh.png`,
    ],
    description: 'URLs de la imágenes',
    required: false,
  })
  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @ApiProperty({
    example: 'uuid-de-la-iglesia',
    description: 'ID de la iglesia vinculada',
    required: false,
  })
  @IsUUID('4', {
    message: 'El ID de la iglesia debe ser un UUID válido.',
  })
  @IsOptional()
  churchId?: string;
}
