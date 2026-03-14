import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendWspTextDto {
  @ApiProperty({
    example: '51999999999@s.whatsapp.net',
    description: 'Número de teléfono (51999999999) o JID de grupo (xxx@g.us)',
  })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiProperty({
    example: '¡Hola! Mensaje de prueba desde ICUP Server.',
    description: 'Texto del mensaje a enviar',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    example: false,
    description: 'Mencionar a todos los participantes del grupo',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  mentionsEveryOne?: boolean;
}
