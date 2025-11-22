import {
  IsArray,
  IsEmail,
  IsEnum,
  Matches,
  IsString,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { Gender } from '@/common/enums/gender.enum';
import { RecordStatus } from '@/common/enums/record-status.enum';

import { UserInactivationReason } from '@/modules/user/enums/user-inactivation-reason.enum';
import { UserInactivationCategory } from '@/modules/user/enums/user-inactivation-category.enum';

import { UserRole } from '@/modules/auth/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'jorge.villena@icup.com',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Abcd$12345$',
    description: 'Contraseña debe ser fuerte o numérica',
  })
  @MinLength(6)
  @MaxLength(20)
  @Matches(
    /^(?:(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,15}|[0-9]{4,15})$/,
    {
      message:
        'La contraseña debe ser alfanumérica con mayúscula, minúscula y símbolo, o numérica de 4 a 15 dígitos',
    },
  )
  password: string;

  @ApiProperty({
    example: 'jorge10',
  })
  @IsString()
  @MinLength(5)
  userName: string;

  @ApiProperty({
    example: 'Jorge Martin',
  })
  @IsString()
  @MinLength(1)
  firstNames: string;

  @ApiProperty({
    example: 'Villena Sanchez',
  })
  @IsString()
  @MinLength(1)
  lastNames: string;

  @ApiProperty({
    example: Gender.Male,
  })
  @IsEnum(Gender, {
    message:
      'El género debe ser uno de los siguientes valores: Masculino o Femenino',
  })
  gender: string;

  @ApiProperty({
    example: RecordStatus.Active,
  })
  @IsString()
  @IsOptional()
  recordStatus?: string;

  @ApiProperty({
    example: [UserRole.SuperUser, UserRole.TreasurerUser],
  })
  @IsEnum(UserRole, {
    each: true,
    message:
      'Los roles pueden contener los siguientes valores: Super-Usuario, Usuario-Admin., Usuario-Tesor., Usuario.',
  })
  @IsArray()
  @IsNotEmpty()
  roles: string[];

  @ApiProperty({
    example: ['church_id_1', 'church_id_2'],
  })
  @IsArray()
  @IsNotEmpty()
  churches: string[];

  @ApiProperty({
    example: ['ministry_id_1', 'ministry_id_2'],
  })
  @IsArray()
  @IsNotEmpty()
  ministries: string[];

  //! Properties record inactivation (optional)
  @IsOptional()
  @IsEnum(UserInactivationCategory)
  userInactivationCategory?: string;

  @IsOptional()
  @IsEnum(UserInactivationReason)
  userInactivationReason?: string;
}
