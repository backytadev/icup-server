import { MemberRole } from '@/common/enums/member-role.enum';

export interface RoleHierarchyValidationConfig {
  mainRole: MemberRole;
  forbiddenRoles: MemberRole[];
  breakStrictRoles?: MemberRole[];
  hierarchyOrder: MemberRole[];
}

export interface ValidateRoleHierarchy {
  memberRoles: MemberRole[];
  rolesToAssign: MemberRole[];
  config: RoleHierarchyValidationConfig;
}
