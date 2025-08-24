import { Ministry } from '@/modules/ministry/entities/ministry.entity';

export interface Options {
  ministries: Ministry[];
}

export const ministryDataFormatter = ({ ministries }: Options) => {
  return ministries.map((ministry) => ({
    ...ministry,
    theirChurch: {
      id: ministry?.theirChurch?.id,
      churchName: ministry?.theirChurch?.churchName,
      abbreviatedChurchName: ministry?.theirChurch?.abbreviatedChurchName,
      district: ministry?.theirChurch?.district,
      urbanSector: ministry?.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: ministry?.theirPastor?.id,
      firstNames: ministry?.theirPastor?.member?.firstNames,
      lastNames: ministry?.theirPastor?.member?.lastNames,
      roles: ministry?.theirPastor?.member?.roles,
    },
    leaders: ministry?.members
      .filter((member) =>
        member.ministryRoles.some(
          (role) => role.includes('leader') && !role.includes('co_leader'),
        ),
      )
      .map((member) => ({
        id: member?.id,
        memberInfo: {
          id: member?.member?.id,
          firstNames: member?.member?.firstNames,
          lastNames: member?.member?.lastNames,
        },
        memberRoles: member?.memberRoles,
        ministryRoles: member?.ministryRoles,
      })),
    coLeaders: ministry?.members
      .filter((member) =>
        member.ministryRoles.some((role) => role.includes('co_leader')),
      )
      .map((member) => ({
        id: member?.id,
        memberInfo: {
          id: member?.member?.id,
          firstNames: member?.member?.firstNames,
          lastNames: member?.member?.lastNames,
        },
        memberRoles: member?.memberRoles,
        ministryRoles: member?.ministryRoles,
      })),
    members: ministry?.members
      .filter((member) =>
        member.ministryRoles.some((role) => role.includes('member')),
      )
      .map((member) => ({
        id: member?.id,
        memberInfo: {
          id: member?.member?.id,
          firstNames: member?.member?.firstNames,
          lastNames: member?.member?.lastNames,
        },
        memberRoles: member?.memberRoles,
        ministryRoles: member?.ministryRoles,
      })),
  }));
};
