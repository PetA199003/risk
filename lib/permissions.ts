import { UserRole } from '@prisma/client';

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.MITARBEITER]: 1,
    [UserRole.PROJEKTLEITER]: 2,
    [UserRole.ADMIN]: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canManageProject(userRole: UserRole, projectCreatorId: string, currentUserId: string): boolean {
  if (userRole === UserRole.ADMIN) return true;
  if (userRole === UserRole.PROJEKTLEITER && projectCreatorId === currentUserId) return true;
  return false;
}

export function canViewProject(userRole: UserRole, projectCreatorId: string, currentUserId: string): boolean {
  if (userRole === UserRole.ADMIN) return true;
  if (userRole === UserRole.PROJEKTLEITER && projectCreatorId === currentUserId) return true;
  // Mitarbeiter können zugewiesene Projekte sehen - hier vereinfacht alle
  return true;
}