import { PartialType } from '@nestjs/swagger';
import { CreateMinistryDto } from '@/modules/ministry/dto/create-ministry.dto';

export class UpdateMinistryDto extends PartialType(CreateMinistryDto) {}
