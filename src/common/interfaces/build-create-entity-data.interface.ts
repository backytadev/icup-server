import { Member } from '@/modules/member/entities/member.entity';
import { User } from '@/modules/user/entities/user.entity';

export interface BuildCreateEntityData {
  user: User;
  extraProps: Record<string, any>;
  member?: Partial<Member>;
}
