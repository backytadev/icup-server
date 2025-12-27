import { FindOptionsWhere, Repository } from 'typeorm';

export interface FindOrFailProps<T> {
  repository: Repository<T>;
  where: FindOptionsWhere<T>;
  relations?: string[];
  select?: (keyof T)[];
  moduleName: string;
}
