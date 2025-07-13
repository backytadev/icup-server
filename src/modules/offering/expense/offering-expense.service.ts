import {
  Logger,
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { format } from 'date-fns';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, Repository } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';

import { PaginationDto } from '@/common/dtos/pagination.dto';
import { SearchAndPaginationDto } from '@/common/dtos/search-and-pagination.dto';

import { User } from '@/modules/user/entities/user.entity';
import { Church } from '@/modules/church/entities/church.entity';

import {
  OfferingInactivationReason,
  OfferingInactivationReasonNames,
} from '@/modules/offering/shared/enums/offering-inactivation-reason.enum';
import { InactivateOfferingDto } from '@/modules/offering/shared/dto/inactivate-offering.dto';

import { CreateOfferingExpenseDto } from '@/modules/offering/expense/dto/create-offering-expense.dto';
import { UpdateOfferingExpenseDto } from '@/modules/offering/expense/dto/update-offering-expense.dto';

import {
  OfferingExpenseSearchType,
  OfferingExpenseSearchTypeNames,
} from '@/modules/offering/expense/enums/offering-expense-search-type.enum';
import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';
import { formatDataOfferingExpense } from '@/modules/offering/expense/helpers/format-data-offering-expense.helper';

@Injectable()
export class OfferingExpenseService {
  private readonly logger = new Logger('OfferingExpensesService');

  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(OfferingExpense)
    private readonly offeringExpenseRepository: Repository<OfferingExpense>,
  ) {}

  //* CREATE OFFERING EXPENSE
  async create(
    createOfferingExpenseDto: CreateOfferingExpenseDto,
    user: User,
  ): Promise<OfferingExpense> {
    const { churchId, type, imageUrls, amount, date, currency } =
      createOfferingExpenseDto;

    //? All Types
    if (
      type === OfferingExpenseSearchType.SuppliesExpenses ||
      type === OfferingExpenseSearchType.DecorationExpenses ||
      type === OfferingExpenseSearchType.OperationalExpenses ||
      type === OfferingExpenseSearchType.MaintenanceAndRepairExpenses ||
      type === OfferingExpenseSearchType.PlaningEventsExpenses ||
      type === OfferingExpenseSearchType.EquipmentAndTechnologyExpenses ||
      type === OfferingExpenseSearchType.OtherExpenses
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

      try {
        const newOfferingExpense = this.offeringExpenseRepository.create({
          ...createOfferingExpenseDto,
          amount: +amount,
          church: church,
          imageUrls: imageUrls,
          createdAt: new Date(),
          createdBy: user,
        });

        return await this.offeringExpenseRepository.save(newOfferingExpense);
      } catch (error) {
        this.handleDBExceptions(error);
      }
    }

    //? Expense adjustment
    if (type === OfferingExpenseSearchType.ExpensesAdjustment) {
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
      const existsOffering = await this.offeringExpenseRepository.find({
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
          `Ya existe un registro con este Tipo: ${OfferingExpenseSearchTypeNames[type]} (mismos datos), Divisa: ${currency} y Fecha: ${offeringDate}.`,
        );
      }

      try {
        const newOfferingIncome = this.offeringExpenseRepository.create({
          ...createOfferingExpenseDto,
          amount: +amount,
          subType: null,
          church: church,
          imageUrls: imageUrls,
          createdAt: new Date(),
          createdBy: user,
        });

        return await this.offeringExpenseRepository.save(newOfferingIncome);
      } catch (error) {
        this.handleDBExceptions(error);
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
          where: { id: churchId, recordStatus: RecordStatus.Active },
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

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            date: Between(fromDate, toDate),
            recordStatus: RecordStatus.Active,
          },
          take: limit,
          skip: offset,
          relations: ['updatedBy', 'createdBy', 'church'],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (offeringExpenses.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return formatDataOfferingExpense({
          offeringExpenses: offeringExpenses,
        }) as any;
      }

      if (!searchDate) {
        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: { church: church, recordStatus: RecordStatus.Active },
          take: limit,
          skip: offset,

          relations: ['updatedBy', 'createdBy', 'church'],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (offeringExpenses.length === 0) {
          throw new NotFoundException(
            `No existen registros disponibles para mostrar.`,
          );
        }

        return formatDataOfferingExpense({
          offeringExpenses: offeringExpenses,
        }) as any;
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* FIND BY TERM
  async findByTerm(
    term: string,
    searchTypeAndPaginationDto: SearchAndPaginationDto,
  ): Promise<OfferingExpense[]> {
    const {
      searchType,
      searchSubType,
      limit,
      offset = 0,
      order,
      churchId,
    } = searchTypeAndPaginationDto;

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

    //* By date and church
    if (
      term &&
      (searchType === OfferingExpenseSearchType.PlaningEventsExpenses ||
        searchType === OfferingExpenseSearchType.DecorationExpenses ||
        searchType ===
          OfferingExpenseSearchType.EquipmentAndTechnologyExpenses ||
        searchType === OfferingExpenseSearchType.MaintenanceAndRepairExpenses ||
        searchType === OfferingExpenseSearchType.OperationalExpenses ||
        searchType === OfferingExpenseSearchType.SuppliesExpenses ||
        searchType === OfferingExpenseSearchType.OtherExpenses ||
        searchType === OfferingExpenseSearchType.ExpensesAdjustment)
    ) {
      try {
        const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

        if (isNaN(fromTimestamp)) {
          throw new NotFoundException('Formato de marca de tiempo invalido.');
        }

        const fromDate = new Date(fromTimestamp);
        const toDate = toTimestamp ? new Date(toTimestamp) : fromDate;

        let offeringExpenses: OfferingExpense[];
        if (searchType !== OfferingExpenseSearchType.ExpensesAdjustment) {
          offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: searchType,
              subType: searchSubType ? searchSubType : null,
              date: Between(fromDate, toDate),
              recordStatus: RecordStatus.Active,
            },
            take: limit,
            skip: offset,
            relations: ['updatedBy', 'createdBy', 'church'],
            order: { createdAt: order as FindOptionsOrderValue },
          });
        }

        if (searchType === OfferingExpenseSearchType.ExpensesAdjustment) {
          offeringExpenses = await this.offeringExpenseRepository.find({
            where: {
              church: church,
              type: searchType,
              date: Between(fromDate, toDate),
              recordStatus: RecordStatus.Active,
            },
            take: limit,
            skip: offset,
            relations: ['updatedBy', 'createdBy', 'church'],
            order: { createdAt: order as FindOptionsOrderValue },
          });
        }

        if (offeringExpenses.length === 0) {
          const fromDate = dateFormatterToDDMMYYYY(fromTimestamp);
          const toDate = dateFormatterToDDMMYYYY(toTimestamp);

          throw new NotFoundException(
            `No se encontraron salidas de ofrendas (${OfferingExpenseSearchTypeNames[searchType]}) con este rango de fechas: ${fromDate} - ${toDate} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return formatDataOfferingExpense({
          offeringExpenses: offeringExpenses,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }

    //* By record status --> Many
    if (term && searchType === OfferingExpenseSearchType.RecordStatus) {
      const recordStatusTerm = term.toLowerCase();
      const validRecordStatus = ['active', 'inactive'];

      try {
        if (!validRecordStatus.includes(recordStatusTerm)) {
          throw new BadRequestException(
            `Estado de registro no válido: ${term}`,
          );
        }

        const offeringExpenses = await this.offeringExpenseRepository.find({
          where: {
            church: church,
            recordStatus: recordStatusTerm,
          },
          take: limit,
          skip: offset,
          relations: ['updatedBy', 'createdBy', 'church'],
          order: { createdAt: order as FindOptionsOrderValue },
        });

        if (offeringExpenses.length === 0) {
          const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

          throw new NotFoundException(
            `No se encontraron salidas de ofrendas (${OfferingExpenseSearchTypeNames[searchType]}) con este estado de registro: ${value} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
          );
        }

        return formatDataOfferingExpense({
          offeringExpenses: offeringExpenses,
        }) as any;
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }

        if (error instanceof BadRequestException) {
          throw error;
        }

        this.handleDBExceptions(error);
      }
    }
  }

  //* UPDATE OFFERING EXPENSE
  async update(
    id: string,
    updateOfferingExpenseDto: UpdateOfferingExpenseDto,
    user: User,
  ) {
    const { type, amount, subType, churchId, imageUrls, recordStatus } =
      updateOfferingExpenseDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    //* Validations
    const offeringExpense = await this.offeringExpenseRepository.findOne({
      where: { id: id },
      relations: ['church'],
    });

    if (!offeringExpense) {
      throw new NotFoundException(
        `Salida de Ofrenda con id: ${id} no fue encontrado`,
      );
    }

    if (
      offeringExpense?.recordStatus === RecordStatus.Active &&
      recordStatus === RecordStatus.Inactive
    ) {
      throw new BadRequestException(
        `No se puede actualizar un registro a "Inactivo", se debe eliminar.`,
      );
    }

    if (type && type !== offeringExpense?.type) {
      throw new BadRequestException(
        `No se puede actualizar el tipo de este registro.`,
      );
    }

    if (subType && subType !== offeringExpense?.subType) {
      throw new BadRequestException(
        `No se puede actualizar el sub-tipo de este registro.`,
      );
    }

    if (churchId && churchId !== offeringExpense?.church?.id) {
      throw new BadRequestException(
        `No se puede actualizar la Iglesia a la que pertenece este registro.`,
      );
    }

    try {
      const updatedOfferingIncome =
        await this.offeringExpenseRepository.preload({
          id: offeringExpense?.id,
          ...updateOfferingExpenseDto,
          amount: +amount,
          imageUrls: [...offeringExpense.imageUrls, ...imageUrls],
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: recordStatus,
        });

      return await this.offeringExpenseRepository.save(updatedOfferingIncome);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //! INACTIVATE OFFERING EXPENSE
  async remove(
    id: string,
    inactivateOfferingExpenseDto: InactivateOfferingDto,
    user: User,
  ): Promise<void> {
    const { offeringInactivationReason, offeringInactivationDescription } =
      inactivateOfferingExpenseDto;

    if (!isUUID(id)) {
      throw new BadRequestException(`UUID no valido.`);
    }

    const offeringExpense = await this.offeringExpenseRepository.findOne({
      where: { id: id },
      relations: ['church'],
    });

    if (!offeringExpense) {
      throw new NotFoundException(
        `Salida de Ofrenda con id: ${id} no fue encontrado`,
      );
    }

    const existingComments = offeringExpense.comments || '';
    const newComments: string = `Detalles de la inactivación:\n📅Fecha de inactivación: ${format(new Date(), 'dd/MM/yyyy')}\n📁 Motivo de inactivación: ${OfferingInactivationReasonNames[offeringInactivationReason as OfferingInactivationReason]}\n📄 Descripción de inactivación: ${offeringInactivationDescription}\n👤 Usuario responsable: ${user.firstNames} ${user.lastNames}`;
    const updatedComments = existingComments
      ? `${existingComments}\n\n${newComments}`
      : `${newComments}`;

    //* Update and set in Inactive on Offering Expense
    try {
      const updatedOfferingExpense =
        await this.offeringExpenseRepository.preload({
          id: offeringExpense.id,
          comments: updatedComments,
          inactivationReason: offeringInactivationReason,
          updatedAt: new Date(),
          updatedBy: user,
          recordStatus: RecordStatus.Inactive,
        });

      await this.offeringExpenseRepository.save(updatedOfferingExpense);
    } catch (error) {
      this.handleDBExceptions(error);
    }

    return;
  }

  //? PRIVATE METHODS
  // For future index errors or constrains with code.
  private handleDBExceptions(error: any): never {
    if (error.code === '23505') {
      throw new BadRequestException(`${error.message}`);
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
