import { Copastor } from '@/modules/copastor/entities/copastor.entity';

interface Options {
  copastors: Copastor[];
}

export const copastorDataFormatter = ({ copastors }: Options) => {
  return copastors.map((copastor) => ({
    ...copastor,
    theirChurch: {
      id: copastor?.theirChurch?.id,
      churchName: copastor?.theirChurch?.churchName,
      abbreviatedChurchName: copastor?.theirChurch?.abbreviatedChurchName,
      district: copastor?.theirChurch?.district,
      urbanSector: copastor?.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: copastor?.theirPastor?.id,
      firstNames: copastor?.theirPastor?.member?.firstNames,
      lastNames: copastor?.theirPastor?.member?.lastNames,
      roles: copastor?.theirPastor?.member?.roles,
    },
    supervisors: copastor?.supervisors.map((supervisor) => ({
      id: supervisor?.id,
      firstNames: supervisor?.member?.firstNames,
      lastNames: supervisor?.member?.lastNames,
    })),
    zones: copastor?.zones.map((zone) => ({
      id: zone?.id,
      zoneName: zone?.zoneName,
      district: zone?.district,
    })),
    preachers: copastor?.preachers.map((preacher) => ({
      id: preacher?.id,
      firstNames: preacher?.member?.firstNames,
      lastNames: preacher?.member?.lastNames,
    })),
    familyGroups: copastor?.familyGroups.map((familyGroup) => ({
      id: familyGroup?.id,
      familyGroupName: familyGroup?.familyGroupName,
      familyGroupCode: familyGroup?.familyGroupCode,
      district: familyGroup?.district,
      urbanSector: familyGroup?.urbanSector,
      theirZone: familyGroup.theirZone,
    })),
    disciples: copastor.disciples.map((disciple) => ({
      id: disciple?.id,
      firstNames: disciple?.member?.firstNames,
      lastNames: disciple?.member?.lastNames,
    })),
    member: {
      ...copastor.member,
      ministries: copastor.member?.ministries?.map((ministry) => ({
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
