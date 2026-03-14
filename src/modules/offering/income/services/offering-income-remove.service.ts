import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { format } from 'date-fns';

import {
  OfferingInactivationReason,
  OfferingInactivationReasonNames,
} from '@/modules/offering/shared/enums/offering-inactivation-reason.enum';
import { CurrencyType } from '@/modules/offering/shared/enums/currency-type.enum';

import {
  ExchangeCurrencyTypes,
  ExchangeCurrencyTypesNames,
} from '@/modules/offering/income/enums/exchange-currency-type.enum';
import { OfferingIncomeCreationSubType } from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';
import { OfferingIncomeCreationType } from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import { OfferingIncomeCreationCategory } from '@/modules/offering/income/enums/offering-income-creation-category.enum';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { FileFolder } from '@/common/enums/file-folder.enum';

import {
  extractPath,
  extractPublicId,
} from '@/modules/cloudinary/helpers/extract-data-secure-url.helper';

import { BaseService } from '@/common/services/base.service';

import { InactivateOfferingDto } from '@/modules/offering/shared/dto/inactivate-offering.dto';

import { OfferingReportsService } from '@/modules/reports/services/offering-reports.service';

import { Zone } from '@/modules/zone/entities/zone.entity';
import { User } from '@/modules/user/entities/user.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { FamilyGroup } from '@/modules/family-group/entities/family-group.entity';
import { OfferingIncome } from '@/modules/offering/income/entities/offering-income.entity';
import { CloudinaryService } from '@/modules/cloudinary/cloudinary.service';

@Injectable()
export class OfferingIncomeRemoveService extends BaseService {
  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,

    @InjectRepository(FamilyGroup)
    private readonly familyGroupRepository: Repository<FamilyGroup>,

    @InjectRepository(OfferingIncome)
    private readonly offeringIncomeRepository: Repository<OfferingIncome>,

    private readonly reportsService: OfferingReportsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    super();
  }

  //! INACTIVATE OFFERING INCOME
  async remove(
    id: string,
    inactivateOfferingIncomeDto: InactivateOfferingDto,
    user: User,
  ): Promise<void> {
    const {
      offeringInactivationReason,
      offeringInactivationDescription = '',
      exchangeRate,
      exchangeCurrencyTypes,
    } = inactivateOfferingIncomeDto;

    await this.validateId(id);

    const offeringIncome = await this.offeringIncomeRepository.findOne({
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

    if (!offeringIncome) {
      throw new NotFoundException(
        `Ingreso de Ofrenda con id: ${id} no fue encontrado.`,
      );
    }

    //? Actualizar ofrenda de destino con el monto convertido
    try {
      if (
        offeringInactivationReason ===
        OfferingInactivationReason.CurrencyExchange
      ) {
        let offeringDestiny: OfferingIncome;

        if (
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.SundayService ||
          offeringIncome.subType === OfferingIncomeCreationSubType.SundaySchool
        ) {
          offeringDestiny = await this.offeringIncomeRepository.findOne({
            where: {
              type: offeringIncome.type,
              category: offeringIncome.category,
              subType: offeringIncome.subType,
              date: offeringIncome.date,
              church: offeringIncome.church,
              shift:
                offeringIncome.category ===
                OfferingIncomeCreationCategory.OfferingBox
                  ? offeringIncome.shift
                  : IsNull(),
              currency:
                exchangeCurrencyTypes === ExchangeCurrencyTypes.USDtoPEN ||
                exchangeCurrencyTypes === ExchangeCurrencyTypes.EURtoPEN
                  ? CurrencyType.PEN
                  : exchangeCurrencyTypes === ExchangeCurrencyTypes.PENtoEUR
                    ? CurrencyType.EUR
                    : CurrencyType.USD,
              memberType: offeringIncome.memberType ?? IsNull(),
              pastor: offeringIncome.pastor ?? IsNull(),
              copastor: offeringIncome.copastor ?? IsNull(),
              supervisor: offeringIncome.supervisor ?? IsNull(),
              preacher: offeringIncome.preacher ?? IsNull(),
              disciple: offeringIncome.disciple ?? IsNull(),
              recordStatus: RecordStatus.Active,
            },
          });
        }

        if (
          offeringIncome.subType === OfferingIncomeCreationSubType.FamilyGroup
        ) {
          offeringDestiny = await this.offeringIncomeRepository.findOne({
            where: {
              type: offeringIncome.type,
              subType: offeringIncome.subType,
              category: offeringIncome.category,
              date: offeringIncome.date,
              church: offeringIncome.church,
              familyGroup: offeringIncome.familyGroup,
              currency:
                exchangeCurrencyTypes === ExchangeCurrencyTypes.USDtoPEN ||
                exchangeCurrencyTypes === ExchangeCurrencyTypes.EURtoPEN
                  ? CurrencyType.PEN
                  : exchangeCurrencyTypes === ExchangeCurrencyTypes.PENtoEUR
                    ? CurrencyType.EUR
                    : CurrencyType.USD,
              recordStatus: RecordStatus.Active,
            },
          });
        }

        if (
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.ZonalFasting ||
          offeringIncome.subType === OfferingIncomeCreationSubType.ZonalVigil ||
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.ZonalUnitedService ||
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.ZonalEvangelism
        ) {
          offeringDestiny = await this.offeringIncomeRepository.findOne({
            where: {
              type: offeringIncome.type,
              subType: offeringIncome.subType,
              category: offeringIncome.category,
              church: offeringIncome.church,
              date: offeringIncome.date,
              zone: offeringIncome.zone,
              currency:
                exchangeCurrencyTypes === ExchangeCurrencyTypes.USDtoPEN ||
                exchangeCurrencyTypes === ExchangeCurrencyTypes.EURtoPEN
                  ? CurrencyType.PEN
                  : exchangeCurrencyTypes === ExchangeCurrencyTypes.PENtoEUR
                    ? CurrencyType.EUR
                    : CurrencyType.USD,
              recordStatus: RecordStatus.Active,
            },
          });
        }

        if (
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.GeneralFasting ||
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.GeneralVigil ||
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.GeneralEvangelism ||
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.UnitedService ||
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.YouthService ||
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.TeenagerService ||
          offeringIncome.subType === OfferingIncomeCreationSubType.Activities
        ) {
          offeringDestiny = await this.offeringIncomeRepository.findOne({
            where: {
              type: offeringIncome.type,
              subType: offeringIncome.subType,
              category: offeringIncome.category,
              date: offeringIncome.date,
              church: offeringIncome.church,
              currency:
                exchangeCurrencyTypes === ExchangeCurrencyTypes.USDtoPEN ||
                exchangeCurrencyTypes === ExchangeCurrencyTypes.EURtoPEN
                  ? CurrencyType.PEN
                  : exchangeCurrencyTypes === ExchangeCurrencyTypes.PENtoEUR
                    ? CurrencyType.EUR
                    : CurrencyType.USD,
              recordStatus: RecordStatus.Active,
            },
          });
        }

        if (
          offeringIncome.subType ===
            OfferingIncomeCreationSubType.ChurchGround ||
          offeringIncome.subType === OfferingIncomeCreationSubType.Special
        ) {
          offeringDestiny = await this.offeringIncomeRepository.findOne({
            where: {
              type: offeringIncome.type,
              category: offeringIncome.category,
              subType: offeringIncome.subType,
              date: offeringIncome.date,
              church: offeringIncome.church,
              currency:
                exchangeCurrencyTypes === ExchangeCurrencyTypes.USDtoPEN ||
                exchangeCurrencyTypes === ExchangeCurrencyTypes.EURtoPEN
                  ? CurrencyType.PEN
                  : exchangeCurrencyTypes === ExchangeCurrencyTypes.PENtoEUR
                    ? CurrencyType.EUR
                    : CurrencyType.USD,
              memberType: offeringIncome.memberType ?? IsNull(),
              pastor: offeringIncome.pastor ?? IsNull(),
              copastor: offeringIncome.copastor ?? IsNull(),
              supervisor: offeringIncome.supervisor ?? IsNull(),
              preacher: offeringIncome.preacher ?? IsNull(),
              disciple: offeringIncome.disciple ?? IsNull(),
              recordStatus: RecordStatus.Active,
            },
          });
        }

        //? If it exists, the transformed amount is added to the existing record.
        if (offeringDestiny) {
          const currentComments = offeringDestiny.comments || '';
          const newComments = `Información de Conversión\n💲 Monto anterior: ${offeringDestiny.amount} ${offeringDestiny.currency}\n💰Tipo de cambio (precio): ${exchangeRate}\n💰 Tipo de cambio(moneda): ${ExchangeCurrencyTypesNames[exchangeCurrencyTypes]}\n💲 Monto añadido: ${(offeringIncome.amount * +exchangeRate).toFixed(2)} ${offeringDestiny.currency} (${offeringIncome.amount} ${offeringIncome.currency})`;
          const updatedComments = currentComments
            ? `${currentComments}\n\n${newComments}`
            : `${newComments}`;

          // * First, remove any previously attached images from the record (one or more)
          await Promise.all(
            offeringDestiny.imageUrls.map((secureUrl) => {
              return this.cloudinaryService.deleteDirectFileFromCloudinary(
                extractPublicId(secureUrl),
                extractPath(secureUrl),
              );
            }),
          );

          const updatedOffering = await this.offeringIncomeRepository.preload({
            id: offeringDestiny.id,
            comments: updatedComments,
            amount: parseFloat(
              (
                +offeringDestiny.amount +
                offeringIncome.amount * +exchangeRate
              ).toFixed(2),
            ),
            imageUrls: [],
            updatedAt: new Date(),
            updatedBy: user,
          });

          const savedOffering =
            await this.offeringIncomeRepository.save(updatedOffering);

          // * Generate a new PDF receipt with the provided data
          const pdfDoc =
            await this.reportsService.generateReceiptByOfferingIncomeId(
              savedOffering.id,
              { generationType: 'without-qr' },
            );

          // * Upload the generated receipt to Cloudinary
          const imageUrl = await this.cloudinaryService.uploadPdfAsWebp({
            pdfDoc,
            fileName: savedOffering.receiptCode,
            fileFolder: FileFolder.Income,
            offeringType: offeringIncome.type,
            offeringSubType: offeringIncome.subType,
          });

          //* Actualizar el registro con el nuevo url de la imagen
          const updateOffering = await this.offeringIncomeRepository.preload({
            id: savedOffering.id,
            imageUrls: [imageUrl],
          });

          await this.offeringIncomeRepository.save(updateOffering);
        }

        //* If there is no record to add the change to, it is created.
        if (!offeringDestiny) {
          const prefix = this.getPrefixBySubType(
            offeringIncome.type === OfferingIncomeCreationType.IncomeAdjustment
              ? offeringIncome.type
              : offeringIncome.subType,
          );

          if (!prefix) {
            throw new Error('Invalid subType for receipt generation');
          }

          //* Generate the new receipt code; the previous record retains its code for identification
          const receiptCode = await this.generateNextReceipt(
            prefix,
            offeringIncome.church.id,
          );

          //* Comments of change amount and currency for the new record
          const newComments = `Información de Conversión\n💲 Monto anterior: ${offeringIncome.amount} ${offeringIncome?.currency}\n💰Tipo de cambio (precio): ${exchangeRate}\n💲 Monto convertido: ${(+offeringIncome.amount * +exchangeRate).toFixed(2)} ${
            exchangeCurrencyTypes === ExchangeCurrencyTypes.USDtoPEN ||
            exchangeCurrencyTypes === ExchangeCurrencyTypes.EURtoPEN
              ? CurrencyType.PEN
              : exchangeCurrencyTypes === ExchangeCurrencyTypes.PENtoEUR
                ? CurrencyType.EUR
                : CurrencyType.USD
          } (${offeringIncome.amount} ${offeringIncome?.currency})`;

          //* Creation
          const newOffering = this.offeringIncomeRepository.create({
            type: offeringIncome.type,
            subType: offeringIncome.subType,
            category: offeringIncome.category,
            amount: parseFloat(
              (offeringIncome.amount * +exchangeRate).toFixed(2),
            ),
            currency:
              exchangeCurrencyTypes === ExchangeCurrencyTypes.USDtoPEN ||
              exchangeCurrencyTypes === ExchangeCurrencyTypes.EURtoPEN
                ? CurrencyType.PEN
                : exchangeCurrencyTypes === ExchangeCurrencyTypes.PENtoEUR
                  ? CurrencyType.EUR
                  : CurrencyType.USD,
            date: offeringIncome.date,
            comments: newComments,
            church: offeringIncome.church,
            pastor: offeringIncome.pastor,
            copastor: offeringIncome.copastor,
            supervisor: offeringIncome.supervisor,
            preacher: offeringIncome.preacher,
            disciple: offeringIncome.disciple,
            zone: offeringIncome.zone,
            memberType: offeringIncome.memberType,
            shift: offeringIncome.shift,
            receiptCode: receiptCode,
            imageUrls: [],
            familyGroup: offeringIncome.familyGroup,
            createdAt: new Date(),
            createdBy: user,
          });

          const savedOffering =
            await this.offeringIncomeRepository.save(newOffering);

          //* Generate the new receipt in PDF format with the data
          const pdfDoc =
            await this.reportsService.generateReceiptByOfferingIncomeId(
              savedOffering.id,
              { generationType: 'without-qr' },
            );

          //* Upload the generated receipt to Cloudinary
          const imageUrl = await this.cloudinaryService.uploadPdfAsWebp({
            pdfDoc,
            fileName: savedOffering.receiptCode,
            fileFolder: FileFolder.Income,
            offeringType: offeringIncome.type,
            offeringSubType: offeringIncome.subType,
          });

          //* Update the record with the new image URL
          const updateOffering = await this.offeringIncomeRepository.preload({
            id: savedOffering.id,
            imageUrls: [imageUrl],
          });

          await this.offeringIncomeRepository.save(updateOffering);
        }
      }

      //* Update and set in Inactive and info comments on Offering Income
      const existingComments = offeringIncome.comments || '';
      const exchangeRateComments = `Información de Inactivación\nDetalles de transformación\n📄 Observación: Este registro fue utilizado para convertir un monto a otra moneda. Los valores a continuación corresponden al monto transferido al voucher de destino.\n💱 Tipo de cambio(precio): ${exchangeRate}\n💰 Tipo de cambio(moneda): ${ExchangeCurrencyTypesNames[exchangeCurrencyTypes]}\n💲 Total monto cambiado: ${(offeringIncome.amount * +exchangeRate).toFixed(2)} ${
        exchangeCurrencyTypes === ExchangeCurrencyTypes.USDtoPEN ||
        exchangeCurrencyTypes === ExchangeCurrencyTypes.EURtoPEN
          ? CurrencyType.PEN
          : exchangeCurrencyTypes === ExchangeCurrencyTypes.PENtoEUR
            ? CurrencyType.EUR
            : CurrencyType.USD
      } (${offeringIncome.amount} ${offeringIncome?.currency})`;

      const removalInfoCommentsWithDescription: string = `Detalles de la inactivación\n📅 Fecha de inactivación: ${format(new Date(), 'dd/MM/yyyy')}\n📁 Motivo de inactivación: ${OfferingInactivationReasonNames[offeringInactivationReason as OfferingInactivationReason]}\n📄 Descripción de inactivación: ${offeringInactivationDescription}\n👤 Usuario responsable: ${user.firstNames} ${user.lastNames}`;
      const removalInfoComments: string = `Detalles de la inactivación:\n📅 Fecha de inactivación: ${format(new Date(), 'dd/MM/yyyy')}\n📁 Motivo de inactivación: ${OfferingInactivationReasonNames[offeringInactivationReason as OfferingInactivationReason]}\n👤 Usuario responsable: ${user.firstNames} ${user.lastNames}`;

      const updatedComments =
        exchangeRate && exchangeCurrencyTypes && existingComments
          ? `${existingComments}\n\n${exchangeRateComments}\n\n${removalInfoComments}`
          : exchangeRate && exchangeCurrencyTypes && !existingComments
            ? `${exchangeRateComments}\n\n${removalInfoComments}`
            : !exchangeRate && !exchangeCurrencyTypes && existingComments
              ? `${existingComments}\n\n${removalInfoCommentsWithDescription}`
              : `${removalInfoCommentsWithDescription}`;

      //! Delete (inactivate) the previous record and update its receipt
      //* First, delete the previous images from the record (one or more)
      await Promise.all(
        offeringIncome.imageUrls.map((secureUrl) => {
          return this.cloudinaryService.deleteDirectFileFromCloudinary(
            extractPublicId(secureUrl),
            extractPath(secureUrl),
          );
        }),
      );

      // * Generate the new one and place it in its position
      const deletedOfferingIncome = await this.offeringIncomeRepository.preload(
        {
          id: offeringIncome.id,
          comments: updatedComments,
          inactivationReason: offeringInactivationReason,
          imageUrls: [],
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: RecordStatus.Inactive,
        },
      );

      const savedDeletedOffering = await this.offeringIncomeRepository.save(
        deletedOfferingIncome,
      );

      //* Generate the new receipt in PDF format with the data
      const pdfDoc =
        await this.reportsService.generateReceiptByOfferingIncomeId(
          savedDeletedOffering.id,
          { generationType: 'without-qr' },
        );

      //* Upload the generated receipt to Cloudinary
      const imageUrl = await this.cloudinaryService.uploadPdfAsWebp({
        pdfDoc,
        fileName: savedDeletedOffering.receiptCode,
        fileFolder: FileFolder.Income,
        offeringType: offeringIncome.type,
        offeringSubType: offeringIncome.subType,
      });

      //* Update the record to set the new image
      const updateOffering = await this.offeringIncomeRepository.preload({
        id: savedDeletedOffering.id,
        imageUrls: [imageUrl],
      });

      await this.offeringIncomeRepository.save(updateOffering);
    } catch (error) {
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
