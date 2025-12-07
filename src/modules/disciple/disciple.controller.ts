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
  ApiTags,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { InactivateMemberDto } from '@/common/dtos/inactivate-member.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { UpdateDiscipleDto } from '@/modules/disciple/dto/update-disciple.dto';
import { CreateDiscipleDto } from '@/modules/disciple/dto/create-disciple.dto';

import { DiscipleSearchType } from '@/modules/disciple/enums/disciple-search-type.enum';
import { DiscipleSearchSubType } from '@/modules/disciple/enums/disciple-search-sub-type.enum';

import { UserRole } from '@/common/enums/user-role.enum';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

import { User } from '@/modules/user/entities/user.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';

import { DiscipleService } from '@/modules/disciple/disciple.service';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';

@ApiTags('Disciples')
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
@Controller('disciples')
export class DiscipleController {
  constructor(private readonly discipleService: DiscipleService) {}

  //* CREATE
  @Post()
  @Auth(UserRole.SuperUser, UserRole.AdminUser)
  @ApiCreatedResponse({
    description:
      '✅ Successfully created: The disciple has been successfully created and added to the system.',
  })
  create(
    @Body() createDiscipleDto: CreateDiscipleDto,
    @GetUser() user: User,
  ): Promise<Disciple> {
    return this.discipleService.create(createDiscipleDto, user);
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
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  findAll(@Query() paginationDto: PaginationDto): Promise<Disciple[]> {
    return this.discipleService.findAll(paginationDto);
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
      'Could be first names, last names birth date, gender, country, department, address, record status, etc.',
    example: 'Rolando Martin',
  })
  @ApiQuery({
    name: 'searchType',
    enum: DiscipleSearchType,
    description: 'Choose one of the types to perform a search.',
    example: DiscipleSearchType.FirstNames,
  })
  @ApiQuery({
    name: 'searchSubType',
    enum: DiscipleSearchSubType,
    required: false,
    description: 'Choose one of the types to perform a search.',
    example: DiscipleSearchSubType.DiscipleByPastorFirstNames,
  })
  @ApiQuery({
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  findByTerm(
    @Param('term') term: string,
    @Query() searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<Disciple[]> {
    return this.discipleService.findByTerm(term, searchTypeAndPaginationDto);
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
      'Unique identifier of the disciple to be updated. This ID is used to find the existing record to apply the update.',
    example: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDiscipleDto: UpdateDiscipleDto,
    @GetUser() user: User,
  ): Promise<Disciple | Preacher> {
    return this.discipleService.update(id, updateDiscipleDto, user);
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
      'Unique identifier of the disciple to be inactivated. This ID is used to find the existing record to apply the inactivated.',
    example: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() inactivateMemberDto: InactivateMemberDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.discipleService.remove(id, inactivateMemberDto, user);
  }
}
