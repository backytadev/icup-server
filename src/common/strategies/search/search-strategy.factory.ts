import { Injectable, BadRequestException } from '@nestjs/common';

import { SearchType, SearchTypeNames } from '@/common/enums/search-types.enum';

import { AddressSearchStrategy } from '@/common/strategies/search/options/address-search.strategy';
import { ChurchNameSearchStrategy } from '@/common/strategies/search/options/church-name-search.strategy';
import { FoundingDateSearchStrategy } from '@/common/strategies/search/options/founding-date-search.strategy';
import { DepartmentSearchStrategy } from '@/common/strategies/search/options/department-search.strategy';
import { ProvinceSearchStrategy } from '@/common/strategies/search/options/province-search.strategy';
import { DistrictSearchStrategy } from '@/common/strategies/search/options/district-search.strategy';
import { UrbanSectorSearchStrategy } from '@/common/strategies/search/options/urban-sector-search.strategy';
import { RecordStatusSearchStrategy } from '@/common/strategies/search/options/record-status-search.strategy';
import { CountrySearchStrategy } from '@/common/strategies/search/options/country-search.strategy';
import { MinistryCustomNameSearchStrategy } from '@/common/strategies/search/options/ministry-custom-name-search.strategy';
import { MinistryTypeSearchStrategy } from '@/common/strategies/search/options/ministry-type-search.strategy';
import { FirstNameSearchStrategy } from '@/common/strategies/search/options/first-names-search.strategy';
import { LastNameSearchStrategy } from '@/common/strategies/search/options/last-names-search.strategy';
import { FullNameSearchStrategy } from '@/common/strategies/search/options/full-names-search.strategy';

@Injectable()
export class SearchStrategyFactory {
  constructor(
    private readonly churchName: ChurchNameSearchStrategy,
    private readonly ministryCustomName: MinistryCustomNameSearchStrategy,
    private readonly ministryType: MinistryTypeSearchStrategy,
    private readonly foundingDate: FoundingDateSearchStrategy,
    private readonly country: CountrySearchStrategy,
    private readonly department: DepartmentSearchStrategy,
    private readonly province: ProvinceSearchStrategy,
    private readonly district: DistrictSearchStrategy,
    private readonly urbanSector: UrbanSectorSearchStrategy,
    private readonly address: AddressSearchStrategy,
    private readonly recordStatus: RecordStatusSearchStrategy,

    private readonly firstNames: FirstNameSearchStrategy,
    private readonly lastNames: LastNameSearchStrategy,
    private readonly fullNames: FullNameSearchStrategy,
  ) {}

  getStrategy(type: SearchType) {
    switch (type) {
      case SearchType.ChurchName:
        return this.churchName;
      case SearchType.MinistryCustomName:
        return this.ministryCustomName;
      case SearchType.MinistryType:
        return this.ministryType;
      case SearchType.MinistryCustomName:
        return this.ministryCustomName;
      case SearchType.FoundingDate:
        return this.foundingDate;
      case SearchType.Country || SearchType.ResidenceCountry:
        return this.country;
      case SearchType.Department || SearchType.ResidenceDepartment:
        return this.department;
      case SearchType.Province || SearchType.ResidenceProvince:
        return this.province;
      case SearchType.District || SearchType.ResidenceDistrict:
        return this.district;
      case SearchType.UrbanSector || SearchType.ResidenceUrbanSector:
        return this.urbanSector;
      case SearchType.Address || SearchType.ResidenceAddress:
        return this.address;
      case SearchType.RecordStatus:
        return this.recordStatus;

      case SearchType.FirstNames:
        return this.firstNames;
      case SearchType.LastNames:
        return this.lastNames;
      case SearchType.FullNames:
        return this.fullNames;

      default:
        throw new BadRequestException(
          `Tipos de búsqueda no validos, solo son validos: ${Object.values(SearchTypeNames).join(', ')}`,
        );
    }
  }
}
