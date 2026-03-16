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
  '/crm/mensajes': 'mensajes',
  '/crm/notifications': 'notifications',
  '/crm/profile': 'profile',
  '/crm/settings': 'settings',
  '/crm/dashboard': 'dashboard',
  '/admin': 'dashboard',
  '/admin/users': 'users',
  '/admin/clients': 'clients',
  '/admin/audit-logs': 'audit-logs',
  '/admin/settings': 'settings',
  '/admin/cartera': 'cartera',
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
  return ['admin', 'juridico'].includes(role);
}

export function canCreateClient(role: UserRole): boolean {
  return ['admin', 'juridico'].includes(role);
}

export function canCreateQuote(role: UserRole): boolean {
  return ['admin', 'financiero'].includes(role);
}

export function canAssignExpert(role: UserRole): boolean {
  return role === 'admin';
}

export function canApproveQuote(role: UserRole): boolean {
  return ['admin', 'cliente'].includes(role);
}

export function canReviewDeliverable(role: UserRole): boolean {
  return role === 'admin';
}

export function canAccessFinances(role: UserRole): boolean {
  return ['admin', 'financiero'].includes(role);
}

export function canManageWorkPlanActions(role: UserRole): boolean {
  return ['admin', 'administrativo'].includes(role);
}
