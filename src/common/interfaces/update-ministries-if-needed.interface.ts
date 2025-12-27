import { Repository } from 'typeorm';

import { User } from '@/modules/user/entities/user.entity';
import { Member } from '@/modules/member/entities/member.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { MinistryMember } from '@/modules/ministry/entities/ministry-member.entity';

export interface UpdateMinistriesIfNeeded {
  entity: Pastor | Copastor | Supervisor | Preacher | Disciple;
  theirMinistries: any[];
  savedMember: Member;
  user: User;
  ministryRepository: Repository<Ministry>;
  ministryMemberRepository: Repository<MinistryMember>;
}
