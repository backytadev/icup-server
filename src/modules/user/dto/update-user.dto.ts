import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, Matches, MaxLength, MinLength } from 'class-validator';

import { CreateUserDto } from '@/modules/user/dto/create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({
    example: 'Abcd1234$',
    description: 'Current password.',
  })
  @IsOptional()
  @MinLength(6)
  @MaxLength(20)
  @Matches(
    /^(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,15}|[0-9]{4,15})$/,
    {
      message:
        'La contraseña debe ser alfanumérica con mayúscula, minúscula y símbolo, o numérica de 4 a 15 dígitos',
    },
  )
  currentPassword?: string;

  @ApiProperty({
    example: 'Abcd1234$',
    description: 'Current password.',
  })
  @IsOptional()
  @MinLength(6)
  @MaxLength(20)
  @Matches(
    /^(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,15}|[0-9]{4,15})$/,
    {
      message:
        'La contraseña debe ser alfanumérica con mayúscula, minúscula y símbolo, o numérica de 4 a 15 dígitos',
    },
  )
  newPassword?: string;
}
