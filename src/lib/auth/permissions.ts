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
  '/crm/formularios': 'formularios',
  '/crm/notifications': 'notifications',
  '/crm/profile': 'profile',
  '/crm/settings': 'settings',
  '/crm/cartera': 'cartera',
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

  // Match the most specific route first (longest prefix) so e.g. /crm/quotes
  // resolves to 'quotes' instead of the greedy '/crm' -> 'dashboard'.
  const entries = Object.entries(ROUTE_PERMISSION_MAP).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [route, permission] of entries) {
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
  return ['admin', 'juridico', 'mercadeo'].includes(role);
}

export function canCreateQuote(role: UserRole): boolean {
  return ['admin', 'financiero'].includes(role);
}

export function canAssignExpert(role: UserRole): boolean {
  return ['admin', 'administrativo'].includes(role);
}

export function canApproveQuote(role: UserRole): boolean {
  return ['admin', 'cliente'].includes(role);
}

export function canReviewDeliverable(role: UserRole): boolean {
  return ['admin', 'juridico'].includes(role);
}

export function canAccessFinances(role: UserRole): boolean {
  return ['admin', 'financiero'].includes(role);
}

export function canManageWorkPlanActions(role: UserRole): boolean {
  return ['admin', 'administrativo'].includes(role);
}

// Expert directory management (create/edit/validate peritos) stays with admin.
export function canManageExperts(role: UserRole): boolean {
  return role === 'admin';
}

// Editing/deleting existing clients + validating Peritus registro: legal owners
// only (mercadeo only creates/converts leads).
export function canManageClients(role: UserRole): boolean {
  return ['admin', 'juridico'].includes(role);
}

// Post-sale evaluation of the expert: post-venta closes the loop.
export function canManageEvaluations(role: UserRole): boolean {
  return ['admin', 'postventa'].includes(role);
}
