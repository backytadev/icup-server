import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';

import { MinistryAssignment } from '@/common/interfaces/ministry-assignment.interface';

export interface Options {
  theirMinistries: MinistryAssignment[];
  memberEntity: Disciple | Preacher | Supervisor | Copastor | Pastor;
}

export function validationExistsChangesMinistryMember({
  theirMinistries,
  memberEntity,
}: Options): boolean {
  const existingMinistryIds =
    memberEntity.member?.ministries?.map((m) => m.ministry.id) ?? [];
  const newMinistryIds = theirMinistries.map((m) => m.ministryId);

  const hasChangesInMinistries =
    theirMinistries.some((newMinistry) => {
      const existing = memberEntity.member?.ministries?.find(
        (m) => m.ministry.id === newMinistry.ministryId,
      );

      if (!existing) return true;

      const existingRoles = [...existing.ministryRoles].sort();
      const newRoles = [...newMinistry.ministryRoles].sort();

      return (
        existingRoles.length !== newRoles.length ||
        existingRoles.some((role, idx) => role !== newRoles[idx])
      );
    }) || existingMinistryIds.some((id) => !newMinistryIds.includes(id));

  return hasChangesInMinistries;
}
