import { Injectable } from '@nestjs/common';

import { BaseService } from '@/common/services/base.service';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { User } from '@/modules/user/entities/user.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { CreateOfferingIncomeDto } from '@/modules/offering/income/dto/create-offering-income.dto';
import { UpdateOfferingIncomeDto } from '@/modules/offering/income/dto/update-offering-income.dto';
import { InactivateOfferingDto } from '@/modules/offering/shared/dto/inactivate-offering.dto';
import { OfferingIncomeSearchAndPaginationDto } from '@/modules/offering/income/dto/offering-income-search-and-pagination.dto';

import { OfferingIncomeCreateService } from '@/modules/offering/income/services/offering-income-create.service';
import { OfferingIncomeUpdateService } from '@/modules/offering/income/services/offering-income-update.service';
import { OfferingIncomeRemoveService } from '@/modules/offering/income/services/offering-income-remove.service';
import { OfferingIncomeReadService } from '@/modules/offering/income/services/offering-income-read.service';

@Injectable()
export class OfferingIncomeService extends BaseService {
  constructor(
    private readonly createService: OfferingIncomeCreateService,
    private readonly updateService: OfferingIncomeUpdateService,
    private readonly removeService: OfferingIncomeRemoveService,
    private readonly readService: OfferingIncomeReadService,
  ) {
    super();
  }

  create(dto: CreateOfferingIncomeDto, user: User): Promise<OfferingIncome> {
    return this.createService.create(dto, user);
  }

  findAll(dto: PaginationDto): Promise<any[]> {
    return this.readService.findAll(dto);
  }

  findByFilters(dto: OfferingIncomeSearchAndPaginationDto): Promise<any> {
    return this.readService.findByFilters(dto);
  }

  update(
    id: string,
    dto: UpdateOfferingIncomeDto,
    user: User,
  ): Promise<OfferingIncome> {
    return this.updateService.update(id, dto, user);
  }

  remove(id: string, dto: InactivateOfferingDto, user: User): Promise<void> {
    return this.removeService.remove(id, dto, user);
  }
}
