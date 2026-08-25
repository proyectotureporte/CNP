import type { CaseStatus, CommercialStatus } from '@/lib/types';

// Fuente ÚNICA de la máquina de estados del caso: la importan tanto la API
// (api/cases/[id]/status) como la UI (crm/cases/[id]). No duplicar.

// El Comercial Jurídico opera el ciclo del caso de punta a punta.
export const VALID_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  creado: ['gestionado', 'cancelado'],
  gestionado: ['creado', 'cancelado', 'archivado'],
  cancelado: ['creado'],
  archivado: ['gestionado'],
};

export function canChangeStatus(userRole: string, statusChangedByRole?: string): boolean {
  void statusChangedByRole;
  return userRole === 'comercial_juridico';
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
