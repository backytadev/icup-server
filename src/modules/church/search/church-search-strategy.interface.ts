import { Church } from '@/modules/church/entities/church.entity';
import { ChurchSearchAndPaginationDto } from '@/modules/church/dto/church-search-and-pagination.dto';

export interface ChurchSearchStrategy {
  execute(params: ChurchSearchAndPaginationDto): Promise<Church[]>;
}
