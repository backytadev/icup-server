import { Disciple } from '@/modules/disciple/entities/disciple.entity';

interface Options {
  disciples: Disciple[];
}

export const discipleDataFormatter = ({ disciples }: Options) => {
  return disciples.map((disciple) => ({
    ...disciple,
    theirChurch: {
      id: disciple?.theirChurch?.id,
      churchName: disciple?.theirChurch?.churchName,
      abbreviatedChurchName: disciple?.theirChurch?.abbreviatedChurchName,
      district: disciple?.theirChurch?.district,
      urbanSector: disciple?.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: disciple?.theirPastor?.id,
      firstNames: disciple?.theirPastor?.member?.firstNames,
      lastNames: disciple?.theirPastor?.member?.lastNames,
      roles: disciple?.theirPastor?.member?.roles,
    },
    theirCopastor: {
      id: disciple?.theirCopastor?.id,
      firstNames: disciple?.theirCopastor?.member?.firstNames,
      lastNames: disciple?.theirCopastor?.member?.lastNames,
      roles: disciple?.theirCopastor?.member?.roles,
    },
    theirSupervisor: {
      id: disciple?.theirSupervisor?.id,
      firstNames: disciple?.theirSupervisor?.member?.firstNames,
      lastNames: disciple?.theirSupervisor?.member?.lastNames,
      roles: disciple?.theirSupervisor?.member?.roles,
    },
    theirZone: {
      id: disciple?.theirZone?.id,
      zoneName: disciple?.theirZone?.zoneName,
      department: disciple?.theirZone?.department,
      province: disciple?.theirZone?.province,
      district: disciple?.theirZone?.district,
    },
    theirFamilyGroup: {
      id: disciple?.theirFamilyGroup?.id,
      familyGroupName: disciple?.theirFamilyGroup?.familyGroupName,
      familyGroupCode: disciple?.theirFamilyGroup?.familyGroupCode,
      district: disciple?.theirFamilyGroup?.district,
      urbanSector: disciple?.theirFamilyGroup?.urbanSector,
    },
    theirPreacher: {
      id: disciple?.theirPreacher?.id,
      firstNames: disciple?.theirPreacher?.member?.firstNames,
      lastNames: disciple?.theirPreacher?.member?.lastNames,
      roles: disciple?.theirPreacher?.member?.roles,
    },
    member: {
      ...disciple.member,
      ministries: disciple.member.ministries.map((ministry) => ({
        id: ministry?.ministry?.id,
        churchMinistryId: ministry?.ministry?.theirChurch?.id,
        churchMinistryName:
          ministry?.ministry?.theirChurch?.abbreviatedChurchName,
        ministryType: ministry?.ministry?.ministryType,
        customMinistryName: ministry?.ministry?.customMinistryName,
        ministryRoles: ministry?.ministryRoles,
      })),
    },
  }));
};
