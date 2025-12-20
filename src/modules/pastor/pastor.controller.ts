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
import { InactivateMemberDto } from '@/common/dtos/inactivate-member.dto';

import { UserRole } from '@/common/enums/user-role.enum';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

import { User } from '@/modules/user/entities/user.entity';

import { PastorService } from '@/modules/pastor/pastor.service';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';

import { CreatePastorDto } from '@/modules/pastor/dto/create-pastor.dto';
import { UpdatePastorDto } from '@/modules/pastor/dto/update-pastor.dto';
import { PastorPaginationDto } from '@/modules/pastor/dto/pastor-pagination.dto';
import { PastorSearchAndPaginationDto } from '@/modules/pastor/dto/pastor-search-and-pagination.dto';

@Controller('pastors')
@ApiTags('Pastors')
@ApiBearerAuth()
@SkipThrottle()
export class PastorController {
  constructor(private readonly pastorService: PastorService) {}

  //* Create
  @Post()
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @CreateSwagger({ description: 'Pastor created successfully' })
  create(
    @Body() body: CreatePastorDto,
    @GetUser() user: User,
  ): Promise<Pastor> {
    return this.pastorService.create(body, user);
  }

  //* Find all
  @Get()
  @Auth()
  @FindAllSwagger({ description: 'Pastors retrieved successfully' })
  findAll(@Query() query: PastorPaginationDto): Promise<Pastor[]> {
    return this.pastorService.findAll(query);
  }

  //* Find by filters
  @Get('search')
  @Auth()
  @SearchSwagger({ description: 'Pastor search completed successfully' })
  findByTerm(@Query() query: PastorSearchAndPaginationDto): Promise<Pastor[]> {
    return this.pastorService.findByFilters(query);
  }

  //* Update
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @UpdateSwagger({
    description: 'Pastor updated successfully',
    paramDescription: 'Pastor UUID to update',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePastorDto,
    @GetUser() user: User,
  ): Promise<Pastor> {
    return this.pastorService.update(id, body, user);
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
    @Query() query: InactivateMemberDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.pastorService.remove(id, query, user);
  }
}
