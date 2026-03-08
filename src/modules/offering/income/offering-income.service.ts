import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Not,
  IsNull,
  Between,
  Repository,
  FindOptionsOrderValue,
} from 'typeorm';
import { format } from 'date-fns';

import { ExternalDonor } from '@/modules/external-donor/entities/external-donor.entity';

import {
  OfferingInactivationReason,
  OfferingInactivationReasonNames,
} from '@/modules/offering/shared/enums/offering-inactivation-reason.enum';
import { CurrencyType } from '@/modules/offering/shared/enums/currency-type.enum';

import {
  MemberOfferingType,
  MemberOfferingTypeNames,
} from '@/modules/offering/income/enums/member-offering-type.enum';
import {
  ExchangeCurrencyTypes,
  ExchangeCurrencyTypesNames,
} from '@/modules/offering/income/enums/exchange-currency-type.enum';
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

import {
  extractPath,
  extractPublicId,
} from '@/modules/cloudinary/helpers/extract-data-secure-url.helper';
import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { BaseService } from '@/common/services/base.service';

import { OfferingIncomeSearchStrategyFactory } from '@/modules/offering/income/strategies/offering-income-search-strategy.factory';
import { OfferingIncomeSearchAndPaginationDto } from '@/modules/offering/income/dto/offering-income-search-and-pagination.dto';

import { InactivateOfferingDto } from '@/modules/offering/shared/dto/inactivate-offering.dto';

import { CreateOfferingIncomeDto } from '@/modules/offering/income/dto/create-offering-income.dto';
import { UpdateOfferingIncomeDto } from '@/modules/offering/income/dto/update-offering-income.dto';

import { offeringIncomeDataFormatter } from '@/modules/offering/income/helpers/offering-income-data-formatter.helper';

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
import { OfferingFileType } from '@/common/enums/offering-file-type.enum';

@Injectable()
export class OfferingIncomeService extends BaseService {
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
    private readonly searchStrategyFactory: OfferingIncomeSearchStrategyFactory,
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

  //* FIND ALL (PAGINATED)
  async findAll(paginationDto: PaginationDto): Promise<any[]> {
    const {
      limit,
      offset = 0,
      order = 'ASC',
      churchId,
      searchDate,
    } = paginationDto;

    try {
      let church: Church;
      if (churchId) {
        church = await this.churchRepository.findOne({
          where: {
            id: churchId,
            recordStatus: RecordStatus.Active,
          },
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (!church) {
          throw new NotFoundException(
            `Iglesia con id ${churchId} no fue encontrada.`,
          );
        }
      }

      if (searchDate) {
        const [fromTimestamp, toTimestamp] = searchDate?.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const fromDate = new Date(fromTimestamp);
        const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

        const offeringIncome = await this.offeringIncomeRepository.find({
          where: {
            church: church,
            date: Between(fromDate, toDate),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'church',
            'pastor.member',
            'copastor.member',
            'supervisor.member',
            'preacher.member',
            'disciple.member',
            'familyGroup.theirPreacher.member',
            'zone.theirSupervisor.member',
            'externalDonor',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (offeringIncome.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringIncome: offeringIncome,
        }) as any;
      }

      if (!searchDate) {
        const offeringIncome = await this.offeringIncomeRepository.find({
          where: {
            church: church,

            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: [
            'updatedBy',
            'createdBy',
            'church',
            'pastor.member',
            'copastor.member',
            'supervisor.member',
            'preacher.member',
            'disciple.member',
            'familyGroup.theirPreacher.member',
            'zone.theirSupervisor.member',
            'externalDonor',
          ],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (offeringIncome.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return offeringIncomeDataFormatter({
          offeringIncome: offeringIncome,
        }) as any;
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error, {
        email: 'El correo electrónico ya está en uso.',
      });
    }
  }

  //* FIND BY FILTERS
  async findByFilters(
    dto: OfferingIncomeSearchAndPaginationDto,
  ): Promise<OfferingIncome[]> {
    const {
      searchType,
      searchSubType,
      term,
      limit,
      offset = 0,
      order,
      churchId,
    } = dto;

    if (!term) {
      throw new BadRequestException(`El termino de búsqueda es requerido.`);
    }

    if (!searchType) {
      throw new BadRequestException(`El tipo de búsqueda es requerido.`);
    }

    //* Search Church
    let church: Church;
    if (churchId) {
      church = await this.churchRepository.findOne({
        where: { id: churchId, recordStatus: RecordStatus.Active },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (!church) {
        throw new NotFoundException(
          `Iglesia con id ${churchId} no fue encontrada.`,
        );
      }
    }

    //? Delegate to strategy
    const strategy = this.searchStrategyFactory.getStrategy(
      searchType,
      searchSubType,
    );

    return strategy.execute({
      term,
      searchType,
      searchSubType,
      limit,
      offset,
      order,
      church,
      offeringIncomeRepository: this.offeringIncomeRepository,
      zoneRepository: this.zoneRepository,
      preacherRepository: this.preacherRepository,
      supervisorRepository: this.supervisorRepository,
      familyGroupRepository: this.familyGroupRepository,
    });
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
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error, {
        email: 'El correo electrónico ya está en uso.',
      });
    }
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
            fileType: OfferingFileType.Income,
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
            fileType: OfferingFileType.Income,
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
        fileType: OfferingFileType.Income,
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
