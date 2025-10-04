import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

import { MinistryAssignment } from '@/common/interfaces/ministry-assignment.interface';

import { User } from '@/modules/user/entities/user.entity';
import { Member } from '@/modules/member/entities/member.entity';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { MinistryMember } from '@/modules/ministry/entities/ministry-member.entity';

export interface Options {
  theirMinistries: MinistryAssignment[];
  ministryRepository: Repository<Ministry>;
  ministryMemberRepository: Repository<MinistryMember>;
  newMember: Member;
  user: User;
}

export async function createMinistryMember({
  theirMinistries,
  ministryRepository,
  ministryMemberRepository,
  newMember,
  user,
}: Options): Promise<MinistryMember[]> {
  const ministryMembers = await Promise.all(
    theirMinistries.map(async (ministryData) => {
      const ministry = await ministryRepository.findOne({
        where: { id: ministryData.ministryId },
      });

      if (!ministry) {
        throw new BadRequestException(
          `El ministerio con ID ${ministryData.ministryId} no existe.`,
        );
      }

      if (!ministry?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en el Ministerio debe ser "Activo".`,
        );
      }

      return ministryMemberRepository.create({
        member: newMember,
        memberRoles: newMember.roles,
        ministryRoles: ministryData.ministryRoles,
        ministry,
        createdAt: new Date(),
        createdBy: user,
      });
    }),
  );

  return await ministryMemberRepository.save(ministryMembers);
}
