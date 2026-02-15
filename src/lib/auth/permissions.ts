import { ROLE_PERMISSIONS, type UserRole } from '@/lib/types';

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/crm': 'dashboard',
  '/crm/cases': 'cases',
  '/crm/clients': 'clients',
  '/crm/experts': 'experts',
  '/crm/quotes': 'quotes',
  '/crm/payments': 'payments',
  '/crm/reports': 'reports',
  '/crm/deliverables': 'deliverables',
  '/crm/work-plans': 'work-plans',
  '/crm/evaluations': 'evaluations',
  '/crm/commissions': 'commissions',
  '/crm/notifications': 'notifications',
  '/crm/my-cases': 'my-cases',
  '/crm/profile': 'profile',
  '/crm/settings': 'settings',
  '/crm/dashboard': 'dashboard',
  '/admin': 'dashboard',
  '/admin/users': 'users',
  '/admin/clients': 'clients',
  '/admin/audit-logs': 'audit-logs',
  '/admin/settings': 'settings',
};

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  if (role === 'admin') return true;

  for (const [route, permission] of Object.entries(ROUTE_PERMISSION_MAP)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return hasPermission(role, permission);
    }
  }

  return false;
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin';
}

export function canCreateCase(role: UserRole): boolean {
  return ['admin', 'comercial', 'cliente'].includes(role);
}

export function canAssignExpert(role: UserRole): boolean {
  return ['admin', 'tecnico', 'comite'].includes(role);
}

export function canApproveQuote(role: UserRole): boolean {
  return ['admin', 'cliente'].includes(role);
}

export function canReviewDeliverable(role: UserRole): boolean {
  return ['admin', 'tecnico', 'comite'].includes(role);
}

export function canAccessFinances(role: UserRole): boolean {
  return ['admin', 'finanzas'].includes(role);
}
