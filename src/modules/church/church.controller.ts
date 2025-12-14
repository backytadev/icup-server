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
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

import {
  CreateSwagger,
  DeleteSwagger,
  FindAllSwagger,
  SearchSwagger,
  UpdateSwagger,
} from '@/common/swagger/swagger.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

import { User } from '@/modules/user/entities/user.entity';

import { ChurchService } from '@/modules/church/church.service';
import { Church } from '@/modules/church/entities/church.entity';

import { CreateChurchDto } from '@/modules/church/dto/create-church.dto';
import { UpdateChurchDto } from '@/modules/church/dto/update-church.dto';
import { InactivateChurchDto } from '@/modules/church/dto/inactivate-church.dto';
import { ChurchPaginationDto } from '@/modules/church/dto/church-pagination.dto';
import { ChurchSearchAndPaginationDto } from '@/modules/church/dto/church-search-and-pagination.dto';

@Controller('churches')
@ApiTags('Churches')
@ApiBearerAuth()
@SkipThrottle()
export class ChurchController {
  constructor(private readonly churchService: ChurchService) {}

  //* Create
  @Post()
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @CreateSwagger({ description: 'Church created successfully' })
  create(
    @Body() body: CreateChurchDto,
    @GetUser() user: User,
  ): Promise<Church> {
    return this.churchService.create(body, user);
  }

  //* Find main church
  @Get('main-church')
  @Auth()
  @FindAllSwagger({ description: 'Main church retrieved successfully' })
  findMainChurch(@Query() query: ChurchPaginationDto): Promise<Church[]> {
    return this.churchService.findMainChurch(query);
  }

  //* Find all
  @Get()
  @Auth()
  @FindAllSwagger({ description: 'Churches retrieved successfully' })
  findAll(@Query() query: ChurchPaginationDto): Promise<Church[]> {
    return this.churchService.findAll(query);
  }

  //* Find by filters
  @Get('search')
  @Auth()
  @SearchSwagger({ description: 'Church search completed successfully' })
  findByTerm(@Query() query: ChurchSearchAndPaginationDto): Promise<Church[]> {
    return this.churchService.findByFilters(query);
  }

  //* Update
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @UpdateSwagger({
    description: 'Church updated successfully',
    paramDescription: 'Church UUID to update',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateChurchDto,
    @GetUser() user: User,
  ): Promise<Church> {
    return this.churchService.update(id, body, user);
  }

  //* Delete
  @Delete(':id')
  @Auth(UserRole.SuperUser)
  @DeleteSwagger({
    description: 'Church deleted successfully',
    paramDescription: 'Church UUID to delete',
  })
  remove(
    @Param('id') id: string,
    @Query() query: InactivateChurchDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.churchService.remove(id, query, user);
  }
}
