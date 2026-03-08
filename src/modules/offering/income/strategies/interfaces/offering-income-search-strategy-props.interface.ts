import { Repository } from 'typeorm';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { OfferingIncomeSearchType } from '@/modules/offering/income/enums/offering-income-search-type.enum';
import { OfferingIncomeSearchSubType } from '@/modules/offering/income/enums/offering-income-search-sub-type.enum';

export interface OfferingIncomeSearchStrategyProps {
  term: string;
  searchType: OfferingIncomeSearchType;
  searchSubType?: OfferingIncomeSearchSubType;
  limit?: number;
  offset?: number;
  order?: string;
  church?: Church;
  offeringIncomeRepository: Repository<OfferingIncome>;
  zoneRepository: Repository<Zone>;
  preacherRepository: Repository<Preacher>;
  supervisorRepository: Repository<Supervisor>;
  familyGroupRepository: Repository<FamilyGroup>;
}
