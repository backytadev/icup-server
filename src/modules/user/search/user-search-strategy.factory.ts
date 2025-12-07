import { Injectable, BadRequestException } from '@nestjs/common';
import {
  UserSearchType,
  UserSearchTypeNames,
} from '@/modules/user/enums/user-search-type.enum';

import { FirstNamesSearchStrategy } from '@/modules/user/search/strategies/first-names-search.strategy';
import { LastNamesSearchStrategy } from '@/modules/user/search/strategies/last-names-search.strategy';
import { FullNameSearchStrategy } from '@/modules/user/search/strategies/full-name-search.strategy';
import { GenderSearchStrategy } from '@/modules/user/search/strategies/gender-search.strategy';
import { RolesSearchStrategy } from '@/modules/user/search/strategies/roles-search.strategy';
import { RecordStatusSearchStrategy } from '@/modules/user/search/strategies/record-status-search.strategy';

@Injectable()
export class UserSearchStrategyFactory {
  constructor(
    private readonly firstNames: FirstNamesSearchStrategy,
    private readonly lastNames: LastNamesSearchStrategy,
    private readonly fullName: FullNameSearchStrategy,
    private readonly gender: GenderSearchStrategy,
    private readonly roles: RolesSearchStrategy,
    private readonly recordStatus: RecordStatusSearchStrategy,
  ) {}

  getStrategy(type: UserSearchType) {
    switch (type) {
      case UserSearchType.FirstNames:
        return this.firstNames;
      case UserSearchType.LastNames:
        return this.lastNames;
      case UserSearchType.FullNames:
        return this.fullName;
      case UserSearchType.Gender:
        return this.gender;
      case UserSearchType.Roles:
        return this.roles;
      case UserSearchType.RecordStatus:
        return this.recordStatus;
      default:
        throw new BadRequestException(
          ` Tipos de búsqueda no validos, solo son validos: ${Object.values(UserSearchTypeNames).join(', ')}`,
        );
    }
  }
}
