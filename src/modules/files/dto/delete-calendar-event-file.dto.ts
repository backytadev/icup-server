import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class DeleteCalendarEventFileDto {
  @ApiProperty({
    example: 'calendar-events/',
    description: 'Folder path required for image deletion in Cloudinary.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  path: string;
}
