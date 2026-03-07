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

import { CreateOfferingExpenseDto } from '@/modules/offering/expense/dto/create-offering-expense.dto';
import { UpdateOfferingExpenseDto } from '@/modules/offering/expense/dto/update-offering-expense.dto';
import { OfferingExpenseSearchAndPaginationDto } from '@/modules/offering/expense/dto/offering-expense-search-and-pagination.dto';

import { PaginationDto } from '@/common/dtos/pagination.dto';

import { UserRole } from '@/common/enums/user-role.enum';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';

import { User } from '@/modules/user/entities/user.entity';

import { InactivateOfferingDto } from '@/modules/offering/shared/dto/inactivate-offering.dto';

import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';
import { OfferingExpenseService } from '@/modules/offering/expense/offering-expense.service';

@ApiTags('Offering Expenses')
@ApiBearerAuth()
@SkipThrottle()
@Controller('offering-expenses')
export class OfferingExpenseController {
  constructor(
    private readonly offeringExpenseService: OfferingExpenseService,
  ) {}

  //* CREATE
  @Post()
  @Auth(UserRole.SuperUser, UserRole.TreasurerUser, UserRole.AdminUser)
  @CreateSwagger({ description: 'Offering expense created successfully' })
  create(
    @Body() createIncomeDto: CreateOfferingExpenseDto,
    @GetUser() user: User,
  ): Promise<OfferingExpense> {
    return this.offeringExpenseService.create(createIncomeDto, user);
  }

  //* FIND ALL
  @Get()
  @Auth(UserRole.SuperUser, UserRole.TreasurerUser, UserRole.AdminUser)
  @FindAllSwagger({ description: 'Offering expenses retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto): Promise<OfferingExpense[]> {
    return this.offeringExpenseService.findAll(paginationDto);
  }

  //* FIND BY FILTERS
  @Get('search')
  @Auth(UserRole.SuperUser, UserRole.TreasurerUser, UserRole.AdminUser)
  @SearchSwagger({
    description: 'Offering expenses search completed successfully',
  })
  findByFilters(
    @Query() searchAndPaginationDto: OfferingExpenseSearchAndPaginationDto,
  ): Promise<OfferingExpense[]> {
    return this.offeringExpenseService.findByFilters(searchAndPaginationDto);
  }

  //* UPDATE
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.TreasurerUser, UserRole.AdminUser)
  @UpdateSwagger({
    description: 'Offering expense updated successfully',
    paramDescription: 'Offering expense UUID to update',
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
  @Auth(UserRole.SuperUser, UserRole.TreasurerUser, UserRole.AdminUser)
  @DeleteSwagger({
    description: 'Offering expense inactivated successfully',
    paramDescription: 'Offering expense UUID to inactivate',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
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
