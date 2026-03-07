import {
  Get,
  Post,
  Body,
  Patch,
  Query,
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

import { InactivateMemberDto } from '@/common/dtos/inactivate-member.dto';

import { UserRole } from '@/common/enums/user-role.enum';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

import { User } from '@/modules/user/entities/user.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';

import { SupervisorService } from '@/modules/supervisor/supervisor.service';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';

import { CreateSupervisorDto } from '@/modules/supervisor/dto/create-supervisor.dto';
import { UpdateSupervisorDto } from '@/modules/supervisor/dto/update-supervisor.dto';
import { SupervisorPaginationDto } from '@/modules/supervisor/dto/supervisor-pagination.dto';
import { SupervisorSearchAndPaginationDto } from '@/modules/supervisor/dto/supervisor-search-and-pagination.dto';

@Controller('supervisors')
@ApiTags('Supervisors')
@ApiBearerAuth()
@SkipThrottle()
export class SupervisorController {
  constructor(private readonly supervisorService: SupervisorService) {}

  //* Create
  @Post()
  @Auth(UserRole.SuperUser, UserRole.AdminUser, UserRole.MembershipUser)
  @CreateSwagger({ description: 'Supervisor created successfully' })
  create(
    @Body() body: CreateSupervisorDto,
    @GetUser() user: User,
  ): Promise<Supervisor> {
    return this.supervisorService.create(body, user);
  }

  //* Find all
  @Get()
  @Auth(
    UserRole.SuperUser,
    UserRole.AdminUser,
    UserRole.MembershipUser,
    UserRole.TreasurerUser,
  )
  @FindAllSwagger({ description: 'Supervisors retrieved successfully' })
  findAll(@Query() query: SupervisorPaginationDto): Promise<Supervisor[]> {
    return this.supervisorService.findAll(query);
  }

  //* Find by filters
  @Get('search')
  @Auth(UserRole.SuperUser, UserRole.AdminUser, UserRole.MembershipUser)
  @SearchSwagger({ description: 'Supervisors search completed successfully' })
  findByFilters(
    @Query() query: SupervisorSearchAndPaginationDto,
  ): Promise<Supervisor[]> {
    return this.supervisorService.findByFilters(query);
  }

  //* UPDATE
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser, UserRole.MembershipUser)
  @UpdateSwagger({
    description: 'Supervisor updated successfully',
    paramDescription: 'Supervisor UUID to update',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateSupervisorDto,
    @GetUser() user: User,
  ): Promise<Supervisor | Copastor> {
    return this.supervisorService.update(id, body, user);
  }

  //* Delete
  @Delete(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @DeleteSwagger({
    description: 'Supervisor deleted successfully',
    paramDescription: 'Supervisor UUID to delete',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: InactivateMemberDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.supervisorService.remove(id, query, user);
  }
}
