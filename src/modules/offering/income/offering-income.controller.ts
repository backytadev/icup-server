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
import {
  ApiTags,
  ApiQuery,
  ApiParam,
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

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { OfferingIncomeCreationType } from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import { OfferingIncomeCreationSubType } from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';

import { UserRole } from '@/common/enums/user-role.enum';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

import { User } from '@/modules/user/entities/user.entity';
import { InactivateOfferingDto } from '@/modules/offering/shared/dto/inactivate-offering.dto';

import { CreateOfferingIncomeDto } from '@/modules/offering/income/dto/create-offering-income.dto';
import { UpdateOfferingIncomeDto } from '@/modules/offering/income/dto/update-offering-income.dto';

import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { OfferingIncomeService } from '@/modules/offering/income/offering-income.service';

@ApiTags('Offering Income')
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
@Controller('offering-income')
export class OfferingIncomeController {
  constructor(private readonly offeringIncomeService: OfferingIncomeService) {}

  //* CREATE
  @Post()
  @Auth(UserRole.SuperUser, UserRole.TreasurerUser, UserRole.MinistryUser)
  @ApiCreatedResponse({
    description:
      '✅ Successfully created: The record has been successfully created and added to the system.',
  })
  create(
    @Body() createIncomeDto: CreateOfferingIncomeDto,
    @GetUser() user: User,
  ): Promise<OfferingIncome> {
    return this.offeringIncomeService.create(createIncomeDto, user);
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
    name: 'churchId',
    type: 'string',
    description:
      'Unique identifier of the church to be used for filtering or retrieving related records in the search.',
    example: 'b740f708-f19d-4116-82b5-3d7b5653be9b',
    required: false,
  })
  findAll(@Query() paginationDto: PaginationDto): Promise<OfferingIncome[]> {
    return this.offeringIncomeService.findAll(paginationDto);
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
      'Could be range dates(timestamp), shift, first names, last names, etc.',
    example: '1735707600000+1738299600000',
  })
  @ApiQuery({
    name: 'searchType',
    enum: OfferingIncomeCreationType,
    description: 'Choose one of the types to perform a search.',
    example: OfferingIncomeCreationType.Offering,
  })
  @ApiQuery({
    name: 'searchSubType',
    enum: OfferingIncomeCreationSubType,
    description: 'Choose one of the types to perform a search.',
    example: OfferingIncomeCreationSubType.FamilyGroup,
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
  ): Promise<OfferingIncome[]> {
    return this.offeringIncomeService.findByTerm(
      term,
      searchTypeAndPaginationDto,
    );
  }

  //* UPDATE
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.TreasurerUser)
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
      'Unique identifier of the record to be updated. This ID is used to find the existing record to apply the update.',
    example: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOfferingIncomeDto: UpdateOfferingIncomeDto,
    @GetUser() user: User,
  ): Promise<OfferingIncome> {
    return this.offeringIncomeService.update(id, updateOfferingIncomeDto, user);
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
      'Unique identifier of the record to be inactivated. This ID is used to find the existing record to apply the inactivated.',
    example: 'f47c7d13-9d6a-4d9e-bd1e-2cb4b64c0a27',
  })
  remove(
    @Param('id') id: string,
    @Query() inactivateOfferingIncomeDto: InactivateOfferingDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.offeringIncomeService.remove(
      id,
      inactivateOfferingIncomeDto,
      user,
    );
  }
}
