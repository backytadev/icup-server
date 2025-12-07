import { Injectable, BadRequestException } from '@nestjs/common';

import {
  ChurchSearchType,
  ChurchSearchTypeNames,
} from '@/modules/church/enums/church-search-type.enum';

import { AddressSearchStrategy } from '@/modules/church/search/strategies/address-search.strategy';
import { DistrictSearchStrategy } from '@/modules/church/search/strategies/district-search.strategy';
import { ProvinceSearchStrategy } from '@/modules/church/search/strategies/province-search.strategy';
import { DepartmentSearchStrategy } from '@/modules/church/search/strategies/department-search.strategy';
import { ChurchNameSearchStrategy } from '@/modules/church/search/strategies/church-name-search.strategy';
import { UrbanSectorSearchStrategy } from '@/modules/church/search/strategies/urban-sector-search.strategy';
import { RecordStatusSearchStrategy } from '@/modules/church/search/strategies/record-status-search.strategy';
import { FoundingDateSearchStrategy } from '@/modules/church/search/strategies/founding-date-search.strategy';

@Injectable()
export class ChurchSearchStrategyFactory {
  constructor(
    private readonly churchName: ChurchNameSearchStrategy,
    private readonly foundingDate: FoundingDateSearchStrategy,
    private readonly department: DepartmentSearchStrategy,
    private readonly province: ProvinceSearchStrategy,
    private readonly district: DistrictSearchStrategy,
    private readonly urbanSector: UrbanSectorSearchStrategy,
    private readonly address: AddressSearchStrategy,
    private readonly recordStatus: RecordStatusSearchStrategy,
  ) {}

  getStrategy(type: ChurchSearchType) {
    switch (type) {
      case ChurchSearchType.ChurchName:
        return this.churchName;
      case ChurchSearchType.FoundingDate:
        return this.foundingDate;
      case ChurchSearchType.Department:
        return this.department;
      case ChurchSearchType.Province:
        return this.province;
      case ChurchSearchType.District:
        return this.district;
      case ChurchSearchType.UrbanSector:
        return this.urbanSector;
      case ChurchSearchType.Address:
        return this.address;
      case ChurchSearchType.RecordStatus:
        return this.recordStatus;
      default:
        throw new BadRequestException(
          ` Tipos de búsqueda no validos, solo son validos: ${Object.values(ChurchSearchTypeNames).join(', ')}`,
        );
    }
  }
}
