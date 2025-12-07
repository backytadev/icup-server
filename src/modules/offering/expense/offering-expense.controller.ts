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

import { CreateOfferingExpenseDto } from '@/modules/offering/expense/dto/create-offering-expense.dto';
import { UpdateOfferingExpenseDto } from '@/modules/offering/expense/dto/update-offering-expense.dto';

import { OfferingExpenseSearchType } from '@/modules/offering/expense/enums/offering-expense-search-type.enum';
import { OfferingExpenseSearchSubType } from '@/modules/offering/expense/enums/offering-expense-search-sub-type.enum';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { UserRole } from '@/common/enums/user-role.enum';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

import { User } from '@/modules/user/entities/user.entity';

import { InactivateOfferingDto } from '@/modules/offering/shared/dto/inactivate-offering.dto';

import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';
import { OfferingExpenseService } from '@/modules/offering/expense/offering-expense.service';

@ApiTags('Offering Expenses')
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
@Controller('offering-expenses')
export class OfferingExpenseController {
  constructor(
    private readonly offeringExpenseService: OfferingExpenseService,
  ) {}

  //* CREATE
  @Post()
  @Auth(UserRole.SuperUser, UserRole.TreasurerUser)
  @ApiCreatedResponse({
    description:
      '✅ Successfully created: The record has been successfully created and added to the system.',
  })
  create(
    @Body() createIncomeDto: CreateOfferingExpenseDto,
    @GetUser() user: User,
  ): Promise<OfferingExpense> {
    return this.offeringExpenseService.create(createIncomeDto, user);
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
  findAll(@Query() paginationDto: PaginationDto): Promise<OfferingExpense[]> {
    return this.offeringExpenseService.findAll(paginationDto);
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
    description: 'Search by date or rage date(timestamp).',
    example: '1735707600000+1738299600000',
  })
  @ApiQuery({
    name: 'searchType',
    enum: OfferingExpenseSearchType,
    description: 'Choose one of the types to perform a search.',
    example: OfferingExpenseSearchType.OperationalExpenses,
  })
  @ApiQuery({
    name: 'searchSubType',
    required: false,
    enum: OfferingExpenseSearchSubType,
    description: 'Choose one of the types to perform a search.',
    example: OfferingExpenseSearchSubType.VenueRental,
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
  ): Promise<OfferingExpense[]> {
    return this.offeringExpenseService.findByTerm(
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
    @Body() updateExpenseDto: UpdateOfferingExpenseDto,
    @GetUser() user: User,
  ): Promise<OfferingExpense> {
    return this.offeringExpenseService.update(id, updateExpenseDto, user);
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
    @Query() inactivateOfferingExpenseDto: InactivateOfferingDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.offeringExpenseService.remove(
      id,
      inactivateOfferingExpenseDto,
      user,
    );
  }
}
