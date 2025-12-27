import { Module } from '@nestjs/common';

import { SearchStrategyFactory } from '@/common/strategies/search/search-strategy.factory';

import { AddressSearchStrategy } from '@/common/strategies/search/options/address-search.strategy';
import { OriginCountrySearchStrategy } from '@/common/strategies/search/options/origin-country-search.strategy';
import { ProvinceSearchStrategy } from '@/common/strategies/search/options/province-search.strategy';
import { DistrictSearchStrategy } from '@/common/strategies/search/options/district-search.strategy';
import { DepartmentSearchStrategy } from '@/common/strategies/search/options/department-search.strategy';
import { ChurchNameSearchStrategy } from '@/common/strategies/search/options/church-name-search.strategy';
import { UrbanSectorSearchStrategy } from '@/common/strategies/search/options/urban-sector-search.strategy';
import { FoundingDateSearchStrategy } from '@/common/strategies/search/options/founding-date-search.strategy';
import { MinistryTypeSearchStrategy } from '@/common/strategies/search/options/ministry-type-search.strategy';
import { RecordStatusSearchStrategy } from '@/common/strategies/search/options/record-status-search.strategy';
import { MinistryCustomNameSearchStrategy } from '@/common/strategies/search/options/ministry-custom-name-search.strategy';

import { GenderSearchStrategy } from '@/common/strategies/search/options/gender-search.strategy';
import { CountrySearchStrategy } from '@/common/strategies/search/options/country-search.strategy';
import { LastNameSearchStrategy } from '@/common/strategies/search/options/last-names-search.strategy';
import { FullNameSearchStrategy } from '@/common/strategies/search/options/full-names-search.strategy';
import { BirthDateSearchStrategy } from '@/common/strategies/search/options/birth-date-search.strategy';
import { FirstNameSearchStrategy } from '@/common/strategies/search/options/first-names-search.strategy';
import { BirthMonthSearchStrategy } from '@/common/strategies/search/options/birth-month-search.strategy';
import { MaritalStatusSearchStrategy } from '@/common/strategies/search/options/marital-status-search.strategy';

@Module({
  providers: [
    CountrySearchStrategy,
    OriginCountrySearchStrategy,
    AddressSearchStrategy,
    ProvinceSearchStrategy,
    DistrictSearchStrategy,
    DepartmentSearchStrategy,
    UrbanSectorSearchStrategy,
    FoundingDateSearchStrategy,
    RecordStatusSearchStrategy,

    ChurchNameSearchStrategy,
    ChurchNameSearchStrategy,

    GenderSearchStrategy,
    MaritalStatusSearchStrategy,
    BirthDateSearchStrategy,
    BirthMonthSearchStrategy,

    MinistryTypeSearchStrategy,
    MinistryCustomNameSearchStrategy,

    FirstNameSearchStrategy,
    LastNameSearchStrategy,
    FullNameSearchStrategy,

    SearchStrategyFactory,
  ],
  exports: [SearchStrategyFactory],
})
export class CommonModule {}
