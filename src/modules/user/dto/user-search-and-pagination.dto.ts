import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { UserSearchType } from '@/modules/user/enums/user-search-type.enum';
import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';

export class UserSearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: UserSearchType,
    description: 'Choose one of the types to perform a search.',
    example: UserSearchType.FirstNames,
  })
  @IsEnum(UserSearchType)
  @IsNotEmpty()
  searchType: UserSearchType;
}

export class UserSearchAndPaginationDto extends IntersectionType(
  UserSearchOptionsDto,
  BaseSearchAndPaginationDto,
) {}
