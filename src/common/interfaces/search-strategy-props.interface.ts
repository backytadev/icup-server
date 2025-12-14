import { Repository } from 'typeorm';

import { Church } from '@/modules/church/entities/church.entity';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

export interface SearchStrategyProps<T> {
  params: SearchAndPaginationDto;
  church?: Church;
  mainRepository?: Repository<T>;
  personRepository?: Repository<any>;
  relations?: string[];
  relationLoadStrategy?: 'query' | 'join';
  moduleKey?: string;
  computedKey?: string;
  moduleName?: string;
  personName?: string;
  formatterData?: any;
}
