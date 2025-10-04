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
  savedMember: Member;
  user: User;
}

export async function raiseLevelMinistryMember({
  theirMinistries,
  savedMember,
  ministryRepository,
  ministryMemberRepository,
  user,
}: Options): Promise<MinistryMember[]> {
  const ministryMembers = await Promise.all(
    theirMinistries.map(async (ministryData) => {
      const ministry = await ministryRepository.findOne({
        where: { id: ministryData?.ministryId },
      });

      if (!ministry?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en el Ministerio debe ser "Activo".`,
        );
      }

      const existingMember = await ministryMemberRepository.findOne({
        where: {
          member: { id: savedMember.id },
          ministry: { id: ministry.id },
        },
      });

      if (existingMember) {
        existingMember.ministryRoles = ministryData.ministryRoles;
        existingMember.memberRoles = savedMember.roles;
        existingMember.updatedAt = new Date();
        existingMember.updatedBy = user;
        return existingMember;
      }

      return ministryMemberRepository.create({
        member: savedMember,
        memberRoles: savedMember.roles,
        ministryRoles: ministryData.ministryRoles,
        ministry: ministry,
        createdAt: new Date(),
        createdBy: user,
      });
    }),
  );

  return await ministryMemberRepository.save(ministryMembers.filter(Boolean));
}
