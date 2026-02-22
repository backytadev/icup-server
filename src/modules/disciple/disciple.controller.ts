import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import {
  Get,
  Body,
  Post,
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

import { InactivateMemberDto } from '@/common/dtos/inactivate-member.dto';
import { UpdateDiscipleDto } from '@/modules/disciple/dto/update-disciple.dto';
import { CreateDiscipleDto } from '@/modules/disciple/dto/create-disciple.dto';
import { DisciplePaginationDto } from '@/modules/disciple/dto/disciple-pagination.dto';
import { DiscipleSearchAndPaginationDto } from '@/modules/disciple/dto/disciple-search-and-pagination.dto';

import { DiscipleService } from '@/modules/disciple/disciple.service';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';

import { UserRole } from '@/common/enums/user-role.enum';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

import { User } from '@/modules/user/entities/user.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';

@Controller('disciples')
@ApiTags('Disciples')
@ApiBearerAuth()
@SkipThrottle()
export class DiscipleController {
  constructor(private readonly discipleService: DiscipleService) {}

  //* Create
  @Post()
  @Auth(UserRole.SuperUser, UserRole.MembershipUser, UserRole.AdminUser)
  @CreateSwagger({ description: 'Disciple created successfully' })
  create(
    @Body() body: CreateDiscipleDto,
    @GetUser() user: User,
  ): Promise<Disciple> {
    return this.discipleService.create(body, user);
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
  @FindAllSwagger({ description: 'Disciples retrieved successfully' })
  findAll(@Query() body: DisciplePaginationDto): Promise<Disciple[]> {
    return this.discipleService.findAll(body);
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
  @SearchSwagger({ description: 'Disciples search completed successfully' })
  findByFilters(
    @Query() query: DiscipleSearchAndPaginationDto,
  ): Promise<Disciple[]> {
    return this.discipleService.findByFilters(query);
  }

  //* Update
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.MembershipUser, UserRole.AdminUser)
  @UpdateSwagger({
    description: 'Disciple updated successfully',
    paramDescription: 'Disciple UUID to update',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateDiscipleDto,
    @GetUser() user: User,
  ): Promise<Disciple | Preacher> {
    return this.discipleService.update(id, body, user);
  }

  //* Delete
  @Delete(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @DeleteSwagger({
    description: 'Disciple deleted successfully',
    paramDescription: 'Disciple UUID to delete',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: InactivateMemberDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.discipleService.remove(id, query, user);
  }
}
