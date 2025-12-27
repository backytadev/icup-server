import { Repository } from 'typeorm';

import { Member } from '@/modules/member/entities/member.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';

export interface UpdateEntityMember {
  entity: Pastor | Copastor | Supervisor | Preacher | Disciple;
  mustUpdateMember: boolean;
  dto: any;
  memberRepository: Repository<Member>;
}
