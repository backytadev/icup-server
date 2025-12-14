import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsOrderValue } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';
import { SearchStrategyProps } from '@/common/interfaces/search-strategy-props.interface';
import { SearchStrategy } from '@/common/strategies/search/search-strategy.interface';

@Injectable()
export class RecordStatusSearchStrategy implements SearchStrategy {
  async execute<T>({
    params,
    church,
    relations,
    mainRepository,
    moduleKey,
    formatterData,
    relationLoadStrategy = 'join',
  }: SearchStrategyProps<T>): Promise<T[]> {
    const { limit, offset, order, term } = params;

    const recordStatusTerm = term.toLowerCase();
    const validRecordStatus = ['active', 'inactive'];

    if (!validRecordStatus.includes(recordStatusTerm)) {
      throw new BadRequestException(`Estado de registro no válido: ${term}`);
    }

    const data = await mainRepository.find({
      where: {
        ...(church && { theirChurch: church }),
        recordStatus: recordStatusTerm,
      } as any,
      take: limit,
      skip: offset,
      relations,
      relationLoadStrategy,
      order: { createdAt: order as FindOptionsOrderValue } as any,
    });

    let mainChurch = null;
    if (moduleKey === 'churches') {
      mainChurch = await mainRepository.findOne({
        where: { isAnexe: false, recordStatus: RecordStatus.Active } as any,
      });
    }

    if (data.length === 0) {
      const value = term === RecordStatus.Inactive ? 'Inactivo' : 'Activo';

      throw new NotFoundException(
        `No se encontraron registros con este estado de registro: ${value}`,
      );
    }

    return formatterData({
      [moduleKey]: data,
      ...(mainChurch && { mainChurch }),
    });
  }
}
