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
  FindAllSwagger,
  SearchSwagger,
  UpdateSwagger,
  DeleteSwagger,
} from '@/common/swagger/swagger.decorator';
import { PaginationDto } from '@/common/dtos/pagination.dto';

import { UserRole } from '@/common/enums/user-role.enum';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

import { User } from '@/modules/user/entities/user.entity';
import { UserService } from '@/modules/user/user.service';

import { CreateUserDto } from '@/modules/user/dto/create-user.dto';
import { UpdateUserDto } from '@/modules/user/dto/update-user.dto';
import { InactivateUserDto } from '@/modules/user/dto/inactivate-user.dto';
import { UserSearchAndPaginationDto } from '@/modules/user/dto/user-search-and-pagination.dto';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
@SkipThrottle()
export class UserController {
  constructor(private readonly userService: UserService) {}

  //* Create
  @Post()
  @Auth(UserRole.SuperUser)
  @CreateSwagger({ description: 'User created successfully' })
  registerUser(@Body() body: CreateUserDto, @GetUser() user: User) {
    return this.userService.create(body, user);
  }

  //* Find all
  @Get()
  @Auth()
  @FindAllSwagger({ description: 'Users retrieved successfully' })
  findAll(@Query() query: PaginationDto): Promise<User[]> {
    return this.userService.findAll(query);
  }

  //* Find by filters
  @Get('search')
  @Auth()
  @SearchSwagger({ description: 'User search completed successfully' })
  findByFilters(@Query() query: UserSearchAndPaginationDto): Promise<User[]> {
    return this.userService.findByFilters(query);
  }

  //* Update
  @Patch(':id')
  @Auth(UserRole.SuperUser)
  @UpdateSwagger({
    description: 'User updated successfully',
    paramDescription: 'User UUID to update',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateUserDto,
    @GetUser() user: User,
  ): Promise<User> {
    return this.userService.update(id, body, user);
  }

  //* Delete
  @Delete(':id')
  @Auth(UserRole.SuperUser)
  @DeleteSwagger({
    description: 'User deleted successfully',
    paramDescription: 'User UUID to delete',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: InactivateUserDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.userService.delete(id, query, user);
  }
}
