import {
  IsEnum,
  IsEmail,
  IsArray,
  IsString,
  // IsBoolean,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import {
  RelationType,
  RelationTypeNames,
} from '@/common/enums/relation-type.enum';
import { Gender } from '@/common/enums/gender.enum';
import { MemberRole } from '@/common/enums/member-role.enum';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { MaritalStatus } from '@/common/enums/marital-status.enum';
import { MinistryAssignment } from '@/common/interfaces/ministry-assignment.interface';
import { MemberInactivationReason } from '@/common/enums/member-inactivation-reason.enum';
import { MemberInactivationCategory } from '@/common/enums/member-inactivation-category.enum';

export class CreateSupervisorDto {
  //* General and Personal info
  @ApiProperty({
    example: 'Rebeca Annet',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  firstNames: string;

  @ApiProperty({
    example: 'Quispe Loayza',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  lastNames: string;

  @ApiProperty({
    example: Gender.Female,
  })
  @IsEnum(Gender, {
    message:
      'El género debe ser uno de los siguientes valores: Masculino o Femenino',
  })
  gender: string;

  @ApiProperty({
    example: MaritalStatus.Married,
  })
  @IsEnum(MaritalStatus, {
    message:
      'El estado civil debe ser uno de los siguientes valores: Soltero(a), Casado(a), Divorciado(a), Viudo(a), Otro.',
  })
  @IsNotEmpty()
  maritalStatus: string;

  @ApiProperty({
    example: 'Perú',
  })
  @IsString()
  @IsNotEmpty()
  originCountry: string;

  @ApiProperty({
    example: '1990/12/23',
  })
  @IsString()
  @IsNotEmpty()
  birthDate: Date;

  @ApiProperty({
    example: '2',
  })
  @IsOptional()
  numberChildren?: number | string;

  @ApiProperty({
    example: '2001/12/23',
  })
  @IsString()
  @IsOptional()
  conversionDate?: Date;

  //* Contact Info
  @ApiProperty({
    example: 'example@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '+51 999333555',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    example: 'Perú',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(15)
  residenceCountry?: string;

  @ApiProperty({
    example: 'Lima',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(15)
  residenceDepartment?: string;

  @ApiProperty({
    example: 'Lima',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(15)
  residenceProvince?: string;

  @ApiProperty({
    example: 'Comas',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  residenceDistrict: string;

  @ApiProperty({
    example: 'Las Lomas',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(30)
  residenceUrbanSector: string;

  @ApiProperty({
    example: 'Jr. Central 123.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(80)
  residenceAddress: string;

  @ApiProperty({
    example: 'A 1 cuadra del parque central.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(150)
  referenceAddress: string;

  //* Roles and Status
  @ApiProperty({
    example: [MemberRole.Supervisor],
  })
  @IsEnum(MemberRole, {
    each: true,
    message:
      'El valor debe ser un rol válido. Solo se permite el rol "Supervisor"',
  })
  @IsArray()
  @IsNotEmpty()
  roles: string[];

  @ApiProperty({
    example: RelationType.OnlyRelatedHierarchicalCover,
  })
  @IsEnum(RelationType, {
    message: `El tipo de relación debe ser uno de lo siguientes valores: ${Object.values(
      RelationTypeNames,
    )
      .map((item) => item)
      .join(', ')} `,
  })
  @IsOptional()
  relationType?: string;

  @ApiProperty({
    example: RecordStatus.Active,
  })
  @IsString()
  @IsEnum(RecordStatus, {
    message:
      'El estado de registro debe ser uno de los siguientes valores: Activo o Inactivo.',
  })
  @IsOptional()
  recordStatus?: string;

  // @ApiProperty({
  //   example: true,
  // })
  // @IsBoolean()
  // isDirectRelationToPastor: boolean;

  //* Relations
  @ApiProperty({
    example: 'cf5a9ee3-cad7-4b73-a331-a5f3f76f6661',
  })
  @IsString()
  @IsOptional()
  theirCopastor?: string;

  @ApiProperty({
    example: 'cf5a9ee3-cad7-4b73-a331-a5f3f76f6661',
  })
  @IsString()
  @IsOptional()
  theirPastor?: string;

  @ApiProperty({
    example: 'cf5a9ee3-cad7-4b73-a331-a5f3f76f6661',
  })
  @IsString()
  @IsOptional()
  theirPastorRelationDirect?: string;

  @ApiProperty({
    example: 'cf5a9ee3-cad7-4b73-a331-a5f3f76f6661',
  })
  @IsString()
  @IsOptional()
  theirPastorOnlyMinistries?: string;

  @ApiProperty({
    description:
      'Listado de ministerios asignados a la persona (discípulo, pastor, predicador, etc.) junto con sus roles dentro de cada ministerio.',
    example: [
      {
        ministryId: '1234567890abcdef2sfs24021a',
        ministryRoles: ['kids_ministry_leader', 'youth_ministry_member'],
      },
    ],
    required: false,
  })
  @IsArray()
  @IsOptional()
  theirMinistries?: MinistryAssignment[];

  //! Properties record inactivation (optional)
  @IsOptional()
  @IsEnum(MemberInactivationCategory)
  memberInactivationCategory?: string;

  @IsOptional()
  @IsEnum(MemberInactivationReason)
  memberInactivationReason?: string;
}
