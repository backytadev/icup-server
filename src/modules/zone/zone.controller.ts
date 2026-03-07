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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
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

import { ZoneService } from '@/modules/zone/zone.service';
import { Zone } from '@/modules/zone/entities/zone.entity';

import { CreateZoneDto } from '@/modules/zone/dto/create-zone.dto';
import { UpdateZoneDto } from '@/modules/zone/dto/update-zone.dto';
import { InactivateZoneDto } from '@/modules/zone/dto/inactivate-zone.dto';
import { ZonePaginationDto } from '@/modules/zone/dto/zone-pagination.dto';
import { ZoneSearchAndPaginationDto } from '@/modules/zone/dto/zone-search-and-pagination.dto';

@Controller('zones')
@ApiTags('Zones')
@ApiBearerAuth()
@SkipThrottle()
export class ZoneController {
  constructor(private readonly zoneService: ZoneService) {}

  //* Create
  @Post()
  @Auth(UserRole.SuperUser, UserRole.AdminUser, UserRole.MembershipUser)
  @CreateSwagger({ description: 'Zone created successfully' })
  create(@Body() body: CreateZoneDto, @GetUser() user: User): Promise<Zone> {
    return this.zoneService.create(body, user);
  }

  //* Find all
  @Get()
  @Auth(
    UserRole.SuperUser,
    UserRole.AdminUser,
    UserRole.MembershipUser,
    UserRole.User,
  )
  @FindAllSwagger({ description: 'Zones retrieved successfully' })
  findAll(@Query() query: ZonePaginationDto): Promise<Zone[]> {
    return this.zoneService.findAll(query);
  }

  //* Find by filters
  @Get('search')
  @Auth(
    UserRole.SuperUser,
    UserRole.AdminUser,
    UserRole.MembershipUser,
    UserRole.User,
  )
  @SearchSwagger({ description: 'Zones search completed successfully' })
  findByFilters(@Query() query: ZoneSearchAndPaginationDto): Promise<Zone[]> {
    return this.zoneService.findByFilters(query);
  }

  //* Update
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser, UserRole.MembershipUser)
  @UpdateSwagger({
    description: 'Zone updated successfully',
    paramDescription: 'Zone UUID to update',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateZoneDto,
    @GetUser() user: User,
  ): Promise<Zone> {
    return this.zoneService.update(id, body, user);
  }

  //* Delete
  @Delete(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @DeleteSwagger({
    description: 'Zone deleted successfully',
    paramDescription: 'Zone UUID to delete',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: InactivateZoneDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.zoneService.remove(id, query, user);
  }
}
