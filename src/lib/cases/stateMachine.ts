import type { CaseStatus, CommercialStatus } from '@/lib/types';

// Fuente ÚNICA de la máquina de estados del caso: la importan tanto la API
// (api/cases/[id]/status) como la UI (crm/cases/[id]). No duplicar.

// Cadena administrativa: juridico → financiero → admin
export const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  creado: ['gestionado', 'cancelado'],
  gestionado: ['creado', 'cancelado', 'archivado'],
  cancelado: ['creado'],
  archivado: ['gestionado'],
};

export function canChangeStatus(userRole: string, statusChangedByRole?: string): boolean {
  if (userRole === 'admin') return true;
  if (userRole === 'juridico') {
    return !statusChangedByRole || statusChangedByRole === 'financiero';
  }
  if (userRole === 'financiero') {
    return statusChangedByRole === 'juridico';
  }
  return false;
}

// Pipeline COMERCIAL (RF-18): independiente del estado técnico/administrativo.
// 'ganado' y 'perdido' admiten reapertura para corregir errores de registro.
export const COMMERCIAL_TRANSITIONS: Record<CommercialStatus, CommercialStatus[]> = {
  prospecto: ['en_analisis', 'perdido'],
  en_analisis: ['prospecto', 'propuesta_enviada', 'perdido'],
  propuesta_enviada: ['negociacion', 'ganado', 'perdido'],
  negociacion: ['propuesta_enviada', 'ganado', 'perdido'],
  ganado: ['negociacion'],
  perdido: ['prospecto'],
};
