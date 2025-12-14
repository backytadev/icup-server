import {
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
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

import { MinistryService } from '@/modules/ministry/ministry.service';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';

import { CreateMinistryDto } from '@/modules/ministry/dto/create-ministry.dto';
import { UpdateMinistryDto } from '@/modules/ministry/dto/update-ministry.dto';
import { MinistryPaginationDto } from '@/modules/ministry/dto/ministry-pagination.dto';
import { InactivateMinistryDto } from '@/modules/ministry/dto/inactivate-ministry.dto';
import { MinistrySearchAndPaginationDto } from '@/modules/ministry/dto/ministry-search-and-pagination.dto';

@Controller('ministries')
@ApiTags('Ministries')
@ApiBearerAuth()
@SkipThrottle()
export class MinistryController {
  constructor(private readonly ministryService: MinistryService) {}

  //* Create
  @Post()
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @CreateSwagger({ description: 'Ministry created successfully' })
  create(
    @Body() body: CreateMinistryDto,
    @GetUser() user: User,
  ): Promise<Ministry> {
    return this.ministryService.create(body, user);
  }

  //* Find all
  @Get()
  @Auth()
  @FindAllSwagger({ description: 'Ministries retrieved successfully' })
  findAll(@Query() query: MinistryPaginationDto): Promise<Ministry[]> {
    return this.ministryService.findAll(query);
  }

  //* Find by filters
  @Get('search')
  @Auth()
  @SearchSwagger({ description: 'Ministry search completed successfully' })
  findByTerm(
    @Query() query: MinistrySearchAndPaginationDto,
  ): Promise<Ministry[]> {
    return this.ministryService.findByFilters(query);
  }

  //* Update
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @UpdateSwagger({
    description: 'Ministry updated successfully',
    paramDescription: 'Ministry UUID to update',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMinistryDto,
    @GetUser() user: User,
  ): Promise<Ministry> {
    return this.ministryService.update(id, body, user);
  }

  //* Delete
  @Delete(':id')
  @Auth(UserRole.SuperUser)
  @DeleteSwagger({
    description: 'Ministry deleted successfully',
    paramDescription: 'Ministry UUID to delete',
  })
  remove(
    @Param('id') id: string,
    @Query() query: InactivateMinistryDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.ministryService.remove(id, query, user);
  }
}
