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
import { CoPastorPaginationDto } from '@/modules/copastor/dto/copastor-pagination.dto';
import { CoPastorSearchAndPaginationDto } from '@/modules/copastor/dto/copastor-search-and-pagination.dto';

import { CopastorService } from '@/modules/copastor/copastor.service';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';

import { CreateCopastorDto } from '@/modules/copastor/dto/create-copastor.dto';
import { UpdateCopastorDto } from '@/modules/copastor/dto/update-copastor.dto';

import { UserRole } from '@/common/enums/user-role.enum';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

import { User } from '@/modules/user/entities/user.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';

@Controller('copastors')
@ApiTags('Co-Pastors')
@ApiBearerAuth()
@SkipThrottle()
export class CopastorController {
  constructor(private readonly copastorService: CopastorService) {}

  //* Create
  @Post()
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @CreateSwagger({ description: 'Co-Pastor created successfully' })
  create(
    @Body() body: CreateCopastorDto,
    @GetUser() user: User,
  ): Promise<Copastor> {
    return this.copastorService.create(body, user);
  }

  //* Find all
  @Get()
  @Auth()
  @FindAllSwagger({ description: 'Co-Pastors retrieved successfully' })
  findAll(@Query() query: CoPastorPaginationDto): Promise<Copastor[]> {
    return this.copastorService.findAll(query);
  }

  //* Find by filters
  @Get('search')
  @Auth()
  @SearchSwagger({ description: 'Co-Pastor search completed successfully' })
  findByFilters(
    @Query() query: CoPastorSearchAndPaginationDto,
  ): Promise<Copastor[]> {
    return this.copastorService.findByFilters(query);
  }

  //* Update
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @UpdateSwagger({
    description: 'Co-Pastor updated successfully',
    paramDescription: 'Co-Pastor UUID to update',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCopastorDto,
    @GetUser() user: User,
  ): Promise<Copastor | Pastor> {
    return this.copastorService.update(id, body, user);
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
    return this.copastorService.remove(id, query, user);
  }
}
