import {
  IsArray,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateMemberDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsString()
  dateOfBirth: string | Date;

  @IsNumber()
  @IsOptional()
  age?: number;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsIn(['Male', 'Female'])
  genero: string;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  numberChildren?: number;

  @IsIn(['Single', 'Married', 'Widowed', 'Divorced', 'other'])
  maritalStatus: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  dateJoinig?: string | Date;

  @IsString()
  nationality: string;

  @IsString({ each: true }) // cada uno de los elementos del array tiene que ser string
  @IsArray()
  roles: string[];
}
