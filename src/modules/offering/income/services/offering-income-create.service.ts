import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExternalDonor } from '@/modules/external-donor/entities/external-donor.entity';

import {
  MemberOfferingType,
  MemberOfferingTypeNames,
} from '@/modules/offering/income/enums/member-offering-type.enum';
import {
  OfferingIncomeCreationSubType,
  OfferingIncomeCreationSubTypeNames,
} from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';
import {
  OfferingIncomeCreationCategory,
  OfferingIncomeCreationCategoryNames,
} from '@/modules/offering/income/enums/offering-income-creation-category.enum';
import {
  OfferingIncomeCreationType,
  OfferingIncomeCreationTypeNames,
} from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import { OfferingIncomeCreationShiftTypeNames } from '@/modules/offering/income/enums/offering-income-creation-shift-type.enum';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { OfferingFileType } from '@/common/enums/offering-file-type.enum';

import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';

import { BaseService } from '@/common/services/base.service';

import { CreateOfferingIncomeDto } from '@/modules/offering/income/dto/create-offering-income.dto';

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
export class OfferingIncomeCreateService extends BaseService {
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

  //* CREATE OFFERING INCOME
  async create(
    createOfferingIncomeDto: CreateOfferingIncomeDto,
    user: User,
  ): Promise<OfferingIncome> {
    const {
      type,
      shift,
      date,
      zoneId,
      amount,
      subType,
      category,
      memberId,
      comments,
      externalDonorId,
      isNewExternalDonor,
      externalDonorFirstNames,
      externalDonorLastNames,
      externalDonorGender,
      externalDonorBirthDate,
      externalDonorPhoneNumber,
      externalDonorEmail,
      externalDonorOriginCountry,
      externalDonorResidenceCountry,
      externalDonorResidenceCity,
      externalDonorPostalCode,
      churchId,
      currency,
      imageUrls,
      memberType,
      familyGroupId,
    } = createOfferingIncomeDto;

    //* Obtenemos el prefijo basado en el subTipo
    const prefix = this.getPrefixBySubType(
      type === OfferingIncomeCreationType.IncomeAdjustment ? type : subType,
    );

    if (!prefix) {
      throw new Error('Invalid subType for receipt generation');
    }

    //* Generamos el código de recibo antes de guardar la entidad
    const receiptCode = await this.generateNextReceipt(prefix, churchId);

    //* Validations
    if (type === OfferingIncomeCreationType.Offering) {
      //? Family group
      if (subType === OfferingIncomeCreationSubType.FamilyGroup) {
        if (!churchId) {
          throw new NotFoundException(`La iglesia es requerida.`);
        }

        const church = await this.churchRepository.findOne({
          where: { id: churchId },
          relations: ['theirMainChurch'],
        });

        if (!church) {
          throw new NotFoundException(
            `Iglesia con id: ${churchId}, no fue encontrado.`,
          );
        }

        if (!church?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        if (!familyGroupId) {
          throw new NotFoundException(`El Grupo Familiar es requerido.`);
        }

        const familyGroup = await this.familyGroupRepository.findOne({
          where: { id: familyGroupId },
          relations: [
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
            'theirZone',
            'theirPreacher.member',
          ],
        });

        if (!familyGroup) {
          throw new NotFoundException(
            `Grupo familiar con id: ${familyGroupId}, no fue encontrado.`,
          );
        }

        if (!familyGroup?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Grupo familiar debe ser "Activo".`,
          );
        }

        //* Validate if exists record already
        const existsOffering = await this.offeringIncomeRepository.find({
          where: {
            subType: subType,
            category: category,
            church: church,
            familyGroup: familyGroup,
            date: new Date(date),
            currency: currency,
            recordStatus: RecordStatus.Active,
          },
        });

        if (existsOffering.length > 0) {
          const offeringDate = dateFormatterToDDMMYYYY(
            new Date(date).getTime(),
          );

          throw new NotFoundException(
            `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Iglesia: ${church.abbreviatedChurchName}, Categoría: ${OfferingIncomeCreationCategoryNames[category]}, Divisa: ${currency} y Fecha: ${offeringDate}.`,
          );
        }

        //* Create offering
        try {
          const newOfferingIncome = this.offeringIncomeRepository.create({
            ...createOfferingIncomeDto,
            amount: +amount,
            church: church,
            disciple: null,
            preacher: null,
            supervisor: null,
            copastor: null,
            pastor: null,
            zone: null,
            memberType: null,
            shift: null,
            comments: !comments || comments === '' ? null : comments,
            category: category,
            imageUrls: imageUrls,
            familyGroup: familyGroup,
            receiptCode: receiptCode,
            createdAt: new Date(),
            createdBy: user,
          });

          const savedOffering =
            await this.offeringIncomeRepository.save(newOfferingIncome);

          //* Generate a new PDF receipt with the provided data
          const pdfDoc =
            await this.reportsService.generateReceiptByOfferingIncomeId(
              savedOffering.id,
              { generationType: 'without-qr' },
            );

          //* Upload the generated receipt to Cloudinary
          const uploadedImageUrl = await this.cloudinaryService.uploadPdfAsWebp(
            {
              pdfDoc,
              fileName: receiptCode,
              fileType: OfferingFileType.Income,
              offeringType: type,
              offeringSubType: subType,
            },
          );

          //* Update record with the uploaded image URL
          const updateOffering = await this.offeringIncomeRepository.preload({
            id: savedOffering.id,
            imageUrls: [uploadedImageUrl],
          });

          return await this.offeringIncomeRepository.save(updateOffering);
        } catch (error) {
          this.handleDBExceptions(error, {
            email: 'El correo electrónico ya está en uso.',
          });
        }
      }

      //? Sunday service
      if (subType === OfferingIncomeCreationSubType.SundayService) {
        if (!churchId) {
          throw new NotFoundException(`La iglesia es requerida.`);
        }

        const church = await this.churchRepository.findOne({
          where: { id: churchId },
          relations: ['theirMainChurch'],
        });

        if (!church) {
          throw new NotFoundException(
            `Iglesia con id: ${churchId}, no fue encontrado.`,
          );
        }

        if (!church?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        //* Validate if exists record already
        const existsOffering = await this.offeringIncomeRepository.find({
          where: {
            subType: subType,
            category: category,
            church: church,
            shift: shift,
            date: new Date(date),
            currency: currency,
            recordStatus: RecordStatus.Active,
          },
        });

        if (existsOffering.length > 0) {
          const offeringDate = dateFormatterToDDMMYYYY(
            new Date(date).getTime(),
          );

          throw new NotFoundException(
            `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Iglesia: ${church.abbreviatedChurchName}, Categoría: ${OfferingIncomeCreationCategoryNames[category]}, Divisa: ${currency}, Turno: ${OfferingIncomeCreationShiftTypeNames[shift]} y Fecha: ${offeringDate}.`,
          );
        }

        if (!shift) {
          throw new NotFoundException(`El turno es requerido.`);
        }

        if (
          !Object.keys(OfferingIncomeCreationShiftTypeNames).includes(shift)
        ) {
          throw new NotFoundException(
            `El turno debe ser uno de los siguientes valores:${Object.values(OfferingIncomeCreationShiftTypeNames).join(', ')} `,
          );
        }

        //* Create offering
        try {
          const newOfferingIncome = this.offeringIncomeRepository.create({
            ...createOfferingIncomeDto,
            amount: +amount,
            church: church,
            disciple: null,
            preacher: null,
            supervisor: null,
            copastor: null,
            pastor: null,
            zone: null,
            familyGroup: null,
            memberType: null,
            category: category,
            shift: shift,
            comments: !comments || comments === '' ? null : comments,
            imageUrls: imageUrls,
            receiptCode: receiptCode,
            createdAt: new Date(),
            createdBy: user,
          });

          const savedOffering =
            await this.offeringIncomeRepository.save(newOfferingIncome);

          //* Generate a new PDF receipt with the provided data
          const pdfDoc =
            await this.reportsService.generateReceiptByOfferingIncomeId(
              savedOffering.id,
              { generationType: 'without-qr' },
            );

          //* Upload the generated receipt to Cloudinary
          const uploadedImageUrl = await this.cloudinaryService.uploadPdfAsWebp(
            {
              pdfDoc,
              fileName: receiptCode,
              fileType: OfferingFileType.Income,
              offeringType: type,
              offeringSubType: subType,
            },
          );

          //* Update record with the uploaded image URL
          const updateOffering = await this.offeringIncomeRepository.preload({
            id: savedOffering.id,
            imageUrls: [uploadedImageUrl],
          });

          return await this.offeringIncomeRepository.save(updateOffering);
        } catch (error) {
          this.handleDBExceptions(error, {
            email: 'El correo electrónico ya está en uso.',
          });
        }
      }

      //? Sunday School, Youth service, Teenager Service, Church Ground, Special
      if (
        subType === OfferingIncomeCreationSubType.SundaySchool ||
        subType === OfferingIncomeCreationSubType.YouthService ||
        subType === OfferingIncomeCreationSubType.TeenagerService ||
        subType === OfferingIncomeCreationSubType.ChurchGround ||
        subType === OfferingIncomeCreationSubType.Special
      ) {
        if (!churchId) {
          throw new NotFoundException(`La iglesia es requerida.`);
        }

        const church = await this.churchRepository.findOne({
          where: { id: churchId },
          relations: ['theirMainChurch'],
        });

        if (!church) {
          throw new NotFoundException(
            `Iglesia con id: ${churchId}, no fue encontrado.`,
          );
        }

        if (!church?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        let externalDonor: ExternalDonor;
        if (externalDonorId) {
          externalDonor = await this.externalDonorRepository.findOne({
            where: { id: externalDonorId },
          });

          if (!externalDonor) {
            throw new NotFoundException(
              `Donador externo con id: ${externalDonorId}, no fue encontrado.`,
            );
          }
        }

        //* Validate if exists record already
        let existsOffering: OfferingIncome[];
        if (category === OfferingIncomeCreationCategory.OfferingBox) {
          existsOffering = await this.offeringIncomeRepository.find({
            where: {
              subType: subType,
              category: category,
              church: church,
              shift: shift,
              date: new Date(date),
              currency: currency,
              recordStatus: RecordStatus.Active,
            },
          });
        }

        if (
          category === OfferingIncomeCreationCategory.OfferingBox &&
          (subType === OfferingIncomeCreationSubType.YouthService ||
            subType === OfferingIncomeCreationSubType.TeenagerService)
        ) {
          existsOffering = await this.offeringIncomeRepository.find({
            where: {
              subType: subType,
              category: category,
              church: church,
              date: new Date(date),
              currency: currency,
              recordStatus: RecordStatus.Active,
            },
          });
        }

        if (
          category ===
            OfferingIncomeCreationCategory.FundraisingProChurchGround ||
          category === OfferingIncomeCreationCategory.FundraisingProMinistry
        ) {
          existsOffering = await this.offeringIncomeRepository.find({
            where: {
              subType: subType,
              category: category,
              church: church,
              date: new Date(date),
              currency: currency,
              recordStatus: RecordStatus.Active,
            },
          });
        }

        if (category === OfferingIncomeCreationCategory.ExternalDonation) {
          existsOffering = await this.offeringIncomeRepository.find({
            where: {
              subType: subType,
              category: category,
              externalDonor: externalDonor,
              church: church,
              date: new Date(date),
              currency: currency,
              recordStatus: RecordStatus.Active,
            },
          });
        }

        let pastor: Pastor;
        let copastor: Copastor;
        let supervisor: Supervisor;
        let preacher: Preacher;
        let disciple: Disciple;

        if (category === OfferingIncomeCreationCategory.InternalDonation) {
          if (memberType === MemberOfferingType.Pastor) {
            pastor = await this.pastorRepository.findOne({
              where: { id: memberId },
              relations: ['member', 'theirChurch'],
            });

            existsOffering = await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: subType,
                category: category,
                memberType: memberType,
                pastor: pastor,
                date: new Date(date),
                currency: currency,
                recordStatus: RecordStatus.Active,
              },
            });
          }

          if (memberType === MemberOfferingType.Copastor) {
            copastor = await this.copastorRepository.findOne({
              where: { id: memberId },
              relations: ['member', 'theirPastor', 'theirChurch'],
            });

            existsOffering = await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: subType,
                category: category,
                memberType: memberType,
                copastor: copastor,
                date: new Date(date),
                currency: currency,
                recordStatus: RecordStatus.Active,
              },
            });
          }
          if (memberType === MemberOfferingType.Supervisor) {
            supervisor = await this.supervisorRepository.findOne({
              where: { id: memberId },
              relations: [
                'member',
                'theirPastor',
                'theirCopastor',
                'theirZone',
                'theirChurch',
              ],
            });

            existsOffering = await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: subType,
                category: category,
                memberType: memberType,
                supervisor: supervisor,
                date: new Date(date),
                currency: currency,
                recordStatus: RecordStatus.Active,
              },
            });
          }

          if (memberType === MemberOfferingType.Preacher) {
            preacher = await this.preacherRepository.findOne({
              where: { id: memberId },
              relations: [
                'member',
                'theirCopastor',
                'theirPastor',
                'theirZone',
                'theirSupervisor',
                'theirChurch',
              ],
            });

            existsOffering = await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: subType,
                category: category,
                memberType: memberType,
                preacher: preacher,
                date: new Date(date),
                currency: currency,
                recordStatus: RecordStatus.Active,
              },
            });
          }

          if (memberType === MemberOfferingType.Disciple) {
            disciple = await this.discipleRepository.findOne({
              where: { id: memberId },
              relations: [
                'member',
                'theirPastor',
                'theirCopastor',
                'theirZone',
                'theirSupervisor',
                'theirPreacher',
                'theirChurch',
              ],
            });

            existsOffering = await this.offeringIncomeRepository.find({
              where: {
                church: church,
                subType: subType,
                category: category,
                memberType: memberType,
                disciple: disciple,
                date: new Date(date),
                currency: currency,
                recordStatus: RecordStatus.Active,
              },
            });
          }
        }

        if (existsOffering?.length > 0) {
          const offeringDate = dateFormatterToDDMMYYYY(
            new Date(date).getTime(),
          );

          if (
            category === OfferingIncomeCreationCategory.OfferingBox &&
            subType !== OfferingIncomeCreationSubType.YouthService &&
            subType !== OfferingIncomeCreationSubType.TeenagerService
          ) {
            throw new NotFoundException(
              `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Iglesia: ${church.abbreviatedChurchName}, Categoría: ${OfferingIncomeCreationCategoryNames[category]}, Divisa: ${currency}, Turno: ${OfferingIncomeCreationShiftTypeNames[shift]} y Fecha: ${offeringDate}.`,
            );
          }

          if (
            category === OfferingIncomeCreationCategory.OfferingBox &&
            (subType === OfferingIncomeCreationSubType.YouthService ||
              subType === OfferingIncomeCreationSubType.TeenagerService)
          ) {
            throw new NotFoundException(
              `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Iglesia: ${church.abbreviatedChurchName}, Categoría: ${OfferingIncomeCreationCategoryNames[category]}, y Fecha: ${offeringDate}.`,
            );
          }

          if (
            category ===
              OfferingIncomeCreationCategory.FundraisingProChurchGround ||
            category === OfferingIncomeCreationCategory.FundraisingProMinistry
          ) {
            throw new NotFoundException(
              `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]}, Iglesia: ${church.abbreviatedChurchName}, Categoría: ${OfferingIncomeCreationCategoryNames[category]}, Divisa: ${currency} y Fecha: ${offeringDate}.`,
            );
          }

          if (category === OfferingIncomeCreationCategory.ExternalDonation) {
            throw new NotFoundException(
              `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]}, Iglesia: ${church.abbreviatedChurchName}, Categoría: ${OfferingIncomeCreationCategoryNames[category]} (mismos nombres y apellidos), Divisa: ${currency} y Fecha: ${offeringDate}.`,
            );
          }

          if (category === OfferingIncomeCreationCategory.InternalDonation) {
            throw new NotFoundException(
              `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]}, Iglesia: ${church.abbreviatedChurchName}, Categoría: ${OfferingIncomeCreationCategoryNames[category]}, Divisa: ${currency}, Tipo de miembro: ${MemberOfferingTypeNames[memberType]} (mismos nombres y apellidos) y Fecha: ${offeringDate}.`,
            );
          }
        }

        if (
          subType === OfferingIncomeCreationSubType.SundaySchool &&
          category === OfferingIncomeCreationCategory.OfferingBox &&
          !shift
        ) {
          throw new NotFoundException(`El turno es requerido.`);
        }

        if (
          subType === OfferingIncomeCreationSubType.SundaySchool &&
          category === OfferingIncomeCreationCategory.OfferingBox &&
          !Object.keys(OfferingIncomeCreationShiftTypeNames).includes(shift)
        ) {
          throw new NotFoundException(
            `El turno debe ser uno de los siguientes valores:${Object.values(OfferingIncomeCreationShiftTypeNames).join(', ')} `,
          );
        }

        //? If is new donor, then create record
        if (isNewExternalDonor) {
          try {
            const newDonor = this.externalDonorRepository.create({
              firstNames: externalDonorFirstNames,
              lastNames: externalDonorLastNames,
              birthDate: externalDonorBirthDate ?? new Date(1900, 0, 1),
              gender: externalDonorGender,
              email: externalDonorEmail,
              phoneNumber: externalDonorPhoneNumber,
              originCountry: externalDonorOriginCountry,
              residenceCountry: externalDonorResidenceCountry,
              residenceCity: externalDonorResidenceCity,
              postalCode: externalDonorPostalCode,
              createdAt: new Date(),
              createdBy: user,
              recordStatus: RecordStatus.Active,
            });

            await this.externalDonorRepository.save(newDonor);

            const newOfferingIncome = this.offeringIncomeRepository.create({
              ...createOfferingIncomeDto,
              amount: +amount,
              pastor: null,
              copastor: null,
              supervisor: null,
              preacher: null,
              disciple: null,
              church: church ?? null,
              zone: null,
              familyGroup: null,
              shift: null,
              memberType: MemberOfferingType.ExternalDonor,
              category: category,
              externalDonor: newDonor,
              receiptCode: receiptCode,
              comments: !comments || comments === '' ? null : comments,
              imageUrls: imageUrls,
              createdAt: new Date(),
              createdBy: user,
            });

            const savedOffering =
              await this.offeringIncomeRepository.save(newOfferingIncome);

            //* Generate a new PDF receipt with the provided data
            const pdfDoc =
              await this.reportsService.generateReceiptByOfferingIncomeId(
                savedOffering.id,
                { generationType: 'without-qr' },
              );

            //* Upload the generated receipt to Cloudinary
            const uploadedImageUrl =
              await this.cloudinaryService.uploadPdfAsWebp({
                pdfDoc,
                fileName: receiptCode,
                fileType: OfferingFileType.Income,
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
            this.handleDBExceptions(error, {
              email: 'El correo electrónico ya está en uso.',
            });
          }
        }

        //? If not is new donor, search and assign donor
        try {
          const newOfferingIncome = this.offeringIncomeRepository.create({
            ...createOfferingIncomeDto,
            amount: +amount,
            pastor: pastor ?? null,
            copastor: copastor ?? null,
            supervisor: supervisor ?? null,
            preacher: preacher ?? null,
            disciple: disciple ?? null,
            church: church ?? null,
            zone: null,
            familyGroup: null,
            memberType:
              (!memberType || memberType === '') &&
              createOfferingIncomeDto.category !==
                OfferingIncomeCreationCategory.ExternalDonation &&
              createOfferingIncomeDto.category !==
                OfferingIncomeCreationCategory.InternalDonation
                ? null
                : memberType
                  ? memberType
                  : MemberOfferingType.ExternalDonor,
            shift: !shift || shift === '' ? null : shift,
            category: category,
            externalDonor: externalDonor ?? null,
            receiptCode: receiptCode,
            comments: !comments || comments === '' ? null : comments,
            imageUrls: imageUrls,
            createdAt: new Date(),
            createdBy: user,
          });

          const savedOffering =
            await this.offeringIncomeRepository.save(newOfferingIncome);

          //* Generate a new PDF receipt with the provided data
          const pdfDoc =
            await this.reportsService.generateReceiptByOfferingIncomeId(
              savedOffering.id,
              { generationType: 'without-qr' },
            );

          //* Upload the generated receipt to Cloudinary
          const uploadedImageUrl = await this.cloudinaryService.uploadPdfAsWebp(
            {
              pdfDoc,
              fileName: receiptCode,
              fileType: OfferingFileType.Income,
              offeringType: type,
              offeringSubType: subType,
            },
          );

          //* Update record with the uploaded image URL
          const updateOffering = await this.offeringIncomeRepository.preload({
            id: savedOffering.id,
            imageUrls: [uploadedImageUrl],
          });

          return await this.offeringIncomeRepository.save(updateOffering);
        } catch (error) {
          this.handleDBExceptions(error, {
            email: 'El correo electrónico ya está en uso.',
          });
        }
      }

      //? Zonal fasting and Zonal vigil and Zonal evangelism
      if (
        subType === OfferingIncomeCreationSubType.ZonalFasting ||
        subType === OfferingIncomeCreationSubType.ZonalVigil ||
        subType === OfferingIncomeCreationSubType.ZonalEvangelism ||
        subType === OfferingIncomeCreationSubType.ZonalUnitedService
      ) {
        if (!churchId) {
          throw new NotFoundException(`La iglesia es requerida.`);
        }

        const church = await this.churchRepository.findOne({
          where: { id: churchId },
          relations: ['theirMainChurch'],
        });

        if (!church) {
          throw new NotFoundException(
            `Iglesia con id: ${churchId}, no fue encontrado.`,
          );
        }

        if (!church?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        if (!zoneId) {
          throw new NotFoundException(`La Zona es requerida.`);
        }

        const zone = await this.zoneRepository.findOne({
          where: { id: zoneId },
          relations: [
            'theirChurch',
            'theirPastor.member',
            'theirCopastor.member',
            'theirSupervisor.member',
          ],
        });

        if (!zone) {
          throw new NotFoundException(
            `Zona con id: ${familyGroupId}, no fue encontrada.`,
          );
        }

        if (!zone?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Zona debe ser "Activo".`,
          );
        }

        //* Validate if exists record already
        const existsOffering = await this.offeringIncomeRepository.find({
          where: {
            church: church,
            category: category,
            subType: subType,
            zone: zone,
            date: new Date(date),
            currency: currency,
            recordStatus: RecordStatus.Active,
          },
        });

        if (existsOffering.length > 0) {
          const offeringDate = dateFormatterToDDMMYYYY(
            new Date(date).getTime(),
          );

          throw new NotFoundException(
            `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Iglesia: ${church.abbreviatedChurchName}, Divisa: ${currency} y Fecha: ${offeringDate}.`,
          );
        }

        try {
          const newOfferingIncome = this.offeringIncomeRepository.create({
            ...createOfferingIncomeDto,
            amount: +amount,
            church: church,
            disciple: null,
            preacher: null,
            supervisor: null,
            copastor: null,
            pastor: null,
            zone: zone,
            memberType: null,
            shift: null,
            imageUrls: imageUrls,
            receiptCode: receiptCode,
            familyGroup: null,
            comments: !comments || comments === '' ? null : comments,
            createdAt: new Date(),
            createdBy: user,
          });

          const savedOffering =
            await this.offeringIncomeRepository.save(newOfferingIncome);

          //* Generate a new PDF receipt with the provided data
          const pdfDoc =
            await this.reportsService.generateReceiptByOfferingIncomeId(
              savedOffering.id,
              { generationType: 'without-qr' },
            );

          //* Upload the generated receipt to Cloudinary
          const uploadedImageUrl = await this.cloudinaryService.uploadPdfAsWebp(
            {
              pdfDoc,
              fileName: receiptCode,
              fileType: OfferingFileType.Income,
              offeringType: type,
              offeringSubType: subType,
            },
          );

          //* Update record with the uploaded image URL
          const updateOffering = await this.offeringIncomeRepository.preload({
            id: savedOffering.id,
            imageUrls: [uploadedImageUrl],
          });

          return await this.offeringIncomeRepository.save(updateOffering);
        } catch (error) {
          this.handleDBExceptions(error, {
            email: 'El correo electrónico ya está en uso.',
          });
        }
      }

      //? General fasting, vigil, united service, activities
      if (
        subType === OfferingIncomeCreationSubType.GeneralVigil ||
        subType === OfferingIncomeCreationSubType.GeneralFasting ||
        subType === OfferingIncomeCreationSubType.GeneralEvangelism ||
        subType === OfferingIncomeCreationSubType.UnitedService ||
        subType === OfferingIncomeCreationSubType.Activities
      ) {
        if (!churchId) {
          throw new NotFoundException(`La iglesia es requerida.`);
        }

        const church = await this.churchRepository.findOne({
          where: { id: churchId },
          relations: ['theirMainChurch'],
        });

        if (!church) {
          throw new NotFoundException(
            `Iglesia con id: ${churchId}, no fue encontrado.`,
          );
        }

        if (!church?.recordStatus) {
          throw new BadRequestException(
            `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
          );
        }

        //* Validate if exists record already
        const existsOffering = await this.offeringIncomeRepository.find({
          where: {
            subType: subType,
            category: category,
            church: church,
            date: new Date(date),
            currency: currency,
            recordStatus: RecordStatus.Active,
          },
        });

        if (existsOffering.length > 0) {
          const offeringDate = dateFormatterToDDMMYYYY(
            new Date(date).getTime(),
          );

          throw new NotFoundException(
            `Ya existe un registro con este Tipo: ${OfferingIncomeCreationSubTypeNames[subType]} (mismos datos), Divisa: ${currency} y Fecha: ${offeringDate}.`,
          );
        }

        try {
          const newOfferingIncome = this.offeringIncomeRepository.create({
            ...createOfferingIncomeDto,
            amount: +amount,
            church: church,
            disciple: null,
            preacher: null,
            supervisor: null,
            copastor: null,
            pastor: null,
            zone: null,
            familyGroup: null,
            memberType: null,
            shift: null,
            receiptCode: receiptCode,
            imageUrls: imageUrls,
            comments: !comments || comments === '' ? null : comments,
            createdAt: new Date(),
            createdBy: user,
          });

          const savedOffering =
            await this.offeringIncomeRepository.save(newOfferingIncome);

          //* Generate a new PDF receipt with the provided data
          const pdfDoc =
            await this.reportsService.generateReceiptByOfferingIncomeId(
              savedOffering.id,
              { generationType: 'without-qr' },
            );

          //* Upload the generated receipt to Cloudinary
          const uploadedImageUrl = await this.cloudinaryService.uploadPdfAsWebp(
            {
              pdfDoc,
              fileName: receiptCode,
              fileType: OfferingFileType.Income,
              offeringType: type,
              offeringSubType: subType,
            },
          );

          //* Update record with the uploaded image URL
          const updateOffering = await this.offeringIncomeRepository.preload({
            id: savedOffering.id,
            imageUrls: [uploadedImageUrl],
          });

          return await this.offeringIncomeRepository.save(updateOffering);
        } catch (error) {
          this.handleDBExceptions(error, {
            email: 'El correo electrónico ya está en uso.',
          });
        }
      }
    }

    //? Income adjustment
    if (type === OfferingIncomeCreationType.IncomeAdjustment) {
      if (!churchId) {
        throw new NotFoundException(`La iglesia es requerida.`);
      }

      const church = await this.churchRepository.findOne({
        where: { id: churchId },
        relations: ['theirMainChurch'],
      });

      if (!church) {
        throw new NotFoundException(
          `Iglesia con id: ${churchId}, no fue encontrado.`,
        );
      }

      if (!church?.recordStatus) {
        throw new BadRequestException(
          `La propiedad "Estado de registro" en Iglesia debe ser "Activo".`,
        );
      }

      //* Validate if exists record already
      const existsOffering = await this.offeringIncomeRepository.find({
        where: {
          type: type,
          church: church,
          date: new Date(date),
          currency: currency,
          recordStatus: RecordStatus.Active,
        },
      });

      if (existsOffering.length > 0) {
        const offeringDate = dateFormatterToDDMMYYYY(new Date(date).getTime());

        throw new NotFoundException(
          `Ya existe un registro con este Tipo: ${OfferingIncomeCreationTypeNames[type]} (mismos datos), Divisa: ${currency} y Fecha: ${offeringDate}.`,
        );
      }

      try {
        const newOfferingIncome = this.offeringIncomeRepository.create({
          ...createOfferingIncomeDto,
          amount: +amount,
          subType: null,
          category: null,
          church: church,
          disciple: null,
          preacher: null,
          supervisor: null,
          copastor: null,
          pastor: null,
          memberType: null,
          shift: null,
          imageUrls: imageUrls,
          receiptCode: receiptCode,
          comments: !comments || comments === '' ? null : comments,
          zone: null,
          familyGroup: null,
          createdAt: new Date(),
          createdBy: user,
        });

        const savedOffering =
          await this.offeringIncomeRepository.save(newOfferingIncome);

        //* Generate a new PDF receipt with the provided data
        const pdfDoc =
          await this.reportsService.generateReceiptByOfferingIncomeId(
            savedOffering.id,
            { generationType: 'without-qr' },
          );

        //* Upload the generated receipt to Cloudinary
        const uploadedImageUrl = await this.cloudinaryService.uploadPdfAsWebp({
          pdfDoc,
          fileName: receiptCode,
          fileType: OfferingFileType.Income,
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
        this.handleDBExceptions(error, {
          email: 'El correo electrónico ya está en uso.',
        });
      }
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
