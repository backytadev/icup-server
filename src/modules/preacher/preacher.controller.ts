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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import {
  CreateSwagger,
  DeleteSwagger,
  FindAllSwagger,
  SearchSwagger,
  UpdateSwagger,
} from '@/common/swagger/swagger.decorator';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

import { UserRole } from '@/common/enums/user-role.enum';
import { InactivateMemberDto } from '@/common/dtos/inactivate-member.dto';

import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { PreacherService } from '@/modules/preacher/preacher.service';

import { CreatePreacherDto } from '@/modules/preacher/dto/create-preacher.dto';
import { UpdatePreacherDto } from '@/modules/preacher/dto/update-preacher.dto';
import { PreacherPaginationDto } from '@/modules/preacher/dto/preacher-pagination.dto';
import { PreacherSearchAndPaginationDto } from '@/modules/preacher/dto/preacher-search-and-pagination.dto';

import { User } from '@/modules/user/entities/user.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';

@Controller('preachers')
@ApiTags('Preachers')
@ApiBearerAuth()
@SkipThrottle()
export class PreacherController {
  constructor(private readonly preacherService: PreacherService) {}

  //* Create
  @Post()
  @Auth(UserRole.SuperUser, UserRole.AdminUser, UserRole.MembershipUser)
  @CreateSwagger({ description: 'Preacher created successfully' })
  create(
    @Body() body: CreatePreacherDto,
    @GetUser() user: User,
  ): Promise<Preacher> {
    return this.preacherService.create(body, user);
  }

  //* Find all
  @Get()
  @Auth(
    UserRole.SuperUser,
    UserRole.AdminUser,
    UserRole.MembershipUser,
    UserRole.TreasurerUser,
  )
  @FindAllSwagger({ description: 'Preachers retrieved successfully' })
  findAll(@Query() query: PreacherPaginationDto): Promise<Preacher[]> {
    return this.preacherService.findAll(query);
  }

  //* Find by filters
  @Get('search')
  @Auth(UserRole.SuperUser, UserRole.AdminUser, UserRole.MembershipUser)
  @SearchSwagger({ description: 'Preacher search completed successfully' })
  findByFilters(
    @Query() query: PreacherSearchAndPaginationDto,
  ): Promise<Preacher[]> {
    return this.preacherService.findByFilters(query);
  }

  //* Update
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser, UserRole.MembershipUser)
  @UpdateSwagger({
    description: 'Preacher updated successfully',
    paramDescription: 'Preacher UUID to update',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePreacherDto,
    @GetUser() user: User,
  ): Promise<Preacher | Supervisor> {
    return this.preacherService.update(id, body, user);
  }

  //* Delete
  @Delete(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @DeleteSwagger({
    description: 'Preacher deleted successfully',
    paramDescription: 'Preacher UUID to delete',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: InactivateMemberDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.preacherService.remove(id, query, user);
  }
}
