import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';

import {
  ApiTags,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { User } from '@/modules/user/entities/user.entity';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { UserRole } from '@/modules/auth/enums/user-role.enum';
import { Auth } from '@/modules/auth/decorators/auth.decorator';
import { GetUser } from '@/modules/auth/decorators/get-user.decorator';

import { MinistrySearchType } from '@/modules/ministry/enums/ministry-search-type.enum';

import { MinistryService } from '@/modules/ministry/ministry.service';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { CreateMinistryDto } from '@/modules/ministry/dto/create-ministry.dto';
import { UpdateMinistryDto } from '@/modules/ministry/dto/update-ministry.dto';
import { InactivateMinistryDto } from '@/modules/ministry/dto/inactivate-ministry.dto';

@ApiTags('Ministries')
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description:
    '🔒 Unauthorized: Missing or invalid Bearer Token. Please provide a valid token to access this resource.',
})
@ApiInternalServerErrorResponse({
  description:
    '🚨 Internal Server Error: An unexpected error occurred on the server. Please check the server logs for more details.',
})
@ApiBadRequestResponse({
  description:
    '❌ Bad Request: The request contains invalid data or parameters. Please verify the input and try again.',
})
@ApiForbiddenResponse({
  description:
    '🚫 Forbidden: You do not have the necessary permissions to access this resource.',
})
@SkipThrottle()
@Controller('ministries')
export class MinistryController {
  constructor(private readonly ministryService: MinistryService) {}

  //* CREATE
  @Post()
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @ApiCreatedResponse({
    description:
      '✅ Successfully created: The church has been successfully created and added to the system.',
  })
  create(
    @Body() ministryChurchDto: CreateMinistryDto,
    @GetUser() user: User,
  ): Promise<Ministry> {
    return this.ministryService.create(ministryChurchDto, user);
  }

  //* FIND ALL
  @Get()
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Successfully completed: The operation was completed successfully and the response contains the requested data.',
  })
  @ApiNotFoundResponse({
    description:
      '❓ Not Found: The requested resource was not found. Please verify the provided parameters or URL.',
  })
  @ApiQuery({
    name: 'isSimpleQuery',
    example: 'false',
    required: false,
    type: 'boolean',
    description:
      'Specifies whether the query should be simple (without loading relations) or full (including relations).',
  })
  findAll(@Query() paginationDto: PaginationDto): Promise<Ministry[]> {
    return this.ministryService.findAll(paginationDto);
  }

  //* FIND BY TERM
  @Get(':term')
  @Auth()
  @ApiOkResponse({
    description:
      '✅ Successfully completed: The operation was completed successfully and the response contains the requested data.',
  })
  @ApiNotFoundResponse({
    description:
      '❓ Not Found: The requested resource was not found. Please verify the provided parameters or URL.',
  })
  @ApiParam({
    name: 'term',
    description:
      'Could be name church, date or range date, country, department, address, record status, etc.',
    example: 'Ministerio - Juvenil',
  })
  @ApiQuery({
    name: 'searchType',
    enum: MinistrySearchType,
    description: 'Choose one of the types to perform a search.',
    example: MinistrySearchType.MinistryType,
  })
  findByTerm(
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<Ministry[]> {
    return this.ministryService.findByTerm(term, searchTypeAndPaginationDto);
  }

  //* UPDATE
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @ApiOkResponse({
    description:
      '✅ Successfully completed: The resource was successfully updated. The updated data is returned in the response.',
  })
  @ApiNotFoundResponse({
    description:
      '❓ Not Found: The requested resource was not found. Please verify the provided parameters or URL.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Unique identifier of the church to be updated. This ID is used to find the existing record to apply the update.',
    example: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateChurchDto: UpdateMinistryDto,
    @GetUser() user: User,
  ): Promise<Ministry> {
    return this.ministryService.update(id, updateChurchDto, user);
  }

  //! INACTIVATE
  @Delete(':id')
  @Auth(UserRole.SuperUser)
  @ApiOkResponse({
    description:
      '✅ Successfully completed: The resource was successfully deleted. No content is returned.',
  })
  @ApiNotFoundResponse({
    description:
      '❓ Not Found: The requested resource was not found. Please verify the provided parameters or URL.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Unique identifier of the church to be inactivated. This ID is used to find the existing record to apply the inactivated.',
    example: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
  })
  remove(
    @Param('id') id: string,
    @Query() ministryInactivationDto: InactivateMinistryDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.ministryService.remove(id, ministryInactivationDto, user);
  }
}
