import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsOrderValue, In, Raw } from 'typeorm';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { SearchStrategyProps } from '@/common/interfaces/search-strategy-props.interface';
import { SearchStrategy } from '@/common/strategies/search/search-strategy.interface';

@Injectable()
export class ZoneNameSearchStrategy implements SearchStrategy {
  async execute<T>({
    params,
    church,
    relations,
    mainRepository,
    zoneRepository,
    moduleKey,
    formatterData,
    relationLoadStrategy = 'join',
    moduleName,
  }: SearchStrategyProps<T>): Promise<T[]> {
    const { limit, offset, order, term } = params;

    const zones = await zoneRepository.find({
      where: {
        theirChurch: church,
        zoneName: Raw(
          (alias) =>
            `unaccent(lower(${alias})) ILIKE unaccent(lower(:searchTerm))`,
          { searchTerm: `%${term.toLowerCase()}%` },
        ),
        recordStatus: RecordStatus.Active,
      },
      order: { createdAt: order as FindOptionsOrderValue },
    });

    if (zones.length === 0) {
      throw new NotFoundException(
        `No se encontraron zonas con este nombre: ${term} y con esta iglesia: ${
          church ? church.abbreviatedChurchName : 'Todas las iglesias'
        }`,
      );
    }

    if (moduleKey === 'zones') {
      const zonesWithRelations = await mainRepository.find({
        where: { id: In(zones.map((z) => z.id)) } as any,
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

    const zonesId = zones.map((zone) => zone.id);

    const data = await mainRepository.find({
      where: {
        theirChurch: church,
        theirZone: In(zonesId),
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
        `No se encontraron ${moduleName} con este nombre de zona: ${term} y con esta iglesia: ${
          church ? church.abbreviatedChurchName : 'Todas las iglesias'
        }`,
      );
    }

    return formatterData({
      [moduleKey]: data,
    });
  }
}
