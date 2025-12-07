import { User } from '@/modules/user/entities/user.entity';
import { UserSearchAndPaginationDto } from '@/modules/user/dto/user-search-and-pagination.dto';

export interface UserSearchStrategy {
  execute(params: UserSearchAndPaginationDto): Promise<User[]>;
}
