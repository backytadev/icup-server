import { Repository } from 'typeorm';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';

import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';

export interface SearchStrategyProps<T> {
  params: SearchAndPaginationDto; // change to base dto
  church?: Church;
  mainRepository?: Repository<T>;
  churchRepository?: Repository<Church>;
  familyGroupRepository?: Repository<FamilyGroup>;
  zoneRepository?: Repository<Zone>;
  copastorRepository?: Repository<Copastor>;
  personRepository?: Repository<any>;
  relations?: string[];
  relationLoadStrategy?: 'query' | 'join';
  moduleKey?: string;
  computedKey?: string;
  moduleName?: string;
  personName?: string;
  formatterData?: (data: Record<string, any>) => any[];
}
