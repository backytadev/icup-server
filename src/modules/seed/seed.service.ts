import {
  Logger,
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { RelationType } from '@/common/enums/relation-type.enum';

import { UserService } from '@/modules/user/user.service';
import { ZoneService } from '@/modules/zone/zone.service';
import { ChurchService } from '@/modules/church/church.service';
import { PastorService } from '@/modules/pastor/pastor.service';
import { PreacherService } from '@/modules/preacher/preacher.service';
import { DiscipleService } from '@/modules/disciple/disciple.service';
import { CopastorService } from '@/modules/copastor/copastor.service';
import { SupervisorService } from '@/modules/supervisor/supervisor.service';
import { FamilyGroupService } from '@/modules/family-group/family-group.service';
import { OfferingIncomeService } from '@/modules/offering/income/offering-income.service';
import { OfferingExpenseService } from '@/modules/offering/expense/offering-expense.service';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Member } from '@/modules/member/entities/member.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';

import { dataUsers } from '@/modules/seed/data/seed-users';
import { dataZones } from '@/modules/seed/data/seed-zone';
import { dataPastors } from '@/modules/seed/data/seed-pastors';
import { dataChurches } from '@/modules/seed/data/seed-churches';
import { dataDisciples } from '@/modules/seed/data/seed-disciples';
import { dataCopastors } from '@/modules/seed/data/seed-copastors';
import { dataPreachers } from '@/modules/seed/data/seed-preachers';
import { dataSupervisors } from '@/modules/seed/data/seed-supervisor';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';
import { dataFamilyGroups } from '@/modules/seed/data/seed-family-group';
import { dataOfferingIncome } from '@/modules/seed/data/seed-offering-income';
import { dataOfferingExpenses } from '@/modules/seed/data/seed-offering-expenses';
import { MinistryMember } from '@/modules/ministry/entities/ministry-member.entity';
import { ExternalDonor } from '@/modules/external-donor/entities/external-donor.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';

@Injectable()
export class SeedService {
  private readonly logger = new Logger('SeedService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(Ministry)
    private readonly ministryRepository: Repository<Church>,

    @InjectRepository(MinistryMember)
    private readonly ministryMemberRepository: Repository<MinistryMember>,

    @InjectRepository(Pastor)
    private readonly pastorRepository: Repository<Pastor>,

    @InjectRepository(Copastor)
    private readonly copastorRepository: Repository<Copastor>,

    @InjectRepository(Supervisor)
    private readonly supervisorRepository: Repository<Supervisor>,

    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,

    @InjectRepository(Preacher)
    private readonly preacherRepository: Repository<Preacher>,

    @InjectRepository(FamilyGroup)
    private readonly familyGroupRepository: Repository<FamilyGroup>,

    @InjectRepository(Disciple)
    private readonly discipleRepository: Repository<Disciple>,

    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,

    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,

    @InjectRepository(OfferingExpense)
    private readonly offeringExpenseRepository: Repository<OfferingExpense>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(ExternalDonor)
    private readonly externalDonorRepository: Repository<ExternalDonor>,

    private readonly churchService: ChurchService,
    private readonly pastorService: PastorService,
    private readonly copastorService: CopastorService,
    private readonly supervisorService: SupervisorService,
    private readonly zoneService: ZoneService,
    private readonly preacherService: PreacherService,
    private readonly familyGroupService: FamilyGroupService,
    private readonly discipleService: DiscipleService,

    private readonly offeringIncomeService: OfferingIncomeService,
    private readonly offeringExpenseService: OfferingExpenseService,

    private readonly userService: UserService,
  ) {}

  async runSeed(): Promise<string> {
    const queryChurches = this.churchRepository.createQueryBuilder('churches');
    const queryMinistryMember =
      this.ministryMemberRepository.createQueryBuilder('ministry-member');
    const queryMinistries =
      this.ministryRepository.createQueryBuilder('ministries');
    const queryMembers = this.memberRepository.createQueryBuilder('members');
    const queryPastors = this.pastorRepository.createQueryBuilder('pastors');
    const queryCopastor =
      this.copastorRepository.createQueryBuilder('copastors');
    const querySupervisors =
      this.supervisorRepository.createQueryBuilder('supervisors');
    const queryZones = this.zoneRepository.createQueryBuilder('zones');
    const queryPreachers =
      this.preacherRepository.createQueryBuilder('preachers');
    const queryFamilyGroups =
      this.familyGroupRepository.createQueryBuilder('familyGroups');
    const queryDisciples =
      this.discipleRepository.createQueryBuilder('disciples');
    const queryUsers = this.userRepository.createQueryBuilder('users');

    const queryExternalDonors =
      this.externalDonorRepository.createQueryBuilder('externalDonors');

    const queryOfferingIncome =
      this.offeringIncomeRepository.createQueryBuilder('offeringIncome');
    const queryOfferingExpense =
      this.offeringExpenseRepository.createQueryBuilder('offeringExpense');

    try {
      await this.churchRepository.query(`DELETE FROM user_churches`);
      await queryMinistryMember.delete().where({}).execute();
      await queryMinistries.delete().where({}).execute();
      await queryDisciples.delete().where({}).execute();
      await queryFamilyGroups.delete().where({}).execute();
      await queryPreachers.delete().where({}).execute();
      await querySupervisors.delete().where({}).execute();
      await queryZones.delete().where({}).execute();
      await queryCopastor.delete().where({}).execute();
      await queryPastors.delete().where({}).execute();
      await queryChurches.delete().where({}).execute();
      await queryMembers.delete().where({}).execute();
      await queryExternalDonors.delete().where({}).execute();

      await queryOfferingIncome.delete().where({}).execute();
      await queryOfferingExpense.delete().where({}).execute();

      await queryUsers
        .delete()
        .where('NOT (:role = ANY(roles))', { role: 'super-user' }) // delete user without super user role
        .execute();
    } catch (error) {
      this.handleDBExceptions(error);
    }

    const superUser = await this.insertUsers();

    await this.insertNewMembers(superUser);

    await this.insertNewOfferingIncome(superUser);
    await this.insertNewOfferingExpenses(superUser);

    return 'SEED EXECUTED';
  }

  //* Insert Users
  private async insertUsers() {
    const seedUsers = dataUsers.users;
    const users = [];

    const superUser = await this.userRepository
      .createQueryBuilder('user')
      .where('ARRAY[:role]::text[] @> user.roles', { role: 'super-user' })
      .getOne();

    seedUsers.forEach((user) => {
      users.push(this.userService.create(user, superUser));
    });

    await Promise.all(users);
    return superUser;
  }

  //* Insert Membership Data
  private async insertNewMembers(user: User) {
    const church = dataChurches.mainChurch;
    const anexes = dataChurches.anexes;
    const pastors = dataPastors.pastors;
    const copastors = dataCopastors.copastors;
    const supervisors = dataSupervisors.supervisors;
    const zones = dataZones.zones;
    const preachers = dataPreachers.preachers;
    const familyGroups = dataFamilyGroups.houses;
    const disciples = dataDisciples.disciples;

    const promisesAnexes = [];
    const promisesPastor = [];
    const promisesCopastor = [];
    const promisesSupervisor = [];
    const promisesZone = [];
    const promisesPreacher = [];
    const promisesDisciple = [];

    //? Create Main Church
    await this.churchService.create(church[0], user);

    const mainChurch = await this.churchRepository.findOne({
      where: { isAnexe: false },
      relations: ['anexes', 'theirMainChurch'],
    });

    //? Create Anexes
    anexes.forEach((anexe) => {
      anexe.theirMainChurch = mainChurch?.id;

      promisesAnexes.push(this.churchService.create(anexe, user));
    });

    await Promise.all(promisesAnexes);

    const firstAnexe = await this.churchRepository.findOne({
      where: { abbreviatedChurchName: 'ICUP - Nueva Esperanza', isAnexe: true },
      relations: ['theirMainChurch'],
    });

    const secondAnexe = await this.churchRepository.findOne({
      where: { abbreviatedChurchName: 'ICUP - Roca Fuerte', isAnexe: true },
      relations: ['theirMainChurch'],
    });

    //? Create Pastor
    pastors.forEach((pastor, index) => {
      index === 0
        ? (pastor.theirChurch = firstAnexe?.id)
        : index === 1
          ? (pastor.theirChurch = mainChurch?.id)
          : (pastor.theirChurch = secondAnexe?.id);

      promisesPastor.push(this.pastorService.create(pastor, user));
    });

    await Promise.all(promisesPastor);

    //? Create Copastor
    const pastor = await this.pastorRepository.find({
      order: {
        member: {
          residenceDistrict: 'ASC',
        },
      },
    });

    copastors.forEach((copastor, index) => {
      index >= 0 && index <= 2
        ? (copastor.theirPastor = pastor[0]?.id)
        : index >= 3 && index <= 5
          ? (copastor.theirPastor = pastor[1]?.id)
          : (copastor.theirPastor = pastor[2]?.id);

      promisesCopastor.push(
        this.copastorService.create(
          {
            ...copastor,
            relationType: RelationType.OnlyRelatedHierarchicalCover,
          },
          user,
        ),
      );
    });

    await Promise.all(promisesCopastor);

    //? Create Supervisors
    const copastor = await this.copastorRepository.find({
      order: {
        member: {
          residenceDistrict: 'ASC',
        },
      },
      relations: ['theirPastor', 'theirChurch'],
    });

    supervisors.forEach((supervisor, index) => {
      const copastorIndex =
        //* Comas
        index <= 1
          ? 0
          : index <= 3
            ? 1
            : index <= 5
              ? 2
              : //* Independencia
                index <= 7
                ? 3
                : index <= 9
                  ? 4
                  : index <= 11
                    ? 5
                    : //* Los Olivos
                      index <= 13
                      ? 6
                      : index <= 15
                        ? 7
                        : 8;

      supervisor.theirCopastor = copastor[copastorIndex]?.id;

      promisesSupervisor.push(
        this.supervisorService.create(
          {
            ...supervisor,
            relationType: RelationType.OnlyRelatedHierarchicalCover,
          },
          user,
        ),
      );
    });

    await Promise.all(promisesSupervisor);

    //? Create Zones
    const allSupervisors = await this.supervisorRepository.find({
      order: {
        member: {
          residenceDistrict: 'ASC',
        },
      },
      relations: ['theirCopastor', 'theirPastor', 'theirChurch'],
    });

    zones.forEach((zone, index) => {
      zone.theirSupervisor = allSupervisors[index]?.id;
      promisesZone.push(this.zoneService.create(zone, user));
    });

    await Promise.all(promisesZone);

    //? Create Preachers
    preachers.forEach((preacher, index) => {
      const supervisorIndex =
        //* Comas
        index <= 2
          ? 0
          : index <= 5
            ? 1
            : index <= 9
              ? 2
              : index <= 13
                ? 3
                : index <= 17
                  ? 4
                  : index <= 19
                    ? 5
                    : index <= 22 //* Independencia
                      ? 6
                      : index <= 25
                        ? 7
                        : index <= 29
                          ? 8
                          : index <= 33
                            ? 9
                            : index <= 37
                              ? 10
                              : index <= 39
                                ? 11
                                : index <= 42 //* Los Olivos
                                  ? 12
                                  : index <= 45
                                    ? 13
                                    : index <= 49
                                      ? 14
                                      : index <= 53
                                        ? 15
                                        : index <= 57
                                          ? 16
                                          : 17;

      preacher.theirSupervisor = allSupervisors[supervisorIndex]?.id;

      promisesPreacher.push(
        this.preacherService.create(
          {
            ...preacher,
            relationType: RelationType.OnlyRelatedHierarchicalCover,
          },
          user,
        ),
      );
    });

    await Promise.all(promisesPreacher);

    //? Create Family Houses
    const allPreachers = await this.preacherRepository.find({
      order: {
        member: {
          residenceDistrict: 'ASC',
        },
      },
      relations: [
        'theirSupervisor',
        'theirCopastor',
        'theirPastor',
        'theirChurch',
      ],
    });

    async function crateHousesSorted(
      familyGroups,
      allPreachers,
      user,
      familyGroupService,
    ) {
      const promisesCreation = [];

      for (const [index, familyGroup] of familyGroups.entries()) {
        familyGroup.theirPreacher = allPreachers[index]?.id;

        try {
          const createdHouse = await familyGroupService.create(
            familyGroup,
            user,
          );
          promisesCreation.push(createdHouse);
        } catch (error) {
          console.error('Error al crear la casa:', error);
        }
      }

      return promisesCreation;
    }

    await crateHousesSorted(
      familyGroups,
      allPreachers,
      user,
      this.familyGroupService,
    );

    //? Create Disciples
    const allFamilyGroups = await this.familyGroupRepository.find({
      order: {
        district: 'ASC',
      },
    });

    const groupRanges = [
      //* Comas (134 disciples)
      { start: 0, end: 4, groupIndex: 0, count: 5 },
      { start: 5, end: 11, groupIndex: 1, count: 7 },
      { start: 12, end: 17, groupIndex: 2, count: 6 },
      { start: 18, end: 22, groupIndex: 3, count: 5 },
      { start: 23, end: 30, groupIndex: 4, count: 8 },
      { start: 31, end: 34, groupIndex: 5, count: 4 },
      { start: 35, end: 39, groupIndex: 6, count: 5 },
      { start: 40, end: 46, groupIndex: 7, count: 7 },
      { start: 47, end: 56, groupIndex: 8, count: 10 },
      { start: 57, end: 64, groupIndex: 9, count: 8 },
      { start: 65, end: 71, groupIndex: 10, count: 7 },
      { start: 72, end: 81, groupIndex: 11, count: 10 },
      { start: 82, end: 87, groupIndex: 12, count: 6 },
      { start: 88, end: 92, groupIndex: 13, count: 5 },
      { start: 93, end: 98, groupIndex: 14, count: 6 },
      { start: 99, end: 102, groupIndex: 15, count: 4 },
      { start: 103, end: 110, groupIndex: 16, count: 8 },
      { start: 111, end: 119, groupIndex: 17, count: 9 },
      { start: 120, end: 128, groupIndex: 18, count: 9 },
      { start: 129, end: 133, groupIndex: 19, count: 5 },
      //* Independencia (123 disciples)
      { start: 134, end: 138, groupIndex: 20, count: 5 },
      { start: 139, end: 146, groupIndex: 21, count: 8 },
      { start: 147, end: 155, groupIndex: 22, count: 9 },
      { start: 156, end: 159, groupIndex: 23, count: 4 },
      { start: 160, end: 162, groupIndex: 24, count: 3 },
      { start: 163, end: 169, groupIndex: 25, count: 7 },
      { start: 170, end: 175, groupIndex: 26, count: 6 },
      { start: 176, end: 179, groupIndex: 27, count: 4 },
      { start: 180, end: 184, groupIndex: 28, count: 5 },
      { start: 185, end: 189, groupIndex: 29, count: 5 },
      { start: 190, end: 197, groupIndex: 30, count: 8 },
      { start: 198, end: 203, groupIndex: 31, count: 6 },
      { start: 204, end: 208, groupIndex: 32, count: 5 },
      { start: 209, end: 217, groupIndex: 33, count: 9 },
      { start: 218, end: 224, groupIndex: 34, count: 7 },
      { start: 225, end: 234, groupIndex: 35, count: 10 },
      { start: 235, end: 239, groupIndex: 36, count: 5 },
      { start: 240, end: 245, groupIndex: 37, count: 6 },
      { start: 246, end: 250, groupIndex: 38, count: 5 },
      { start: 251, end: 256, groupIndex: 39, count: 6 },
      //* Los Olivos (121 disciples)
      { start: 257, end: 261, groupIndex: 40, count: 5 },
      { start: 262, end: 269, groupIndex: 41, count: 8 },
      { start: 270, end: 278, groupIndex: 42, count: 9 },
      { start: 279, end: 282, groupIndex: 43, count: 4 },
      { start: 283, end: 285, groupIndex: 44, count: 3 },
      { start: 286, end: 292, groupIndex: 45, count: 7 },
      { start: 293, end: 298, groupIndex: 46, count: 6 },
      { start: 299, end: 302, groupIndex: 47, count: 4 },
      { start: 303, end: 307, groupIndex: 48, count: 5 },
      { start: 308, end: 312, groupIndex: 49, count: 5 },
      { start: 313, end: 320, groupIndex: 50, count: 8 },
      { start: 321, end: 326, groupIndex: 51, count: 6 },
      { start: 327, end: 331, groupIndex: 52, count: 5 },
      { start: 332, end: 339, groupIndex: 53, count: 8 },
      { start: 340, end: 346, groupIndex: 54, count: 7 },
      { start: 347, end: 355, groupIndex: 55, count: 9 },
      { start: 356, end: 360, groupIndex: 56, count: 5 },
      { start: 361, end: 366, groupIndex: 57, count: 6 },
      { start: 367, end: 371, groupIndex: 58, count: 5 },
      { start: 372, end: 377, groupIndex: 59, count: 6 },
    ];

    disciples.forEach((disciple, index) => {
      const range = groupRanges.find((r) => index >= r.start && index <= r.end);
      if (range) {
        disciple.theirFamilyGroup = allFamilyGroups[range.groupIndex]?.id;
      }

      promisesPreacher.push(
        this.discipleService.create(
          {
            ...disciple,
            relationType: RelationType.OnlyRelatedHierarchicalCover,
          },
          user,
        ),
      );
    });

    await Promise.all(promisesDisciple);
  }

  //? Insert Offering Income
  private async insertNewOfferingIncome(user: User) {
    const sundayServiceOfferingIncome =
      dataOfferingIncome.sundayServiceOfferingIncome;
    const familyGroupOfferingIncome =
      dataOfferingIncome.familyGroupOfferingIncome;
    // const sundaySchoolOfferingIncome =
    //   dataOfferingIncome.sundaySchoolOfferingIncome;
    const unitedServiceOfferingIncome =
      dataOfferingIncome.unitedServiceOfferingIncome;
    const fastingAndVigilOfferingIncome =
      dataOfferingIncome.fastingAndVigilOfferingIncome;
    // const youthServiceOfferingIncome =
    //   dataOfferingIncome.youthServiceOfferingIncome;
    const churchGroundOfferingIncome =
      dataOfferingIncome.churchGroundOfferingIncome;
    const specialOfferingIncome = dataOfferingIncome.specialOfferingIncome;
    const activitiesOfferingIncome =
      dataOfferingIncome.activitiesOfferingIncome;
    const adjustmentOfferingIncome =
      dataOfferingIncome.adjustmentOfferingIncome;

    const mainChurch = await this.churchRepository.findOne({
      where: { isAnexe: false },
    });

    const allFamilyGroups = await this.familyGroupRepository.find({
      where: { theirChurch: mainChurch },
      take: 7,
    });

    const allDisciples = await this.discipleRepository.find({
      where: { theirChurch: mainChurch },
      take: 7,
    });

    //* Sunday Service
    for (const offering of sundayServiceOfferingIncome) {
      offering.churchId = mainChurch?.id;
      await this.offeringIncomeService.create(offering, user);
    }

    //* Family Group
    for (const [index, offering] of familyGroupOfferingIncome.entries()) {
      if (index <= 6) {
        offering.churchId = mainChurch?.id;
        offering.familyGroupId = allFamilyGroups[index]?.id;
      } else {
        offering.churchId = mainChurch?.id;
        offering.familyGroupId = undefined;
      }

      await this.offeringIncomeService.create(offering, user);
    }

    //* Sunday School
    // for (const offering of sundaySchoolOfferingIncome) {
    //   offering.churchId = mainChurch?.id;
    //   await this.offeringIncomeService.create(offering, user);
    // }

    // //* United Service

    for (const offering of unitedServiceOfferingIncome) {
      offering.churchId = mainChurch?.id;
      await this.offeringIncomeService.create(offering, user);
    }

    // //* Fasting and Vigil

    for (const offering of fastingAndVigilOfferingIncome) {
      offering.churchId = mainChurch?.id;
      await this.offeringIncomeService.create(offering, user);
    }

    //* Youth Service
    // for (const offering of youthServiceOfferingIncome) {
    //   offering.churchId = mainChurch?.id;
    //   await this.offeringIncomeService.create(offering, user);
    // }

    //* Church Ground
    for (const [index, offering] of churchGroundOfferingIncome.entries()) {
      if (index <= 6) {
        offering.churchId = mainChurch?.id;
        offering.memberId = allDisciples[index]?.id;
      } else {
        offering.churchId = mainChurch?.id;
        offering.memberId = undefined;
      }

      await this.offeringIncomeService.create(offering, user);
    }

    //* Special
    for (const [index, offering] of specialOfferingIncome.entries()) {
      if (index <= 6) {
        offering.churchId = mainChurch?.id;
        offering.memberId = allDisciples[index]?.id;
      } else {
        offering.churchId = mainChurch?.id;
        offering.memberId = undefined;
      }

      await this.offeringIncomeService.create(offering, user);
    }

    //* Activities OfferingIncome
    for (const offering of activitiesOfferingIncome) {
      offering.churchId = mainChurch?.id;
      await this.offeringIncomeService.create(offering, user);
    }

    //* Adjustment OfferingIncome
    for (const offering of adjustmentOfferingIncome) {
      offering.churchId = mainChurch?.id;
      await this.offeringIncomeService.create(offering, user);
    }
  }

  //? Insert Offering Expenses
  private async insertNewOfferingExpenses(user: User) {
    const operationalOfferingExpenses =
      dataOfferingExpenses.operationalOfferingExpenses;
    const maintenanceAndRepairOfferingExpenses =
      dataOfferingExpenses.maintenanceAndRepairOfferingExpenses;
    const decorationOfferingExpenses =
      dataOfferingExpenses.decorationOfferingExpenses;
    const equipmentAndTechnologyOfferingExpenses =
      dataOfferingExpenses.equipmentAndTechnologyOfferingExpenses;
    const suppliesOfferingExpenses =
      dataOfferingExpenses.suppliesOfferingExpenses;
    const planingEventsOfferingExpenses =
      dataOfferingExpenses.planingEventsOfferingExpenses;
    const otherOfferingExpenses = dataOfferingExpenses.otherOfferingExpenses;
    const adjustmentOfferingExpenses =
      dataOfferingExpenses.adjustmentOfferingExpenses;

    const promisesOperationalOfferingExpenses = [];
    const promisesMaintenanceAndRepairOfferingExpenses = [];
    const promisesDecorationOfferingExpenses = [];
    const promisesEquipmentAndTechnologyOfferingExpenses = [];
    const promisesSuppliesOfferingExpenses = [];
    const promisesPlaningEventsOfferingExpenses = [];
    const promisesOtherOfferingExpenses = [];
    const promisesAdjustmentOfferingExpenses = [];

    const mainChurch = await this.churchRepository.findOne({
      where: { isAnexe: false },
    });

    //* Operational
    operationalOfferingExpenses.forEach((offering) => {
      offering.churchId = mainChurch?.id;

      promisesOperationalOfferingExpenses.push(
        this.offeringExpenseService.create(offering, user),
      );
    });

    await Promise.all(promisesOperationalOfferingExpenses);

    //* Maintenance And Repair
    maintenanceAndRepairOfferingExpenses.forEach((offering) => {
      offering.churchId = mainChurch?.id;

      promisesMaintenanceAndRepairOfferingExpenses.push(
        this.offeringExpenseService.create(offering, user),
      );
    });

    await Promise.all(promisesMaintenanceAndRepairOfferingExpenses);

    //* Decoration
    decorationOfferingExpenses.forEach((offering) => {
      offering.churchId = mainChurch?.id;

      promisesDecorationOfferingExpenses.push(
        this.offeringExpenseService.create(offering, user),
      );
    });

    await Promise.all(promisesDecorationOfferingExpenses);

    //* Equipment and Technology
    equipmentAndTechnologyOfferingExpenses.forEach((offering) => {
      offering.churchId = mainChurch?.id;

      promisesEquipmentAndTechnologyOfferingExpenses.push(
        this.offeringExpenseService.create(offering, user),
      );
    });

    await Promise.all(promisesEquipmentAndTechnologyOfferingExpenses);

    //* Supplies
    suppliesOfferingExpenses.forEach((offering) => {
      offering.churchId = mainChurch?.id;

      promisesSuppliesOfferingExpenses.push(
        this.offeringExpenseService.create(offering, user),
      );
    });

    await Promise.all(promisesSuppliesOfferingExpenses);

    //* Planing Events
    planingEventsOfferingExpenses.forEach((offering) => {
      offering.churchId = mainChurch?.id;

      promisesPlaningEventsOfferingExpenses.push(
        this.offeringExpenseService.create(offering, user),
      );
    });

    await Promise.all(promisesPlaningEventsOfferingExpenses);

    //* Other Expenses
    otherOfferingExpenses.forEach((offering) => {
      offering.churchId = mainChurch?.id;

      promisesOtherOfferingExpenses.push(
        this.offeringExpenseService.create(offering, user),
      );
    });

    await Promise.all(promisesOtherOfferingExpenses);

    //* Adjustment Expenses
    adjustmentOfferingExpenses.forEach((offering) => {
      offering.churchId = mainChurch?.id;

      promisesAdjustmentOfferingExpenses.push(
        this.offeringExpenseService.create(offering, user),
      );
    });

    await Promise.all(promisesAdjustmentOfferingExpenses);
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);

    throw new InternalServerErrorException(
      'Unexpected errors, check server logs',
    );
  }
}
