import { Injectable, BadRequestException } from '@nestjs/common';

import {
  MemberSearchType,
  MemberSearchTypeNames,
} from '@/common/enums/member-search-type.enum';
import { SearchStrategy } from '@/common/strategies/search/search-strategy.interface';

import { AddressSearchStrategy } from '@/common/strategies/search/options/address-search.strategy';
import { ChurchNameSearchStrategy } from '@/common/strategies/search/options/church-name-search.strategy';
import { FoundingDateSearchStrategy } from '@/common/strategies/search/options/founding-date-search.strategy';
import { DepartmentSearchStrategy } from '@/common/strategies/search/options/department-search.strategy';
import { ProvinceSearchStrategy } from '@/common/strategies/search/options/province-search.strategy';
import { DistrictSearchStrategy } from '@/common/strategies/search/options/district-search.strategy';
import { UrbanSectorSearchStrategy } from '@/common/strategies/search/options/urban-sector-search.strategy';
import { RecordStatusSearchStrategy } from '@/common/strategies/search/options/record-status-search.strategy';
import { OriginCountrySearchStrategy } from '@/common/strategies/search/options/origin-country-search.strategy';
import { MinistryCustomNameSearchStrategy } from '@/common/strategies/search/options/ministry-custom-name-search.strategy';
import { MinistryTypeSearchStrategy } from '@/common/strategies/search/options/ministry-type-search.strategy';
import { FirstNameSearchStrategy } from '@/common/strategies/search/options/first-names-search.strategy';
import { LastNameSearchStrategy } from '@/common/strategies/search/options/last-names-search.strategy';
import { FullNameSearchStrategy } from '@/common/strategies/search/options/full-names-search.strategy';
import { MaritalStatusSearchStrategy } from '@/common/strategies/search/options/marital-status-search.strategy';
import { GenderSearchStrategy } from '@/common/strategies/search/options/gender-search.strategy';
import { BirthDateSearchStrategy } from '@/common/strategies/search/options/birth-date-search.strategy';
import { BirthMonthSearchStrategy } from '@/common/strategies/search/options/birth-month-search.strategy';
import { CountrySearchStrategy } from '@/common/strategies/search/options/country-search.strategy';
import { ZoneNameSearchStrategy } from '@/common/strategies/search/options/zone-name-search.strategy';
import { FamilyGroupCodeSearchStrategy } from '@/common/strategies/search/options/family-group-code-search.strategy';
import { FamilyGroupNameSearchStrategy } from '@/common/strategies/search/options/family-group-name-search.strategy';
import { AvailablePreachersSearchStrategy } from '@/common/strategies/search/options/available-preachers-search.strategy';
import { AvailableSupervisorsSearchStrategy } from '@/common/strategies/search/options/available-supervisors-search.strategy';
import { FamilyGroupLessPopulatedSearchStrategy } from '@/common/strategies/search/options/family-group-less-populated.strategy';
import { FamilyGroupMostPopulatedSearchStrategy } from '@/common/strategies/search/options/family-group-most-populated.strategy';

@Injectable()
export class MemberSearchStrategyFactory {
  private readonly strategies: Map<MemberSearchType, SearchStrategy>;

  constructor(
    churchName: ChurchNameSearchStrategy,
    ministryCustomName: MinistryCustomNameSearchStrategy,
    ministryType: MinistryTypeSearchStrategy,
    foundingDate: FoundingDateSearchStrategy,
    originCountry: OriginCountrySearchStrategy,
    country: CountrySearchStrategy,
    department: DepartmentSearchStrategy,
    province: ProvinceSearchStrategy,
    district: DistrictSearchStrategy,
    urbanSector: UrbanSectorSearchStrategy,
    address: AddressSearchStrategy,
    maritalStatus: MaritalStatusSearchStrategy,
    gender: GenderSearchStrategy,
    birthDate: BirthDateSearchStrategy,
    birthMonth: BirthMonthSearchStrategy,
    recordStatus: RecordStatusSearchStrategy,
    firstNames: FirstNameSearchStrategy,
    lastNames: LastNameSearchStrategy,
    fullNames: FullNameSearchStrategy,
    availableSupervisors: AvailableSupervisorsSearchStrategy,
    availablePreachers: AvailablePreachersSearchStrategy,
    zoneName: ZoneNameSearchStrategy,
    familyGroupMostPopulated: FamilyGroupMostPopulatedSearchStrategy,
    familyGroupLessPopulated: FamilyGroupLessPopulatedSearchStrategy,
    familyGroupCode: FamilyGroupCodeSearchStrategy,
    familyGroupName: FamilyGroupNameSearchStrategy,
  ) {
    this.strategies = new Map<MemberSearchType, SearchStrategy>([
      [MemberSearchType.ChurchName, churchName],
      [MemberSearchType.MinistryCustomName, ministryCustomName],
      [MemberSearchType.MinistryType, ministryType],
      [MemberSearchType.FoundingDate, foundingDate],

      [MemberSearchType.OriginCountry, originCountry],
      [MemberSearchType.Country, country],
      [MemberSearchType.ResidenceCountry, country],
      [MemberSearchType.Department, department],
      [MemberSearchType.ResidenceDepartment, department],
      [MemberSearchType.Province, province],
      [MemberSearchType.ResidenceProvince, province],
      [MemberSearchType.District, district],
      [MemberSearchType.ResidenceDistrict, district],
      [MemberSearchType.UrbanSector, urbanSector],
      [MemberSearchType.ResidenceUrbanSector, urbanSector],
      [MemberSearchType.Address, address],
      [MemberSearchType.ResidenceAddress, address],

      [MemberSearchType.MaritalStatus, maritalStatus],
      [MemberSearchType.Gender, gender],
      [MemberSearchType.BirthDate, birthDate],
      [MemberSearchType.BirthMonth, birthMonth],
      [MemberSearchType.RecordStatus, recordStatus],

      [MemberSearchType.FirstNames, firstNames],
      [MemberSearchType.LastNames, lastNames],
      [MemberSearchType.FullNames, fullNames],

      [MemberSearchType.ZoneName, zoneName],
      [MemberSearchType.AvailablePreachersByZone, availablePreachers],
      [MemberSearchType.AvailableSupervisorsByCopastor, availableSupervisors],
      [MemberSearchType.AvailableSupervisorsByChurch, availableSupervisors],

      [MemberSearchType.MostPopulatedFamilyGroups, familyGroupMostPopulated],
      [MemberSearchType.LessPopulatedFamilyGroups, familyGroupLessPopulated],
      [MemberSearchType.FamilyGroupCode, familyGroupCode],
      [MemberSearchType.FamilyGroupName, familyGroupName],
    ]);
  }

  getStrategy(type: MemberSearchType): SearchStrategy {
    const strategy = this.strategies.get(type);

    if (!strategy) {
      throw new BadRequestException(
        `Tipo de búsqueda no válido: ${MemberSearchTypeNames[type] ?? type}`,
      );
    }

    return strategy;
  }
}
