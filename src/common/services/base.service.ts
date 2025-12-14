import {
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { isUUID } from 'class-validator';

import { Church } from '@/modules/church/entities/church.entity';

import {
  FindSimpleQueryProps,
  FindDetailedQueryProps,
} from '@/common/interfaces/find-query-props.interface';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { FindOrFailProps } from '@/common/interfaces/find-or-fail-props.interface';

export class BaseService {
  protected readonly logger = new Logger(this.constructor.name);

  protected async validateId(
    id: string,
    message = 'UUID inválido',
  ): Promise<void> {
    if (!isUUID(id)) {
      throw new BadRequestException(message);
    }
  }

  protected validateResult<T>(
    items: T[],
    message = 'No existen registros disponibles para mostrar.',
  ): T[] {
    if (!items || items.length === 0) {
      throw new NotFoundException(message);
    }
    return items;
  }

  protected async findOrFail<T>({
    repository,
    where,
    relations = [],
    moduleName = '',
  }: FindOrFailProps<T>): Promise<T> {
    const [field, value] = Object.entries(where)[0];

    const data = await repository.findOne({
      where,
      relations,
    });

    if (!data) {
      throw new NotFoundException(
        `No se encontró ningún ${moduleName} con ${field}: ${value}`,
      );
    }

    return data;
  }

  protected async validateChurch(
    churchId: string,
    churchRepository: Repository<Church>,
  ): Promise<Church | null> {
    if (!churchId) {
      throw new BadRequestException(
        `El identificador de la iglesia es obligatorio para realizar esta operación.`,
      );
    }

    const church = await churchRepository.findOne({
      where: { id: churchId, recordStatus: RecordStatus.Active },
    });

    if (!church) {
      throw new NotFoundException(
        `Iglesia con id ${churchId} no fue encontrada.`,
      );
    }

    return church;
  }

  protected async findBasicQuery<T>({
    mainRepository,
    churchRepository,
    churchId,
    relations,
    order,
  }: FindSimpleQueryProps<T>): Promise<T[]> {
    let church: Church | null = null;
    if (churchId && churchRepository) {
      church = await this.validateChurch(churchId, churchRepository);
    }

    const data = await mainRepository.find({
      where: {
        recordStatus: RecordStatus.Active,
        ...(church && { theirChurch: church }),
      } as any,
      order: { createdAt: order } as any,
      relations,
    });

    return this.validateResult(data);
  }

  protected async findDetailedQuery<T>({
    mainRepository,
    churchRepository,
    churchId,
    relations,
    limit,
    offset,
    order,
    moduleKey,
    formatterData,
    relationLoadStrategy = 'join',
  }: FindDetailedQueryProps<T>): Promise<T[]> {
    let church: Church | null = null;
    if (churchId && churchRepository) {
      church = await this.validateChurch(churchId, churchRepository);
    }

    const data = await mainRepository.find({
      where: {
        recordStatus: RecordStatus.Active,
        ...(church && { theirChurch: church }),
      } as any,
      take: limit,
      skip: offset,
      relations,
      relationLoadStrategy,
      order: { createdAt: order } as any,
    });

    this.validateResult(data);

    let mainChurch: T | null = null;
    if (moduleKey === 'churches') {
      mainChurch = await mainRepository.findOne({
        where: { isAnexe: false, recordStatus: RecordStatus.Active } as any,
      });
    }

    return formatterData({
      [moduleKey]: data,
      ...(mainChurch && { mainChurch }),
    });
  }

  protected handleDBExceptions(
    error: any,
    customMessages?: Record<string, string>,
  ): never {
    if (error?.code === '23505') {
      const detail: string = error.detail ?? '';

      if (customMessages) {
        for (const key of Object.keys(customMessages)) {
          if (detail.includes(key)) {
            throw new BadRequestException(customMessages[key]);
          }
        }
      }

      throw new BadRequestException('Ya existe un registro con ese valor.');
    }

    this.logger.error(error);

    throw new InternalServerErrorException(
      error.response.message ??
        'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
