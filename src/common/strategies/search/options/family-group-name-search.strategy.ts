import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue, In, Raw } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { SearchStrategyProps } from '@/common/interfaces/search-strategy-props.interface';
import { SearchStrategy } from '@/common/strategies/search/search-strategy.interface';

@Injectable()
export class FamilyGroupNameSearchStrategy implements SearchStrategy {
  async execute<T>({
    params,
    church,
    relations,
    mainRepository,
    familyGroupRepository,
    moduleKey,
    formatterData,
    relationLoadStrategy = 'join',
    moduleName,
  }: SearchStrategyProps<T>): Promise<T[]> {
    const { limit, offset, order, term } = params;

    const familyGroups = await familyGroupRepository.find({
      where: {
        theirChurch: church,
        // familyGroupName: ILike(`%${term}%`),
        familyGroupName: Raw(
          (alias) =>
            `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
          { searchTerm: `%${term.toLowerCase()}%` },
        ),
        recordStatus: RecordStatus.Active,
      },
      order: { createdAt: order as FindOptionsOrderValue },
    });

    if (familyGroups.length === 0) {
      throw new NotFoundException(
        `No se encontraron grupos familiares con este nombre: ${term} y con esta iglesia: ${
          church ? church.abbreviatedChurchName : 'Todas las iglesias'
        }`,
      );
    }

    if (moduleKey === 'familyGroups') {
      const zonesWithRelations = await mainRepository.find({
        where: { id: In(familyGroups.map((z) => z.id)) } as any,
        relations,
        relationLoadStrategy,
        take: limit,
        skip: offset,
        order: { createdAt: order as FindOptionsOrderValue } as any,
      });

      return formatterData({
        [moduleKey]: zonesWithRelations,
      });
    }

    const familyGroupsId = familyGroups.map((familyGroup) => familyGroup?.id);

    const data = await mainRepository.find({
      where: {
        theirChurch: church,
        theirFamilyGroup: In(familyGroupsId),
        recordStatus: RecordStatus.Active,
      } as any,
      take: limit,
      skip: offset,
      relations,
      relationLoadStrategy,
      order: { createdAt: order as FindOptionsOrderValue } as any,
    });

    if (data.length === 0) {
      throw new NotFoundException(
        `No se encontraron ${moduleName} con este nombre de grupo familiar ${term} y con esta iglesia: ${church ? church?.abbreviatedChurchName : 'Todas las iglesias'}`,
      );
    }

    return formatterData({
      [moduleKey]: data,
    });
  }
}
