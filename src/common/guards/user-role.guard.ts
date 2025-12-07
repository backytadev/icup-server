import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';

import { User } from '@/modules/user/entities/user.entity';
import { META_ROLES } from '@/common/decorators/role-protected.decorator';
import { getRoleNamesInSpanish } from '@/common/helpers/get-role-names-in-spanish.helper';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const validUserRoles: string[] = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );

    if (!validUserRoles) return true;
    if (validUserRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if (!user) {
      throw new BadRequestException(`Usuario no encontrado.`);
    }

    for (const role of user.roles) {
      if (validUserRoles.includes(role)) {
        return true;
      }
    }

    throw new ForbiddenException(
      `Acceso denegado: el usuario ${user.firstNames} ${user.lastNames} no posee los roles necesarios para realizar esta operación. Los roles requeridos son: ${getRoleNamesInSpanish(validUserRoles)}.`,
    );
  }
}
