import { Repository } from 'typeorm';

import { User } from '@/modules/user/entities/user.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';

export interface InactivateEntity {
  entity:
    | Pastor
    | Copastor
    | Supervisor
    | Preacher
    | Disciple
    | Church
    | Ministry;
  user: User;
  entityRepository: Repository<any>;
  extraProps: Record<string, any>;
}
