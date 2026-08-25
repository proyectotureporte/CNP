import { ROLE_PERMISSIONS, type UserRole } from '@/lib/types';

export function hasPermission(role: UserRole, permission: string, allRoles = false): boolean {
  return allRoles || (ROLE_PERMISSIONS[role]?.includes(permission) ?? false);
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

export function canAccessRoute(role: UserRole, pathname: string, allRoles = false): boolean {
  if (allRoles) return true;
  // El admin técnico no tiene el módulo Casos, pero puede abrir una ficha
  // concreta en lectura para soporte desde Clientes/Reportes.
  if (role === 'admin' && /^\/crm\/cases\/[^/]+$/.test(pathname)) {
    return hasPermission(role, 'case-support');
  }

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

export function canManageUsers(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'admin';
}

export function canCreateCase(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}

export function canCreateClient(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}

export function canCreateQuote(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}

export function canAssignExpert(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}

export function canApproveQuote(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'cliente';
}

export function canReviewDeliverable(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}

export function canAccessFinances(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'junta';
}

export function canManageWorkPlanActions(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}

/** El perito asignado puede redactar su plan y actualizar sus actividades. */
export function canEditWorkPlan(role: UserRole, allRoles = false): boolean {
  return allRoles || ['comercial_juridico', 'perito_interno', 'perito'].includes(role);
}

/** La aprobación/devolución del plan sigue separada de quien lo redacta. */
export function canReviewWorkPlan(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}

// El Comercial Jurídico valida y administra la red de peritos que puede asignar.
export function canManageExperts(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}

// El mismo rol que capta al contacto conserva el expediente del cliente.
export function canManageClients(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}

// El Comercial Jurídico cierra el ciclo evaluando el servicio recibido.
export function canManageEvaluations(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}

// Junta: una etapa, una decisión y un valor; ningún rol operativo escribe aquí.
export function canManageCommittee(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'junta';
}

export function canReadCommittee(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'junta' || role === 'comercial_juridico';
}

// Pipeline comercial (RF-18): quien gestiona la relación comercial del caso.
export function canChangeCommercialStatus(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}

// Checklist documental (RF-05): definir requeridos y marcar estado.
export function canManageDocumentChecklist(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}

export function canEditCase(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}

export function canUploadDeliverable(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'perito_interno' || role === 'perito';
}

export function canAddCaseTimelineNote(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}

export function canUseWhatsappInbox(role: UserRole, allRoles = false): boolean {
  return allRoles || role === 'comercial_juridico';
}
