import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    example: 'usuario1',
  })
  @IsString()
  userName: string;

  @ApiProperty({
    example: 'usuario@google.com',
  })
  @IsString()
  email: string;

  @ApiProperty({
    example: 'Abcd1234$',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  password: string;
}
