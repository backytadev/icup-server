import {
  Get,
  Post,
  Body,
  Query,
  Patch,
  Param,
  Delete,
  Controller,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  CreateSwagger,
  DeleteSwagger,
  FindAllSwagger,
  SearchSwagger,
  UpdateSwagger,
} from '@/common/swagger/swagger.decorator';

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { UserRole } from '@/common/enums/user-role.enum';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

import { User } from '@/modules/user/entities/user.entity';
import { PaginationDto } from '@/common/dtos/pagination.dto';

import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { FamilyGroupService } from '@/modules/family-group/family-group.service';
import { CreateFamilyGroupDto } from '@/modules/family-group/dto/create-family-group.dto';
import { UpdateFamilyGroupDto } from '@/modules/family-group/dto/update-family-group.dto';
import { InactivateFamilyGroupDto } from '@/modules/family-group/dto/inactivate-family-group.dto';
import { FamilyGroupSearchAndPaginationDto } from '@/modules/family-group/dto/family-group-search-and-pagination.dto';

@Controller('family-groups')
@ApiTags('Family Groups')
@ApiBearerAuth()
@SkipThrottle()
export class FamilyGroupController {
  constructor(private readonly familyGroupService: FamilyGroupService) {}

  //* Create
  @Post()
  @Auth(UserRole.SuperUser, UserRole.MembershipUser, UserRole.AdminUser)
  @CreateSwagger({ description: 'Family group created successfully' })
  create(
    @Body() body: CreateFamilyGroupDto,
    @GetUser() user: User,
  ): Promise<FamilyGroup> {
    return this.familyGroupService.create(body, user);
  }

  //* Find all
  @Get()
  @Auth(
    UserRole.SuperUser,
    UserRole.MembershipUser,
    UserRole.AdminUser,
    UserRole.User,
    UserRole.TreasurerUser,
  )
  @FindAllSwagger({ description: 'Family groups retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto): Promise<FamilyGroup[]> {
    return this.familyGroupService.findAll(paginationDto);
  }

  //* Find by filters
  @Get('search')
  @Auth(
    UserRole.SuperUser,
    UserRole.MembershipUser,
    UserRole.AdminUser,
    UserRole.User,
    UserRole.TreasurerUser,
  )
  @SearchSwagger({ description: 'Family groups search completed successfully' })
  findByFilters(
    @Query() query: FamilyGroupSearchAndPaginationDto,
  ): Promise<FamilyGroup[]> {
    return this.familyGroupService.findByFilters(query);
  }

  //* Update
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.MembershipUser, UserRole.AdminUser)
  @UpdateSwagger({
    description: 'Family group updated successfully',
    paramDescription: 'Family group UUID to update',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateFamilyGroupDto,
    @GetUser() user: User,
  ): Promise<FamilyGroup> {
    return this.familyGroupService.update(id, body, user);
  }

  //* Delete
  @Delete(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @DeleteSwagger({
    description: 'Family group deleted successfully',
    paramDescription: 'Family group UUID to delete',
  })
  remove(
    @Param('id') id: string,
    @Query() inactivateFamilyGroupDto: InactivateFamilyGroupDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.familyGroupService.remove(id, inactivateFamilyGroupDto, user);
  }
}
