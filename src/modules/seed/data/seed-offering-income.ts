import { OfferingIncomeCreationType } from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import { OfferingIncomeCreationSubType } from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';
import { OfferingIncomeCreationCategory } from '@/modules/offering/income/enums/offering-income-creation-category.enum';
import { OfferingIncomeCreationShiftType } from '@/modules/offering/income/enums/offering-income-creation-shift-type.enum';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { MemberOfferingType } from '@/modules/offering/income/enums/member-offering-type.enum';
import { CurrencyType } from '@/modules/offering/shared/enums/currency-type.enum';
import { OfferingInactivationReason } from '@/modules/offering/shared/enums/offering-inactivation-reason.enum';

interface SeedOfferingIncome {
  //* General Info
  type: OfferingIncomeCreationType;
  subType?: OfferingIncomeCreationSubType;
  category?: OfferingIncomeCreationCategory;
  isNewExternalDonor?: boolean;
  externalDonorId?: string;
  externalDonorFirstNames?: string;
  externalDonorLastNames?: string;
  externalDonorGender?: string;
  externalDonorBirthDate?: Date;
  externalDonorPhoneNumber?: string;
  externalDonorEmail?: string;
  externalDonorOriginCountry?: string;
  externalDonorResidenceCountry?: string;
  externalDonorResidenceCity?: string;
  externalDonorPostalCode?: string;
  shift?: OfferingIncomeCreationShiftType | string;
  amount: string | number;
  currency: CurrencyType;
  date: Date;
  comments?: string;
  imageUrls?: string[];
  reasonElimination?: OfferingInactivationReason;
  recordStatus?: string;
  memberType?: string | undefined;

  //* Relations
  churchId?: string;
  zoneId?: string;
  familyGroupId?: string;
  memberId?: string;
}

interface SeedDataOfferingIncome {
  sundayServiceOfferingIncome: SeedOfferingIncome[];
  familyGroupOfferingIncome: SeedOfferingIncome[];
  // sundaySchoolOfferingIncome: SeedOfferingIncome[];
  unitedServiceOfferingIncome: SeedOfferingIncome[];
  fastingAndVigilOfferingIncome: SeedOfferingIncome[];
  // youthServiceOfferingIncome: SeedOfferingIncome[];
  activitiesOfferingIncome: SeedOfferingIncome[];
  adjustmentOfferingIncome: SeedOfferingIncome[];
  churchGroundOfferingIncome: SeedOfferingIncome[];
  specialOfferingIncome: SeedOfferingIncome[];
}

//! Helpers
const getLastSundays = (referenceDate: Date, count: number): Date[] => {
  const sundays: Date[] = [];
  const currentDate = new Date(referenceDate);

  while (sundays.length < count) {
    if (currentDate.getDay() === 0) {
      sundays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return sundays.reverse().filter((date) => date <= referenceDate);
};

const getLastSaturdays = (referenceDate: Date, count: number): Date[] => {
  const saturdays: Date[] = [];
  const currentDate = new Date(referenceDate);

  while (saturdays.length < count) {
    if (currentDate.getDay() === 6) {
      saturdays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return saturdays.reverse().filter((date) => date <= referenceDate);
};

const getLastFridays = (referenceDate: Date, count: number): Date[] => {
  const fridays: Date[] = [];
  const currentDate = new Date(referenceDate);

  while (fridays.length < count) {
    if (currentDate.getDay() === 5) {
      fridays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return fridays.reverse().filter((date) => date <= referenceDate);
};

const getRandomAmount = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

const today = new Date();
const lastSundays = getLastSundays(today, 7);
const lastSaturdays = getLastSaturdays(today, 7);
const lastFridays = getLastFridays(today, 7);

export const dataOfferingIncome: SeedDataOfferingIncome = {
  //* Sunday Service
  sundayServiceOfferingIncome: lastSundays.flatMap((date) => {
    return [
      {
        type: OfferingIncomeCreationType.Offering,
        subType: OfferingIncomeCreationSubType.SundayService,
        category: OfferingIncomeCreationCategory.OfferingBox,
        shift: OfferingIncomeCreationShiftType.Day,
        amount: getRandomAmount(100, 900).toFixed(2),
        currency: CurrencyType.PEN,
        date,
        comments: undefined,
        imageUrls: [],
        reasonElimination: undefined,
        recordStatus: RecordStatus.Active,
      },
      {
        type: OfferingIncomeCreationType.Offering,
        subType: OfferingIncomeCreationSubType.SundayService,
        category: OfferingIncomeCreationCategory.OfferingBox,
        shift: OfferingIncomeCreationShiftType.Afternoon,
        amount: getRandomAmount(100, 900).toFixed(2),
        currency: CurrencyType.PEN,
        date,
        comments: undefined,
        imageUrls: [],
        reasonElimination: undefined,
        recordStatus: RecordStatus.Active,
      },
    ];
  }),

  //* Family Group
  familyGroupOfferingIncome: lastSundays.map((date) => ({
    type: OfferingIncomeCreationType.Offering,
    subType: OfferingIncomeCreationSubType.FamilyGroup,
    category: OfferingIncomeCreationCategory.OfferingBox,
    amount: getRandomAmount(50, 200).toFixed(2),
    currency: CurrencyType.PEN,
    date,
    comments: undefined,
    imageUrls: [],
    reasonElimination: undefined,
    recordStatus: RecordStatus.Active,
  })),

  //* Sunday School
  // sundaySchoolOfferingIncome: lastSundays.flatMap((date) => {
  //   return [
  //     {
  //       type: OfferingIncomeCreationType.Offering,
  //       subType: OfferingIncomeCreationSubType.SundaySchool,
  //       category: OfferingIncomeCreationCategory.OfferingBox,
  //       shift: OfferingIncomeCreationShiftType.Day,
  //       amount: getRandomAmount(50, 100).toFixed(2),
  //       currency: CurrencyType.PEN,
  //       date,
  //       comments: undefined,
  //       imageUrls: [],
  //       reasonElimination: undefined,
  //       recordStatus: RecordStatus.Active,
  //     },
  //     {
  //       type: OfferingIncomeCreationType.Offering,
  //       subType: OfferingIncomeCreationSubType.SundaySchool,
  //       category: OfferingIncomeCreationCategory.OfferingBox,
  //       shift: OfferingIncomeCreationShiftType.Afternoon,
  //       amount: getRandomAmount(50, 100).toFixed(2),
  //       currency: CurrencyType.PEN,
  //       date,
  //       comments: undefined,
  //       imageUrls: [],
  //       reasonElimination: undefined,
  //       recordStatus: RecordStatus.Active,
  //     },
  //   ];
  // }),

  //* United Service
  unitedServiceOfferingIncome: lastFridays.map((date) => ({
    type: OfferingIncomeCreationType.Offering,
    subType: OfferingIncomeCreationSubType.UnitedService,
    category: OfferingIncomeCreationCategory.OfferingBox,
    amount: getRandomAmount(150, 800).toFixed(2),
    currency: CurrencyType.PEN,
    date,
    comments: undefined,
    imageUrls: [],
    reasonElimination: undefined,
    recordStatus: RecordStatus.Active,
  })),

  //* Fasting And Vigil
  fastingAndVigilOfferingIncome: lastSaturdays.flatMap((date) => {
    return [
      {
        type: OfferingIncomeCreationType.Offering,
        subType: OfferingIncomeCreationSubType.GeneralFasting,
        category: OfferingIncomeCreationCategory.OfferingBox,
        amount: getRandomAmount(150, 800).toFixed(2),
        currency: CurrencyType.PEN,
        date,
        comments: undefined,
        imageUrls: [],
        reasonElimination: undefined,
        recordStatus: RecordStatus.Active,
      },
      {
        type: OfferingIncomeCreationType.Offering,
        subType: OfferingIncomeCreationSubType.GeneralVigil,
        category: OfferingIncomeCreationCategory.OfferingBox,
        amount: getRandomAmount(150, 800).toFixed(2),
        currency: CurrencyType.PEN,
        date,
        comments: undefined,
        imageUrls: [],
        reasonElimination: undefined,
        recordStatus: RecordStatus.Active,
      },
    ];
  }),

  //* Youth Service
  // youthServiceOfferingIncome: lastSaturdays.map((date) => ({
  //   type: OfferingIncomeCreationType.Offering,
  //   subType: OfferingIncomeCreationSubType.YouthService,
  //   category: OfferingIncomeCreationCategory.OfferingBox,
  //   amount: getRandomAmount(100, 300).toFixed(2),
  //   currency: CurrencyType.PEN,
  //   date,
  //   comments: undefined,
  //   imageUrls: [],
  //   reasonElimination: undefined,
  //   recordStatus: RecordStatus.Active,
  // })),

  //* Church Ground
  churchGroundOfferingIncome: lastSundays.map((date) => ({
    type: OfferingIncomeCreationType.Offering,
    subType: OfferingIncomeCreationSubType.ChurchGround,
    category: OfferingIncomeCreationCategory.InternalDonation,
    amount: getRandomAmount(300, 1000).toFixed(2),
    memberType: MemberOfferingType.Disciple,
    currency: CurrencyType.PEN,
    date,
    comments: undefined,
    imageUrls: [],
    reasonElimination: undefined,
    recordStatus: RecordStatus.Active,
  })),

  //* Special
  specialOfferingIncome: lastSundays.map((date) => ({
    type: OfferingIncomeCreationType.Offering,
    subType: OfferingIncomeCreationSubType.Special,
    category: OfferingIncomeCreationCategory.InternalDonation,
    amount: getRandomAmount(300, 1000).toFixed(2),
    memberType: MemberOfferingType.Disciple,
    currency: CurrencyType.PEN,
    date,
    comments: undefined,
    imageUrls: [],
    reasonElimination: undefined,
    recordStatus: RecordStatus.Active,
  })),

  //* Activities
  activitiesOfferingIncome: lastSundays.map((date) => ({
    type: OfferingIncomeCreationType.Offering,
    subType: OfferingIncomeCreationSubType.Activities,
    category: OfferingIncomeCreationCategory.General,
    amount: getRandomAmount(150, 500).toFixed(2),
    currency: CurrencyType.PEN,
    date,
    comments: undefined,
    imageUrls: [],
    reasonElimination: undefined,
    recordStatus: RecordStatus.Active,
  })),

  //* Adjustment
  adjustmentOfferingIncome: lastFridays.map((date) => ({
    type: OfferingIncomeCreationType.IncomeAdjustment,
    amount: getRandomAmount(10, 100).toFixed(2),
    currency: CurrencyType.PEN,
    date,
    comments: undefined,
    imageUrls: [],
    reasonElimination: undefined,
    recordStatus: RecordStatus.Active,
  })),
};
