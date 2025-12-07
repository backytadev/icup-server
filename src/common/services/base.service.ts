import {
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';

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
      'Sucedió un error inesperado, hable con el administrador.',
    );
  }
}
