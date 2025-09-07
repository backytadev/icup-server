import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';

interface Options {
  supervisors: Supervisor[];
}

export const supervisorDataFormatter = ({ supervisors }: Options) => {
  return supervisors.map((supervisor) => ({
    ...supervisor,
    theirChurch: {
      id: supervisor?.theirChurch?.id,
      churchName: supervisor?.theirChurch?.churchName,
      abbreviatedChurchName: supervisor?.theirChurch?.abbreviatedChurchName,
      district: supervisor?.theirChurch?.district,
      urbanSector: supervisor?.theirChurch?.urbanSector,
    },
    theirPastor: {
      id: supervisor?.theirPastor?.id,
      firstNames: supervisor?.theirPastor?.member?.firstNames,
      lastNames: supervisor?.theirPastor?.member?.lastNames,
      roles: supervisor?.theirPastor?.member?.roles,
    },
    theirCopastor: {
      id: supervisor?.theirCopastor?.id,
      firstNames: supervisor?.theirCopastor?.member?.firstNames,
      lastNames: supervisor?.theirCopastor?.member?.lastNames,
      roles: supervisor?.theirCopastor?.member?.roles,
    },
    theirZone: {
      id: supervisor?.theirZone?.id,
      zoneName: supervisor?.theirZone?.zoneName,
      department: supervisor?.theirZone?.department,
      province: supervisor?.theirZone?.province,
      district: supervisor?.theirZone?.district,
    },
    preachers: supervisor?.preachers.map((preacher) => ({
      id: preacher?.id,
      firstNames: preacher?.member?.firstNames,
      lastNames: preacher?.member?.lastNames,
    })),
    familyGroups: supervisor?.familyGroups.map((familyGroup) => ({
      id: familyGroup?.id,
      familyGroupName: familyGroup?.familyGroupName,
      familyGroupCode: familyGroup?.familyGroupCode,
      district: familyGroup?.district,
      urbanSector: familyGroup?.urbanSector,
      theirZone: familyGroup.theirZone,
    })),
    disciples: supervisor?.disciples.map((disciple) => ({
      id: disciple?.id,
      firstNames: disciple?.member?.firstNames,
      lastNames: disciple?.member?.lastNames,
    })),
    member: {
      ...supervisor.member,
      ministries: supervisor?.member?.ministries?.map((ministry) => ({
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
