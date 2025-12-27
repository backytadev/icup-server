import { Member } from '@/modules/member/entities/member.entity';
import { User } from '@/modules/user/entities/user.entity';

export interface UpdateMinistriesMember {
  entityId: string;
  user: User;
  savedMember?: Partial<Member>;
  extraProps: Record<string, any>;
}
