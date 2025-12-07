import { UseGuards, applyDecorators } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { UserRole } from '@/common/enums/user-role.enum';
import { UserRoleGuard } from '@/common/guards/user-role.guard';
import { RoleProtected } from '@/common/decorators/role-protected.decorator';

export function Auth(...roles: UserRole[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(AuthGuard(), UserRoleGuard),
  );
}

// RoleProtected() -> Used to establish the allowed roles in the metadata
// AuthGuard() -> Used to validate with the jwtStrategy and adds the user to the request
// UserRoleGuard() -> Used to remove the user from context and role metadata and validate and allow access
