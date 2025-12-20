import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsOrderValue } from 'typeorm';

import { GenderNames } from '@/common/enums/gender.enum';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { SearchStrategyProps } from '@/common/interfaces/search-strategy-props.interface';
import { SearchStrategy } from '@/common/strategies/search/search-strategy.interface';

@Injectable()
export class GenderSearchStrategy implements SearchStrategy {
  async execute<T>({
    params,
    church,
    relations,
    mainRepository,
    moduleKey,
    formatterData,
    relationLoadStrategy = 'join',
    moduleName,
  }: SearchStrategyProps<T>): Promise<T[]> {
    const { limit, offset, order, term } = params;

    const genderTerm = term.toLowerCase();
    const validGenders = ['male', 'female'];

    if (!validGenders.includes(genderTerm)) {
      throw new BadRequestException(`Género no válido: ${term}`);
    }

    const data = await mainRepository.find({
      where: {
        theirChurch: church,
        member: {
          gender: genderTerm,
        },
        recordStatus: RecordStatus.Active,
      } as any,
      take: limit,
      skip: offset,
      relations,
      relationLoadStrategy,
      order: { createdAt: order as FindOptionsOrderValue } as any,
    });

    if (data.length === 0) {
      const genderInSpanish = GenderNames[term.toLowerCase()] ?? term;

      throw new NotFoundException(
        `No se encontraron ${moduleName} con este género: ${genderInSpanish} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }

    return formatterData({
      [moduleKey]: data,
    });
  }
}
