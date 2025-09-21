import { Church } from '@/modules/church/entities/church.entity';

export interface Options {
  churches: Church[];
  mainChurch?: Church;
}

export const churchDataFormatter = ({ churches, mainChurch }: Options) => {
  return churches?.map((church) => ({
    ...church,
    theirMainChurch: church.isAnexe
      ? {
          id: mainChurch?.id,
          churchName: mainChurch?.churchName,
          abbreviatedChurchName: mainChurch?.abbreviatedChurchName,
          district: mainChurch?.district,
          urbanSector: mainChurch?.urbanSector,
        }
      : null,
    anexes: church.anexes.map((anexe) => ({
      id: anexe?.id,
      churchName: anexe?.churchName,
      abbreviatedChurchName: anexe?.abbreviatedChurchName,
      district: anexe?.district,
      urbanSector: anexe?.urbanSector,
    })),
    ministries: church?.ministries?.map((ministry) => ({
      id: ministry?.id,
      ministryType: ministry?.ministryType,
      customMinistryName: ministry?.customMinistryName,
      district: ministry?.district,
    })),
    pastors: church?.pastors.map((pastor) => ({
      id: pastor?.id,
      firstNames: pastor?.member?.firstNames,
      lastNames: pastor?.member?.lastNames,
    })),
    copastors: church?.copastors.map((copastor) => ({
      id: copastor?.id,
      firstNames: copastor?.member?.firstNames,
      lastNames: copastor?.member?.lastNames,
    })),
    supervisors: church?.supervisors.map((supervisor) => ({
      id: supervisor?.id,
      firstNames: supervisor?.member?.firstNames,
      lastNames: supervisor?.member?.lastNames,
    })),
    zones: church?.zones.map((zone) => ({
      id: zone?.id,
      zoneName: zone?.zoneName,
      district: zone?.district,
    })),
    preachers: church?.preachers.map((preacher) => ({
      id: preacher?.id,
      firstNames: preacher?.member?.firstNames,
      lastNames: preacher?.member?.lastNames,
    })),
    familyGroups: church?.familyGroups.map((familyGroup) => ({
      id: familyGroup?.id,
      familyGroupName: familyGroup?.familyGroupName,
      familyGroupCode: familyGroup?.familyGroupCode,
      district: familyGroup?.district,
      urbanSector: familyGroup?.urbanSector,
    })),
    disciples: church.disciples.map((disciple) => ({
      id: disciple?.id,
      firstNames: disciple?.member?.firstNames,
      lastNames: disciple?.member?.lastNames,
    })),
  }));
};
