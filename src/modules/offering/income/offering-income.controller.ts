import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

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
  CreateSwagger,
  DeleteSwagger,
  FindAllSwagger,
  SearchSwagger,
  UpdateSwagger,
} from '@/common/swagger/swagger.decorator';

import { UserRole } from '@/common/enums/user-role.enum';
import { Auth } from '@/common/decorators/auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { PaginationDto } from '@/common/dtos/pagination.dto';

import { User } from '@/modules/user/entities/user.entity';
import { InactivateOfferingDto } from '@/modules/offering/shared/dto/inactivate-offering.dto';

import { CreateOfferingIncomeDto } from '@/modules/offering/income/dto/create-offering-income.dto';
import { UpdateOfferingIncomeDto } from '@/modules/offering/income/dto/update-offering-income.dto';
import { OfferingIncomeSearchAndPaginationDto } from '@/modules/offering/income/dto/offering-income-search-and-pagination.dto';

import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { OfferingIncomeService } from '@/modules/offering/income/offering-income.service';

@ApiTags('Offering Income')
@ApiBearerAuth()
@SkipThrottle()
@Controller('offering-income')
export class OfferingIncomeController {
  constructor(private readonly offeringIncomeService: OfferingIncomeService) {}

  //* CREATE
  @Post()
  @Auth(UserRole.SuperUser, UserRole.TreasurerUser, UserRole.AdminUser)
  @CreateSwagger({ description: 'Offering income created successfully' })
  create(
    @Body() createIncomeDto: CreateOfferingIncomeDto,
    @GetUser() user: User,
  ): Promise<OfferingIncome> {
    return this.offeringIncomeService.create(createIncomeDto, user);
  }

  //* FIND ALL
  @Get()
  @Auth(UserRole.SuperUser, UserRole.TreasurerUser, UserRole.AdminUser)
  @FindAllSwagger({ description: 'Offering incomes retrieved successfully' })
  findAll(@Query() paginationDto: PaginationDto): Promise<OfferingIncome[]> {
    return this.offeringIncomeService.findAll(paginationDto);
  }

  //* FIND BY FILTERS
  @Get('search')
  @Auth(UserRole.SuperUser, UserRole.TreasurerUser, UserRole.AdminUser)
  @SearchSwagger({
    description: 'Offering income search completed successfully',
  })
  findByFilters(
    @Query() dto: OfferingIncomeSearchAndPaginationDto,
  ): Promise<OfferingIncome[]> {
    return this.offeringIncomeService.findByFilters(dto);
  }

  //* UPDATE
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.TreasurerUser, UserRole.AdminUser)
  @UpdateSwagger({
    description: 'Offering income updated successfully',
    paramDescription: 'Offering income UUID to update',
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
  @Auth(UserRole.SuperUser, UserRole.TreasurerUser, UserRole.AdminUser)
  @DeleteSwagger({
    description: 'Offering income inactivated successfully',
    paramDescription: 'Offering income UUID to inactivate',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
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
