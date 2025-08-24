import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { MinistryInactivationReason } from '@/modules/ministry/enums/ministry-inactivation-reason.enum';
import { MinistryInactivationCategory } from '@/modules/ministry/enums/ministry-inactivation-category.enum';

export class InactivateMinistryDto {
  @ApiProperty({
    enum: MinistryInactivationCategory,
    example: MinistryInactivationCategory.LeadershipIssues,
    description:
      'The category that defines the reason for the ministry inactivation, such as financial challenges, low attendance, or other operational issues.',
  })
  @IsNotEmpty()
  @IsEnum(MinistryInactivationCategory)
  ministryInactivationCategory: string;

  @ApiProperty({
    enum: MinistryInactivationReason,
    example: MinistryInactivationReason.LeaderResignation,
    description:
      'The specific reason for the removal or inactivation of a ministry, such as financial infeasibility, lack of resources, or other related factors.',
  })
  @IsNotEmpty()
  @IsEnum(MinistryInactivationReason)
  ministryInactivationReason: string;
}
