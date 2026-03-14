import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { ExternalDonor } from '@/modules/external-donor/entities/external-donor.entity';

import { MemberOfferingType } from '@/modules/offering/income/enums/member-offering-type.enum';
import {
  OfferingIncomeCreationSubType,
  OfferingIncomeCreationSubTypeNames,
} from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';
import { OfferingIncomeCreationType } from '@/modules/offering/income/enums/offering-income-creation-type.enum';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { FileFolder } from '@/common/enums/file-folder.enum';

import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';

import { BaseService } from '@/common/services/base.service';

import { UpdateOfferingIncomeDto } from '@/modules/offering/income/dto/update-offering-income.dto';

import { OfferingReportsService } from '@/modules/reports/services/offering-reports.service';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Pastor } from '@/modules/pastor/entities/pastor.entity';
import { Copastor } from '@/modules/copastor/entities/copastor.entity';
import { Preacher } from '@/modules/preacher/entities/preacher.entity';
import { Disciple } from '@/modules/disciple/entities/disciple.entity';
import { Supervisor } from '@/modules/supervisor/entities/supervisor.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';

@Injectable()
export class OfferingIncomeUpdateService extends BaseService {
  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

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

    @InjectRepository(ExternalDonor)
    private readonly externalDonorRepository: Repository<ExternalDonor>,

    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,

    private readonly reportsService: OfferingReportsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    super();
  }

  //* UPDATE OFFERING INCOME
  async update(
    id: string,
    updateOfferingIncomeDto: UpdateOfferingIncomeDto,
    user: User,
  ) {
    const {
      date,
      type,
      shift,
      amount,
      zoneId,
      subType,
      churchId,
      memberId,
      currency,
      imageUrls,
      category,
      memberType,
      recordStatus,
      familyGroupId,
      externalDonorId,
    } = updateOfferingIncomeDto;

    await this.validateId(id);

    //* Validations
    const offering = await this.offeringIncomeRepository.findOne({
      where: { id: id },
      relations: [
        'church',
        'zone',
        'familyGroup',
        'pastor.member',
        'copastor.member',
        'supervisor.member',
        'preacher.member',
        'disciple.member',
        'externalDonor',
      ],
    });

    if (!offering) {
      throw new NotFoundException(
        `Ingreso de Ofrenda con id: ${id} no fue encontrado`,
      );
    }

    if (
      offering?.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
      );
    }

    if (type && type !== offering?.type) {
      throw new BadRequestException(
        `No se puede actualizar el tipo de este registro.`,
      );
    }

    if (subType && subType !== offering?.subType) {
      throw new BadRequestException(
        `No se puede actualizar el sub-tipo de este registro.`,
      );
    }

    if (shift && shift !== offering?.shift) {
      throw new BadRequestException(
        `No se puede actualizar el turno de este registro.`,
      );
    }

    if (memberType && memberType !== offering?.memberType) {
      throw new BadRequestException(
        `No se puede actualizar el tipo de miembro de este registro.`,
      );
    }

    if (churchId && churchId !== offering?.church?.id) {
      throw new BadRequestException(
        `No se puede actualizar la Iglesia a la que pertenece este registro.`,
      );
    }

    if (familyGroupId && familyGroupId !== offering?.familyGroup?.id) {
      throw new BadRequestException(
        `No se puede actualizar el Grupo Familiar al que pertenece este registro.`,
      );
    }

    if (zoneId && zoneId !== offering?.zone?.id) {
      throw new BadRequestException(
        `No se puede actualizar la Zona al  que pertenece este registro.`,
      );
    }

    if (
      memberType === MemberOfferingType.ExternalDonor &&
      externalDonorId !== offering?.externalDonor?.id
    ) {
      throw new BadRequestException(
        `No se puede actualizar el Discípulo que pertenece este registro.`,
      );
    }

    if (
      memberType === MemberOfferingType.Disciple &&
      memberId !== offering?.disciple?.id
    ) {
      throw new BadRequestException(
        `No se puede actualizar el Discípulo que pertenece este registro.`,
      );
    }

    if (
      memberType === MemberOfferingType.Pastor &&
      memberId !== offering?.pastor?.id
    ) {
      throw new BadRequestException(
        `No se puede actualizar el Pastor que pertenece este registro.`,
      );
    }

    if (
      memberType === MemberOfferingType.Copastor &&
      memberId !== offering?.copastor?.id
    ) {
      throw new BadRequestException(
        `No se puede actualizar el Co-Pastor que pertenece este registro.`,
      );
    }

    if (
      memberType === MemberOfferingType.Supervisor &&
      memberId !== offering?.supervisor?.id
    ) {
      throw new BadRequestException(
        `No se puede actualizar el Supervisor que pertenece este registro.`,
      );
    }

    if (
      memberType === MemberOfferingType.Preacher &&
      memberId !== offering?.preacher?.id
    ) {
      throw new BadRequestException(
        `No se puede actualizar el Predicador que pertenece este registro.`,
      );
    }

    try {
      //? Validate if exists record already
      let zone: Zone;
      if (zoneId) {
        zone = await this.zoneRepository.findOne({
          where: {
            id: zoneId,
          },
        });
      }

      let familyGroup: FamilyGroup;
      if (familyGroupId) {
        familyGroup = await this.familyGroupRepository.findOne({
          where: {
            id: familyGroupId,
          },
        });
      }

      let church: Church;
      if (churchId) {
        church = await this.churchRepository.findOne({
          where: {
            id: churchId,
          },
        });
      }

      let memberValue: Pastor | Copastor | Supervisor | Preacher | Disciple;
      if (memberType === MemberOfferingType.Pastor) {
        memberValue = await this.pastorRepository.findOne({
          where: {
            id: memberId,
          },
        });
      }
      if (memberType === MemberOfferingType.Copastor) {
        memberValue = await this.copastorRepository.findOne({
          where: {
            id: memberId,
          },
        });
      }
      if (memberType === MemberOfferingType.Supervisor) {
        memberValue = await this.supervisorRepository.findOne({
          where: {
            id: memberId,
          },
        });
      }
      if (memberType === MemberOfferingType.Preacher) {
        memberValue = await this.preacherRepository.findOne({
          where: {
            id: memberId,
          },
        });
      }
      if (memberType === MemberOfferingType.Disciple) {
        memberValue = await this.discipleRepository.findOne({
          where: {
            id: memberId,
          },
        });
      }

      let externalDonor: ExternalDonor;
      if (memberType === MemberOfferingType.ExternalDonor) {
        externalDonor = await this.externalDonorRepository.findOne({
          where: {
            id: externalDonorId,
          },
        });
      }

      let existsOffering: OfferingIncome[];

      //* Sunday service
      if (subType === OfferingIncomeCreationSubType.SundayService) {
        existsOffering = await this.offeringIncomeRepository.find({
          where: {
            id: Not(id),
            type: type,
            subType: subType,
            category: category,
            church: church,
            date: new Date(date),
            currency: currency,
            shift: shift,
            recordStatus: RecordStatus.Active,
          },
        });
      }

      //* Sunday school
      if (subType === OfferingIncomeCreationSubType.SundaySchool) {
        existsOffering = await this.offeringIncomeRepository.find({
          where: {
            id: Not(id),
            type: type,
            subType: subType,
            category: category,
            church: church,
            date: new Date(date),
            currency: currency,
            shift: shift,
            memberType: memberType,
            pastor: memberValue as Pastor,
            copastor: memberValue as Copastor,
            supervisor: memberValue as Supervisor,
            preacher: memberValue as Preacher,
            disciple: memberValue as Disciple,
            externalDonor: externalDonor,
            recordStatus: RecordStatus.Active,
          },
        });
      }

      //* Youth Service
      if (subType === OfferingIncomeCreationSubType.YouthService) {
        existsOffering = await this.offeringIncomeRepository.find({
          where: {
            id: Not(id),
            type: type,
            subType: subType,
            category: category,
            church: church,
            date: new Date(date),
            currency: currency,
            shift: shift,
            memberType: memberType,
            pastor: memberValue as Pastor,
            copastor: memberValue as Copastor,
            supervisor: memberValue as Supervisor,
            preacher: memberValue as Preacher,
            disciple: memberValue as Disciple,
            externalDonor: externalDonor,
            recordStatus: RecordStatus.Active,
          },
        });
      }

      //* Teenager Service
      if (subType === OfferingIncomeCreationSubType.TeenagerService) {
        existsOffering = await this.offeringIncomeRepository.find({
          where: {
            id: Not(id),
            type: type,
            subType: subType,
            category: category,
            church: church,
            date: new Date(date),
            currency: currency,
            shift: shift,
            memberType: memberType,
            pastor: memberValue as Pastor,
            copastor: memberValue as Copastor,
            supervisor: memberValue as Supervisor,
            preacher: memberValue as Preacher,
            disciple: memberValue as Disciple,
            externalDonor: externalDonor,
            recordStatus: RecordStatus.Active,
          },
        });
      }

      //* Family group
      if (subType === OfferingIncomeCreationSubType.FamilyGroup) {
        existsOffering = await this.offeringIncomeRepository.find({
          where: {
            id: Not(id),
            type: type,
            subType: subType,
            category: category,
            date: new Date(date),
            currency: currency,
            familyGroup: familyGroup,
            recordStatus: RecordStatus.Active,
          },
        });
      }

      //* Zonal fasting and vigil and Zonal Evangelism
      if (
        subType === OfferingIncomeCreationSubType.ZonalVigil ||
        subType === OfferingIncomeCreationSubType.ZonalFasting ||
        subType === OfferingIncomeCreationSubType.ZonalUnitedService ||
        subType === OfferingIncomeCreationSubType.ZonalEvangelism
      ) {
        existsOffering = await this.offeringIncomeRepository.find({
          where: {
            id: Not(id),
            type: type,
            subType: subType,
            category: category,
            date: new Date(date),
            currency: currency,
            zone: zone,
            recordStatus: RecordStatus.Active,
          },
        });
      }

      //* General fasting, general vigil united services, activities
      if (
        subType === OfferingIncomeCreationSubType.GeneralFasting ||
        subType === OfferingIncomeCreationSubType.GeneralVigil ||
        subType === OfferingIncomeCreationSubType.GeneralEvangelism ||
        subType === OfferingIncomeCreationSubType.UnitedService ||
        subType === OfferingIncomeCreationSubType.Activities
      ) {
        existsOffering = await this.offeringIncomeRepository.find({
          where: {
            id: Not(id),
            type: type,
            subType: subType,
            category: category,
            date: new Date(date),
            church: church,
            currency: currency,
            recordStatus: RecordStatus.Active,
          },
        });
      }

      //* Special and church ground
      if (
        subType === OfferingIncomeCreationSubType.Special ||
        subType === OfferingIncomeCreationSubType.ChurchGround
      ) {
        existsOffering = await this.offeringIncomeRepository.find({
          where: {
            id: Not(id),
            type: type,
            subType: subType,
            category: category,
            date: new Date(date),
            currency: currency,
            recordStatus: RecordStatus.Active,
          },
        });

        if (memberType === MemberOfferingType.Pastor) {
          existsOffering = await this.offeringIncomeRepository.find({
            where: {
              id: Not(id),
              type: type,
              subType: subType,
              category: category,
              date: new Date(date),
              currency: currency,
              memberType: memberType,
              pastor: memberValue as Pastor,
              recordStatus: RecordStatus.Active,
            },
          });
        }
        if (memberType === MemberOfferingType.Copastor) {
          existsOffering = await this.offeringIncomeRepository.find({
            where: {
              id: Not(id),
              type: type,
              subType: subType,
              category: category,
              date: new Date(date),
              currency: currency,
              memberType: memberType,
              copastor: memberValue as Copastor,
              recordStatus: RecordStatus.Active,
            },
          });
        }
        if (memberType === MemberOfferingType.Supervisor) {
          existsOffering = await this.offeringIncomeRepository.find({
            where: {
              id: Not(id),
              type: type,
              subType: subType,
              category: category,
              date: new Date(date),
              currency: currency,
              memberType: memberType,
              supervisor: memberValue as Supervisor,
              recordStatus: RecordStatus.Active,
            },
          });
        }
        if (memberType === MemberOfferingType.Preacher) {
          existsOffering = await this.offeringIncomeRepository.find({
            where: {
              id: Not(id),
              type: type,
              subType: subType,
              category: category,
              date: new Date(date),
              currency: currency,
              memberType: memberType,
              preacher: memberValue as Preacher,
              recordStatus: RecordStatus.Active,
            },
          });
        }
        if (memberType === MemberOfferingType.Disciple) {
          existsOffering = await this.offeringIncomeRepository.find({
            where: {
              id: Not(id),
              type: type,
              subType: subType,
              category: category,
              date: new Date(date),
              currency: currency,
              memberType: memberType,
              disciple: memberValue as Disciple,
              recordStatus: RecordStatus.Active,
            },
          });
        }
        if (memberType === MemberOfferingType.ExternalDonor) {
          existsOffering = await this.offeringIncomeRepository.find({
            where: {
              id: Not(id),
              type: type,
              subType: subType,
              category: category,
              date: new Date(date),
              currency: currency,
              memberType: memberType,
              externalDonor: externalDonor,
              recordStatus: RecordStatus.Active,
            },
          });
        }
      }

      //* Income adjustment
      if (type === OfferingIncomeCreationType.IncomeAdjustment) {
        existsOffering = await this.offeringIncomeRepository.find({
          where: {
            id: Not(id),
            type: type,
            date: new Date(date),
            currency: currency,
            memberType: memberType ?? IsNull(),
            pastor: (memberValue as Pastor) ?? IsNull(),
            copastor: (memberValue as Copastor) ?? IsNull(),
            supervisor: (memberValue as Supervisor) ?? IsNull(),
            preacher: (memberValue as Preacher) ?? IsNull(),
            disciple: (memberValue as Disciple) ?? IsNull(),
            recordStatus: RecordStatus.Active,
          },
        });
      }

      if (existsOffering.length > 0) {
        const newDate = dateFormatterToDDMMYYYY(new Date(date).getTime());

        throw new NotFoundException(
          `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Divisa: ${currency} y Fecha: ${newDate}.\nSi desea hacer cambio de divisa, debe hacerlo desde el modulo Eliminar Ingreso.`,
        );
      }

      const updatedOfferingIncome = await this.offeringIncomeRepository.preload(
        {
          id: offering?.id,
          ...updateOfferingIncomeDto,
          shift: shift === '' ? null : shift,
          memberType: !memberType ? null : memberType,
          amount: +amount,
          imageUrls: [...offering.imageUrls, ...imageUrls],
          church: church,
          familyGroup: familyGroup,
          zone: zone,
          disciple:
            memberType === MemberOfferingType.Disciple ? memberValue : null,
          preacher:
            memberType === MemberOfferingType.Preacher ? memberValue : null,
          supervisor:
            memberType === MemberOfferingType.Supervisor ? memberValue : null,
          copastor:
            memberType === MemberOfferingType.Copastor ? memberValue : null,
          pastor: memberType === MemberOfferingType.Pastor ? memberValue : null,
          externalDonor: externalDonor,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        },
      );

      const savedOffering = await this.offeringIncomeRepository.save(
        updatedOfferingIncome,
      );

      //* Generate a new PDF receipt with the provided data
      const pdfDoc =
        await this.reportsService.generateReceiptByOfferingIncomeId(
          savedOffering.id,
          { generationType: 'without-qr' },
        );

      //* Upload the generated receipt to Cloudinary
      const uploadedImageUrl = await this.cloudinaryService.uploadPdfAsWebp({
        pdfDoc,
        fileName: updatedOfferingIncome.receiptCode,
        fileFolder: FileFolder.Income,
        offeringType: type,
        offeringSubType: subType,
      });

      //* Update record with the uploaded image URL
      const updateOffering = await this.offeringIncomeRepository.preload({
        id: savedOffering.id,
        imageUrls: [uploadedImageUrl],
      });

      return await this.offeringIncomeRepository.save(updateOffering);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error, {
        email: 'El correo electrónico ya está en uso.',
      });
    }
  }

  //? Method to get the prefix based on the subType
  private getPrefixBySubType(subType: string): string | null {
    const mapping = {
      sunday_service: 'CD',
      family_group: 'GF',
      general_fasting: 'AG',
      general_vigil: 'VG',
      zonal_fasting: 'AZ',
      zonal_vigil: 'VZ',
      general_evangelism: 'EG',
      zonal_evangelism: 'EZ',
      sunday_school: 'ED',
      youth_service: 'CJ',
      teenager_service: 'CA',
      united_service: 'CU',
      zonal_united_service: 'CUZ',
      activities: 'AC',
      church_ground: 'TI',
      special: 'OE',
      income_adjustment: 'AI',
    };
    return mapping[subType] || null;
  }

  //? Method to generate the next receipt code
  private async generateNextReceipt(
    prefix: string,
    churchId: string,
  ): Promise<string> {
    const lastRecord = await this.offeringIncomeRepository
      .createQueryBuilder('offeringIncome')
      .where('offeringIncome.receiptCode LIKE :prefix', {
        prefix: `ROF-${prefix}-%`,
      })
      .andWhere('offeringIncome.church_id = :churchId', { churchId })
      .orderBy('offeringIncome.receiptCode', 'DESC')
      .getOne();

    const nextSequenceNumber = lastRecord
      ? parseInt(lastRecord.receiptCode.split('-').pop() ?? '0', 10) + 1
      : 1;

    return `ROF-${prefix}-${String(nextSequenceNumber).padStart(8, '0')}`;
  }
}
