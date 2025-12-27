import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrderValue, In, Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';

import { BaseService } from '@/common/services/base.service';
import { PaginationDto } from '@/common/dtos/pagination.dto';
import { RecordStatus } from '@/common/enums/record-status.enum';

import { User } from '@/modules/user/entities/user.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { Ministry } from '@/modules/ministry/entities/ministry.entity';

import { CreateUserDto } from '@/modules/user/dto/create-user.dto';
import { UpdateUserDto } from '@/modules/user/dto/update-user.dto';
import { InactivateUserDto } from '@/modules/user/dto/inactivate-user.dto';

import { UserRole } from '@/common/enums/user-role.enum';
import { UserSearchAndPaginationDto } from '@/modules/user/dto/user-search-and-pagination.dto';
import { UserSearchStrategyFactory } from '@/modules/user/search/user-search-strategy.factory';

@Injectable()
export class UserService extends BaseService {
  constructor(
    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,

    @InjectRepository(Ministry)
    private readonly ministryRepository: Repository<Ministry>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly searchStrategyFactory: UserSearchStrategyFactory,
  ) {
    super();
  }

  //* Create
  async create(body: CreateUserDto, user: User) {
    try {
      const data = await this.buildCreateData(body, user);
      const newUser = this.userRepository.create(data);

      await this.userRepository.save(newUser);
      delete newUser.password;

      return newUser;
    } catch (error) {
      this.handleDBExceptions(error, {
        email: 'El correo electrónico ya está en uso.',
      });
    }
  }

  //* Find all
  async findAll(query: PaginationDto): Promise<User[]> {
    const { limit, offset = 0, order = 'ASC' } = query;

    try {
      const users = await this.userRepository.find({
        where: { recordStatus: RecordStatus.Inactive },
        take: limit,
        skip: offset,
        relations: ['updatedBy', 'createdBy', 'churches', 'ministries'],
        order: { createdAt: order as FindOptionsOrderValue },
      });

      return this.validateResult(users);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find by filters
  async findByFilters(query: UserSearchAndPaginationDto): Promise<User[]> {
    const { term, searchType } = query;

    if (!term) throw new BadRequestException('El término es requerido');
    if (!searchType)
      throw new BadRequestException('El tipo de búsqueda es requerido');

    try {
      const strategy = this.searchStrategyFactory.getStrategy(searchType);

      return strategy.execute(query);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Update
  async update(id: string, dto: UpdateUserDto, user: User): Promise<User> {
    await this.validateId(id);

    const existingUser = await this.findOrFail<User>({
      repository: this.userRepository,
      where: { id },
      relations: ['churches'],
      select: [
        'id',
        'firstNames',
        'lastNames',
        'email',
        'password',
        'roles',
        'recordStatus',
        'gender',
      ],
      moduleName: 'usuario',
    });

    if (dto.currentPassword && dto.newPassword) {
      this.validateCurrentPassword(dto.currentPassword, existingUser.password);
    }

    const updateData = await this.buildUpdateData(dto, user);
    const updatedUser = await this.userRepository.preload({
      id,
      ...updateData,
    });

    try {
      return await this.userRepository.save(updatedUser);
    } catch (error) {
      this.handleDBExceptions(error, {
        email: 'El correo electrónico ya está en uso.',
      });
    }
  }

  //* Delete
  async delete(
    id: string,
    { userInactivationCategory, userInactivationReason }: InactivateUserDto,
    admin: User,
  ): Promise<void> {
    await this.validateId(id);

    const user = await this.findOrFail<User>({
      repository: this.userRepository,
      where: { id },
      relations: ['churches'],
      select: [
        'id',
        'firstNames',
        'lastNames',
        'email',
        'password',
        'roles',
        'recordStatus',
        'gender',
      ],
      moduleName: 'usuario',
    });

    this.validateUserCanBeInactivated(user);

    try {
      const softDeleted = await this.userRepository.preload({
        id,
        updatedAt: new Date(),
        updatedBy: admin,
        inactivationCategory: userInactivationCategory,
        inactivationReason: userInactivationReason,
        recordStatus: RecordStatus.Inactive,
      });

      await this.userRepository.save(softDeleted);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  // ---------------------------------------------------------------------------------------------- //
  //? Private methods
  //* Validators
  private validateCurrentPassword(raw: string, hashed: string) {
    if (!bcrypt.compareSync(raw, hashed)) {
      throw new UnauthorizedException(
        `La contraseña actual no coincide con la registrada en la base de datos.`,
      );
    }
  }

  private validateUserCanBeInactivated(user: User) {
    if (user.roles.includes(UserRole.SuperUser)) {
      throw new BadRequestException(
        `Usuario con rol "Super-Usuario" no puede ser eliminado.`,
      );
    }
  }

  //* Finders
  private async findActiveChurches(ids: string[]): Promise<Church[]> {
    if (!ids?.length) return [];

    return this.churchRepository.find({
      where: { id: In(ids), recordStatus: RecordStatus.Active },
    });
  }

  private async findActiveMinistries(ids: string[]): Promise<Ministry[]> {
    if (!ids?.length) return [];

    return this.ministryRepository.find({
      where: { id: In(ids), recordStatus: RecordStatus.Active },
    });
  }

  //* Builders
  private async buildCreateData(dto: CreateUserDto, createdBy: User) {
    const churches = await this.findActiveChurches(dto.churches);
    const ministries = await this.findActiveMinistries(dto.ministries);

    return {
      ...dto,
      password: bcrypt.hashSync(dto.password, 10),
      churches,
      ministries,
      createdAt: new Date(),
      createdBy,
    };
  }

  private async buildUpdateData(
    dto: UpdateUserDto,
    user: User,
  ): Promise<Promise<Partial<User>>> {
    const {
      recordStatus,
      newPassword,
      userInactivationCategory,
      userInactivationReason,
    } = dto;

    const churches = await this.findActiveChurches(dto.churches);
    const ministries = await this.findActiveMinistries(dto.ministries);

    return {
      ...dto,
      ministries,
      churches,
      updatedAt: new Date(),
      updatedBy: user,
      password: newPassword ? bcrypt.hashSync(newPassword, 10) : undefined,
      inactivationCategory:
        recordStatus === RecordStatus.Active ? null : userInactivationCategory,
      inactivationReason:
        recordStatus === RecordStatus.Active ? null : userInactivationReason,
      recordStatus,
    };
  }
}
