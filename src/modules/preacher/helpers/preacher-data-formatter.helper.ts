import { Preacher } from '@/modules/preacher/entities/preacher.entity';

interface Options {
  preachers: Preacher[];
}

export const preacherDataFormatter = ({ preachers }: Options) => {
  return preachers.map((preacher) => ({
    ...preacher,
    theirChurch: {
      id: preacher?.theirChurch?.id,
      churchName: preacher?.theirChurch?.churchName,
      abbreviatedChurchName: preacher?.theirChurch?.abbreviatedChurchName,
      district: preacher?.theirChurch?.district,
      urbanSector: preacher?.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: preacher?.theirPastor?.id,
      firstNames: preacher?.theirPastor?.member?.firstNames,
      lastNames: preacher?.theirPastor?.member?.lastNames,
      roles: preacher?.theirPastor?.member?.roles,
    },
    theirCopastor: {
      id: preacher?.theirCopastor?.id,
      firstNames: preacher?.theirCopastor?.member?.firstNames,
      lastNames: preacher?.theirCopastor?.member?.lastNames,
      roles: preacher?.theirCopastor?.member?.roles,
    },
    theirSupervisor: {
      id: preacher?.theirSupervisor?.id,
      firstNames: preacher?.theirSupervisor?.member?.firstNames,
      lastNames: preacher?.theirSupervisor?.member?.lastNames,
      roles: preacher?.theirSupervisor?.member?.roles,
    },
    theirZone: {
      id: preacher?.theirZone?.id,
      zoneName: preacher?.theirZone?.zoneName,
      department: preacher?.theirZone?.department,
      province: preacher?.theirZone?.province,
      district: preacher?.theirZone?.district,
    },
    theirFamilyGroup: {
      id: preacher?.theirFamilyGroup?.id,
      familyGroupName: preacher?.theirFamilyGroup?.familyGroupName,
      familyGroupCode: preacher?.theirFamilyGroup?.familyGroupCode,
      district: preacher?.theirFamilyGroup?.district,
      urbanSector: preacher?.theirFamilyGroup?.urbanSector,
    },
    disciples: preacher?.disciples.map((disciple) => ({
      id: disciple?.id,
      firstNames: disciple?.member?.firstNames,
      lastNames: disciple?.member?.lastNames,
    })),
    member: {
      ...preacher.member,
      ministries: preacher.member?.ministries?.map((ministry) => ({
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
