export enum UserRole {
  SuperUser = 'super-user',
  AdminUser = 'admin-user',
  TreasurerUser = 'treasurer-user',
  MinistryUser = 'ministry-user',
  User = 'user',
}

export const UserRoleNames: Record<UserRole, string> = {
  [UserRole.SuperUser]: 'Super-Usuario',
  [UserRole.AdminUser]: 'Administrador-Usuario',
  [UserRole.TreasurerUser]: 'Tesorero-Usuario',
  [UserRole.MinistryUser]: 'Ministerio-Usuario',
  [UserRole.User]: 'Usuario',
};
