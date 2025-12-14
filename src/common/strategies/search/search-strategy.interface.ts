import { SearchStrategyProps } from '@/common/interfaces/search-strategy-props.interface';

export interface SearchStrategy {
  execute<T>({
    params,
    church,
    mainRepository,
    relations,
    moduleKey,
    formatterData,
    relationLoadStrategy,
  }: SearchStrategyProps<T>): Promise<T[]>;
}
