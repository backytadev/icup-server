import { Church } from '@/modules/church/entities/church.entity';
import { FindOptionsOrderValue, Repository } from 'typeorm';

export interface FindSimpleQueryProps<T> {
  mainRepository: Repository<T>;
  churchRepository?: Repository<Church>;
  churchId?: string;
  relations?: string[];
  order: FindOptionsOrderValue;
}

export interface FindDetailedQueryProps<T> {
  mainRepository: Repository<T>;
  churchRepository?: Repository<Church>;
  churchId?: string;
  relations?: string[];
  limit: number;
  offset: number;
  order: FindOptionsOrderValue;
  moduleKey?: string;
  formatterData?: any;
  relationLoadStrategy?: 'join' | 'query';
}
