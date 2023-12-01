import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';

import { Member } from './entities/member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

import { SearchType } from '../common/enums/search-types.enum';
import { PaginationDto, SearchTypeAndPaginationDto } from '../common/dtos';
import { searchPerson, searchFullname, updateAge } from '../common/helpers';
import { Pastor } from 'src/pastor/entities/pastor.entity';
import { CoPastor } from 'src/copastor/entities/copastor.entity';

@Injectable()
export class MembersService {
  private readonly logger = new Logger('MermbersService');

  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,

    @InjectRepository(Pastor)
    private readonly pastorRepository: Repository<Pastor>,

    @InjectRepository(CoPastor)
    private readonly coPastorRepository: Repository<CoPastor>,
  ) {}

  //* CREATE MEMBER
  async create(createMemberDto: CreateMemberDto) {
    const { roles, their_pastor_id, their_copastor_id } = createMemberDto;

    const pastor = this.pastorRepository.findOneBy({ id: their_pastor_id });
    const coPastor = this.coPastorRepository.findOneBy({
      id: their_copastor_id,
    });

    //TODO : falta hacer el preacher y su casa, validaciones.
    if (!pastor) {
      throw new NotFoundException(
        `Not found pastor with id: ${their_pastor_id}`,
      );
    }

    if (!coPastor) {
      throw new NotFoundException(
        `Not found pastor with id: ${their_copastor_id}`,
      );
    }

    if (roles.includes('pastor') && their_pastor_id) {
      throw new BadRequestException(
        `No se puede asignar un Pastor a un miembro con rol Pastor`,
      );
    }

    if (roles.includes('copastor') && their_copastor_id) {
      throw new BadRequestException(
        `No se puede asignar un Copastor a un miembro con rol CoPastor`,
      );
    }

    try {
      const member = this.memberRepository.create({
        ...createMemberDto,
        created_at: new Date(),
        // NOTE: cambiar por uuid en relacion con User
        created_by: 'Kevin',
      });
      await this.memberRepository.save(member);

      return member;
    } catch (error) {
      console.log(error);

      this.handleDBExceptions(error);
    }
  }

  //* FIND ALL (PAGINATED) boton flecha y auemtar el offset de 10 o 20.
  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    return this.memberRepository.find({
      where: { is_active: true },
      take: limit,
      skip: offset,
    });
  }

  //* FIND POR TERMINO Y TIPO DE BUSQUEDA (FILTRO)
  async findTerm(
    term: string,
    searchTypeAndPaginationDto: SearchTypeAndPaginationDto,
  ) {
    const { type, limit = 20, offset = 0 } = searchTypeAndPaginationDto;
    let member: Member | Member[];

    //* Find UUID --> One

    if (isUUID(term) && type === SearchType.id) {
      member = await this.memberRepository.findOne({
        where: { id: term },
        relations: ['their_copastor_id', 'their_pastor_id'],
      });

      if (!member) {
        throw new BadRequestException(`No se encontro Pastor con este UUID`);
      }
      if (!member.is_active) {
        throw new BadRequestException(`Member should is active`);
      }

      member.age = updateAge(member);
      await this.memberRepository.save(member);
    }

    //* Find gender --> Many
    if (term && type === SearchType.gender) {
      member = await this.findMembersWithPagination(
        SearchType.gender,
        term,
        limit,
        offset,
      );
    }

    //* Find maritalStatus --> Many
    if (term && type === SearchType.maritalStatus) {
      member = await this.findMembersWithPagination(
        SearchType.maritalStatus,
        term,
        limit,
        offset,
      );
    }

    //* Find isActive --> Many
    if (term && type === SearchType.isActive) {
      member = await this.findMembersWithPagination(
        SearchType.isActive,
        term,
        limit,
        offset,
      );
    }

    //* Find firstName --> Many
    if (term && type === SearchType.firstName) {
      member = await searchPerson({
        term,
        searchType: SearchType.firstName,
        limit,
        offset,
        repository: this.memberRepository,
      });
    }

    //* Find lastName --> Many
    if (term && type === SearchType.lastName) {
      member = await searchPerson({
        term,
        searchType: SearchType.lastName,
        limit,
        offset,
        repository: this.memberRepository,
      });
    }

    //* Find fullName --> Many
    if (term && type === SearchType.fullName) {
      member = await searchFullname({
        term,
        limit,
        offset,
        repository: this.memberRepository,
      });
    }

    //* Find roles --> Many
    if (term && type === SearchType.roles) {
      const rolesArray = term.split('-');
      console.log(rolesArray);

      member = await this.memberRepository
        .createQueryBuilder('member')
        .where('member.roles @> ARRAY[:...roles]::text[]', {
          roles: rolesArray,
        })
        .skip(offset)
        .andWhere(`member.is_active =:isActive`, { isActive: true })
        .limit(limit)
        .getMany();

      if (member.length === 0) {
        throw new BadRequestException(
          `Not found members with these roles: ${rolesArray}`,
        );
      }
    }

    //! General Exceptions
    if (!isUUID(term) && type === SearchType.id) {
      throw new BadRequestException(`Not valid UUID`);
    }

    if (term && !Object.values(SearchType).includes(type as SearchType)) {
      throw new BadRequestException(
        `Type not valid, should be: ${Object.values(SearchType).join(', ')}`,
      );
    }

    if (!member) throw new NotFoundException(`Member with ${term} not found`);

    return member;
  }

  //* UPDATE FOR ID
  async update(id: string, updateMemberDto: UpdateMemberDto) {
    const member = await this.memberRepository.preload({
      id: id,
      updated_at: new Date(),
      // NOTE: cambiar por uuid en relacion con User
      updated_by: 'Kevinxd',
      ...updateMemberDto,
    });

    if (!member) throw new NotFoundException(`Member with id: ${id} not found`);

    try {
      return await this.memberRepository.save(member);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* ELIMINAR POR ID
  async remove(id: string) {
    if (!isUUID(id)) {
      throw new BadRequestException(`Not valid UUID`);
    }

    const member = await this.memberRepository.preload({
      id: id,
      is_active: false,
    });

    const pastores = await this.pastorRepository.find();

    const pastorMember = pastores.find((pastor) => pastor.member.id === id);

    if (!pastorMember) {
      throw new NotFoundException(`Not found pastor`);
    }

    const pastor = await this.pastorRepository.preload({
      id: pastorMember.id,
      is_active: false,
    });
    //TODO :  02/12 hacer para copastor, preacher, primero crear el copastor y arreglar
    //TODO : 02/12 comenzar con copastor y verificar cada metodo

    try {
      await this.memberRepository.save(member);
      await this.pastorRepository.save(pastor);
    } catch (error) {
      this.logger.error(error);
    }
  }

  //! PRIVATE METHODS
  private handleDBExceptions(error: any) {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected errors, check server logs',
    );
  }

  private async findMembersWithPagination(
    searchType: string,
    term: string,
    limit: number,
    offset: number,
  ): Promise<Member[]> {
    const whereCondition = {};
    try {
      if (searchType === 'is_active') {
        whereCondition[searchType] = term;

        const members = await this.memberRepository.find({
          where: [whereCondition],
          take: limit,
          skip: offset,
        });

        if (members.length === 0) {
          throw new NotFoundException(
            `Not found member with these names: ${term}`,
          );
        }
        return members;
      }
    } catch (error) {
      throw new BadRequestException(`This term is not a valid boolean value`);
    }

    whereCondition[searchType] = term;
    whereCondition['is_active'] = true;

    const members = await this.memberRepository.find({
      where: [whereCondition],
      take: limit,
      skip: offset,
    });

    if (members.length === 0) {
      throw new NotFoundException(`Not found member with these names: ${term}`);
    }
    return members;
  }
}
