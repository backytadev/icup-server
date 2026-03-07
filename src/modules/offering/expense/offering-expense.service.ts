import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { format } from 'date-fns';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsOrderValue, Repository } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { BaseService } from '@/common/services/base.service';
import { dateFormatterToDDMMYYYY } from '@/common/helpers/date-formatter-to-ddmmyyy.helper';

import { PaginationDto } from '@/common/dtos/pagination.dto';

import { User } from '@/modules/user/entities/user.entity';
import { Church } from '@/modules/church/entities/church.entity';

import {
  OfferingInactivationReason,
  OfferingInactivationReasonNames,
} from '@/modules/offering/shared/enums/offering-inactivation-reason.enum';
import { InactivateOfferingDto } from '@/modules/offering/shared/dto/inactivate-offering.dto';

import { CreateOfferingExpenseDto } from '@/modules/offering/expense/dto/create-offering-expense.dto';
import { UpdateOfferingExpenseDto } from '@/modules/offering/expense/dto/update-offering-expense.dto';
import { OfferingExpenseSearchAndPaginationDto } from '@/modules/offering/expense/dto/offering-expense-search-and-pagination.dto';

import {
  OfferingExpenseSearchType,
  OfferingExpenseSearchTypeNames,
} from '@/modules/offering/expense/enums/offering-expense-search-type.enum';
import { OfferingExpense } from '@/modules/offering/expense/entities/offering-expense.entity';
import { formatDataOfferingExpense } from '@/modules/offering/expense/helpers/format-data-offering-expense.helper';
import { OfferingExpenseSearchStrategyFactory } from '@/modules/offering/expense/strategies/offering-expense-search-strategy.factory';

@Injectable()
export class OfferingExpenseService extends BaseService {
  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(OfferingExpense)
    private readonly offeringExpenseRepository: Repository<OfferingExpense>,

    private readonly offeringExpenseSearchStrategyFactory: OfferingExpenseSearchStrategyFactory,
  ) {
    super();
  }

  //* CREATE OFFERING EXPENSE
  async create(
    createOfferingExpenseDto: CreateOfferingExpenseDto,
    user: User,
  ): Promise<OfferingExpense> {
    const { type, amount, churchId, imageUrls, date, currency } =
      createOfferingExpenseDto;

    //? Expense types with sub-types
    if (type !== OfferingExpenseSearchType.ExpensesAdjustment) {
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

        return this.validateResult(
          offeringExpenses,
          'No existen registros disponibles para mostrar.',
        ) as any;
      }

      const offeringExpenses = await this.offeringExpenseRepository.find({
        where: { church: church, recordStatus: RecordStatus.Active },
        take: limit,
        skip: offset,
        relations: ['updatedBy', 'createdBy', 'church'],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      const result = this.validateResult(
        offeringExpenses,
        'No existen registros disponibles para mostrar.',
      );

      return formatDataOfferingExpense({
        offeringExpenses: result,
      }) as any;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handleDBExceptions(error);
    }
  }

  //* FIND BY FILTERS
  async findByFilters(
    searchAndPaginationDto: OfferingExpenseSearchAndPaginationDto,
  ): Promise<OfferingExpense[]> {
    const { searchType, searchSubType, term, limit, offset, order, churchId } =
      searchAndPaginationDto;

    if (!term) {
      throw new BadRequestException(`El termino de búsqueda es requerido.`);
    }

    let church: Church | undefined;
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

    return this.offeringExpenseSearchStrategyFactory
      .getStrategy(searchType)
      .execute({
        term,
        searchType,
        searchSubType,
        limit,
        offset,
        order,
        church,
        offeringExpenseRepository: this.offeringExpenseRepository,
      });
  }

  //* UPDATE OFFERING EXPENSE
  async update(
    id: string,
    updateOfferingExpenseDto: UpdateOfferingExpenseDto,
    user: User,
  ) {
    const { type, amount, subType, churchId, imageUrls, recordStatus } =
      updateOfferingExpenseDto;

    await this.validateId(id);

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

    await this.validateId(id);

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
}
