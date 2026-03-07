import { IntersectionType } from '@nestjs/swagger';

import { BasePaginationDto } from '@/common/dtos/base-pagination.dto';
import { MemberPaginationOptionsDto } from '@/common/dtos/member-pagination-options.dto';

export class DisciplePaginationDto extends IntersectionType(
  BasePaginationDto,
  MemberPaginationOptionsDto,
) {}
