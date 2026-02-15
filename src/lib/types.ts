// ============================================
// ROLES Y PERMISOS
// ============================================

export const USER_ROLES = [
  'admin',
  'comercial',
  'tecnico',
  'perito',
  'cliente',
  'finanzas',
  'comite',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  comercial: 'Asesor Comercial',
  tecnico: 'Analista Tecnico',
  perito: 'Perito',
  cliente: 'Cliente (Abogado)',
  finanzas: 'Finanzas',
  comite: 'Comite Tecnico',
};

export const ROLE_COLORS: Record<UserRole, { bg: string; text: string; dot: string }> = {
  admin: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  comercial: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  tecnico: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  perito: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  cliente: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  finanzas: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500' },
  comite: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['dashboard', 'cases', 'experts', 'clients', 'users', 'quotes', 'deliverables', 'work-plans', 'evaluations', 'payments', 'commissions', 'reports', 'settings', 'notifications', 'profile'],
  comercial: ['dashboard', 'cases', 'clients', 'quotes', 'notifications', 'profile'],
  tecnico: ['dashboard', 'cases', 'experts', 'deliverables', 'work-plans', 'notifications', 'profile'],
  perito: ['dashboard', 'my-cases', 'deliverables', 'work-plans', 'notifications', 'profile'],
  cliente: ['dashboard', 'my-cases', 'quotes', 'notifications', 'profile'],
  finanzas: ['dashboard', 'payments', 'commissions', 'reports', 'notifications', 'profile'],
  comite: ['dashboard', 'cases', 'experts', 'deliverables', 'work-plans', 'evaluations', 'notifications', 'profile'],
};

// ============================================
// DISCIPLINAS
// ============================================

export const CASE_DISCIPLINES = [
  'financiero', 'medico', 'grafologia', 'ingenieria',
  'arquitectura', 'contable', 'ambiental', 'informatico',
  'valuacion', 'otro',
] as const;

export type CaseDiscipline = (typeof CASE_DISCIPLINES)[number];

export const DISCIPLINE_LABELS: Record<CaseDiscipline, string> = {
  financiero: 'Financiero', medico: 'Medico', grafologia: 'Grafologia',
  ingenieria: 'Ingenieria', arquitectura: 'Arquitectura', contable: 'Contable',
  ambiental: 'Ambiental', informatico: 'Informatico', valuacion: 'Valuacion', otro: 'Otro',
};

// ============================================
// ESTADOS DE CASO
// ============================================

export const CASE_STATUSES = [
  'creado', 'en_cotizacion', 'pendiente_aprobacion', 'aprobado',
  'en_asignacion', 'en_produccion', 'en_revision', 'finalizado',
  'archivado', 'rechazado',
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  creado: 'Creado', en_cotizacion: 'En Cotizacion', pendiente_aprobacion: 'Pendiente Aprobacion',
  aprobado: 'Aprobado', en_asignacion: 'En Asignacion', en_produccion: 'En Produccion',
  en_revision: 'En Revision', finalizado: 'Finalizado', archivado: 'Archivado', rechazado: 'Rechazado',
};

export const CASE_STATUS_COLORS: Record<CaseStatus, { bg: string; text: string; dot: string }> = {
  creado: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
  en_cotizacion: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  pendiente_aprobacion: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  aprobado: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  en_asignacion: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  en_produccion: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  en_revision: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  finalizado: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  archivado: { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-500' },
  rechazado: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

// ============================================
// COMPLEJIDAD DE CASO
// ============================================

export const CASE_COMPLEXITIES = ['baja', 'media', 'alta', 'critica'] as const;
export type CaseComplexity = (typeof CASE_COMPLEXITIES)[number];

export const COMPLEXITY_LABELS: Record<CaseComplexity, string> = {
  baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Critica',
};

export const COMPLEXITY_COLORS: Record<CaseComplexity, { bg: string; text: string; dot: string }> = {
  baja: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  media: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  alta: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  critica: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

// ============================================
// PRIORIDAD DE CASO
// ============================================

export const CASE_PRIORITIES = ['baja', 'normal', 'alta', 'urgente'] as const;
export type CasePriority = (typeof CASE_PRIORITIES)[number];

export const PRIORITY_LABELS: Record<CasePriority, string> = {
  baja: 'Baja', normal: 'Normal', alta: 'Alta', urgente: 'Urgente',
};

export const PRIORITY_COLORS: Record<CasePriority, { bg: string; text: string; dot: string }> = {
  baja: { bg: 'bg-slate-50', text: 'text-slate-700', dot: 'bg-slate-500' },
  normal: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  alta: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  urgente: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

// ============================================
// SANITY DOCUMENTS
// ============================================

export interface SanityDocument {
  _id: string;
  _type: string;
  _createdAt: string;
  _updatedAt: string;
}

export interface CrmUser extends SanityDocument {
  _type: 'crmUser';
  username: string;
  email: string;
  displayName: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  avatarUrl?: string;
  companyRef?: { _ref: string; _type: 'reference' };
}

export interface CrmClient extends SanityDocument {
  _type: 'crmClient';
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  notes: string;
  status: 'activo' | 'inactivo' | 'prospecto';
  createdBy: string;
}

export interface Company extends SanityDocument {
  _type: 'company';
  name: string;
  nit: string;
  type: 'firma_abogados' | 'empresa' | 'particular';
  address: string;
  city: string;
  country: string;
  phone: string;
  website: string;
  billingEmail: string;
  logoUrl?: string;
  isActive: boolean;
}

export interface Case extends SanityDocument {
  _type: 'case';
  caseCode: string;
  title: string;
  description?: string;
  client?: { _ref: string; _type: 'reference' };
  commercial?: { _ref: string; _type: 'reference' };
  technicalAnalyst?: { _ref: string; _type: 'reference' };
  assignedExpert?: { _ref: string; _type: 'reference' };
  discipline: CaseDiscipline;
  status: CaseStatus;
  complexity: CaseComplexity;
  priority: CasePriority;
  estimatedAmount?: number;
  hearingDate?: string;
  deadlineDate?: string;
  city?: string;
  courtName?: string;
  caseNumber?: string;
  riskScore?: number;
  createdBy?: { _ref: string; _type: 'reference' };
}

export interface CaseExpanded {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  caseCode: string;
  title: string;
  description?: string;
  discipline: CaseDiscipline;
  status: CaseStatus;
  complexity: CaseComplexity;
  priority: CasePriority;
  estimatedAmount?: number;
  hearingDate?: string;
  deadlineDate?: string;
  city?: string;
  courtName?: string;
  caseNumber?: string;
  riskScore?: number;
  client?: { _id: string; name: string; email: string; company: string };
  commercial?: { _id: string; displayName: string; email: string };
  technicalAnalyst?: { _id: string; displayName: string; email: string };
  assignedExpert?: { _id: string; displayName: string; email: string };
  createdBy?: { _id: string; displayName: string };
}

export const CASE_EVENT_TYPES = [
  'case_created', 'status_changed', 'assignment', 'document_uploaded',
  'quote_created', 'quote_approved', 'quote_rejected',
  'deliverable_submitted', 'deliverable_approved',
  'payment_recorded', 'comment', 'other',
] as const;

export type CaseEventType = (typeof CASE_EVENT_TYPES)[number];

export const CASE_EVENT_LABELS: Record<CaseEventType, string> = {
  case_created: 'Caso Creado', status_changed: 'Estado Cambiado',
  assignment: 'Asignacion', document_uploaded: 'Documento Subido',
  quote_created: 'Cotizacion Creada', quote_approved: 'Cotizacion Aprobada',
  quote_rejected: 'Cotizacion Rechazada', deliverable_submitted: 'Entrega Enviada',
  deliverable_approved: 'Entrega Aprobada', payment_recorded: 'Pago Registrado',
  comment: 'Comentario', other: 'Otro',
};

export interface CaseEvent {
  _id: string;
  _createdAt: string;
  eventType: CaseEventType;
  description?: string;
  createdByName?: string;
  createdBy?: { _id: string; displayName: string };
}

// ============================================
// COTIZACIONES
// ============================================

export const QUOTE_STATUSES = ['borrador', 'enviada', 'aprobada', 'rechazada', 'expirada'] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  borrador: 'Borrador', enviada: 'Enviada', aprobada: 'Aprobada',
  rechazada: 'Rechazada', expirada: 'Expirada',
};

export const QUOTE_STATUS_COLORS: Record<QuoteStatus, { bg: string; text: string; dot: string }> = {
  borrador: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
  enviada: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  aprobada: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  rechazada: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  expirada: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};

export interface Quote {
  _id: string;
  _createdAt: string;
  version: number;
  estimatedHours: number;
  hourlyRate: number;
  baseValue: number;
  expenses: number;
  marginPercentage: number;
  totalValue: number;
  discountPercentage: number;
  finalValue: number;
  status: QuoteStatus;
  validUntil?: string;
  sentAt?: string;
  approvedAt?: string;
  approvedBy?: { _id: string; displayName: string };
  rejectionReason?: string;
  notes?: string;
  createdBy?: { _id: string; displayName: string };
}

// ============================================
// DOCUMENTOS DE CASO
// ============================================

export const DOCUMENT_CATEGORIES = [
  'demanda', 'soporte_tecnico', 'contrato', 'cotizacion',
  'plan_trabajo', 'entrega_parcial', 'dictamen_final',
  'audiencia', 'pago', 'otro',
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  demanda: 'Demanda', soporte_tecnico: 'Soporte Tecnico',
  contrato: 'Contrato', cotizacion: 'Cotizacion',
  plan_trabajo: 'Plan de Trabajo', entrega_parcial: 'Entrega Parcial',
  dictamen_final: 'Dictamen Final', audiencia: 'Audiencia',
  pago: 'Pago', otro: 'Otro',
};

export interface CaseDocument {
  _id: string;
  _createdAt: string;
  category: DocumentCategory;
  fileName: string;
  fileSize: number;
  mimeType: string;
  version: number;
  isVisibleToClient: boolean;
  description?: string;
  uploadedByName?: string;
  uploadedBy?: { _id: string; displayName: string };
  file?: { asset: { _ref: string; url?: string } };
}

export interface AdminConfig extends SanityDocument {
  _type: 'adminConfig';
  masterPasswordHash: string;
  secondaryPasswordHash: string;
}

// ============================================
// PERITOS
// ============================================

export const EXPERT_AVAILABILITIES = ['disponible', 'ocupado', 'no_disponible'] as const;
export type ExpertAvailability = (typeof EXPERT_AVAILABILITIES)[number];

export const EXPERT_AVAILABILITY_LABELS: Record<ExpertAvailability, string> = {
  disponible: 'Disponible', ocupado: 'Ocupado', no_disponible: 'No Disponible',
};

export const EXPERT_AVAILABILITY_COLORS: Record<ExpertAvailability, { bg: string; text: string; dot: string }> = {
  disponible: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  ocupado: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  no_disponible: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export const EXPERT_VALIDATION_STATUSES = ['pendiente', 'aprobado', 'rechazado'] as const;
export type ExpertValidationStatus = (typeof EXPERT_VALIDATION_STATUSES)[number];

export const EXPERT_VALIDATION_LABELS: Record<ExpertValidationStatus, string> = {
  pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado',
};

export const EXPERT_VALIDATION_COLORS: Record<ExpertValidationStatus, { bg: string; text: string; dot: string }> = {
  pendiente: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  aprobado: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  rechazado: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export interface Expert {
  _id: string;
  _createdAt: string;
  _updatedAt: string;
  user?: { _id: string; displayName: string; email: string; phone?: string };
  disciplines: string[];
  specialization?: string;
  experienceYears: number;
  professionalCard?: string;
  city?: string;
  region?: string;
  baseFee?: number;
  feeCurrency: string;
  availability: ExpertAvailability;
  rating: number;
  totalCases: number;
  completedCases: number;
  validationStatus: ExpertValidationStatus;
  validatedBy?: { _id: string; displayName: string };
  validationNotes?: string;
  bankName?: string;
  bankAccountType?: string;
  bankAccountNumber?: string;
  taxId?: string;
  cvFile?: { asset: { _ref: string; url?: string } };
  certificationFiles?: { asset: { _ref: string; url?: string } }[];
}

// ============================================
// API TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalClients: number;
  activeUsers: number;
  recentClients: CrmClient[];
}

// ============================================
// PLANES DE TRABAJO
// ============================================

export const WORK_PLAN_STATUSES = ['borrador', 'enviado', 'en_revision', 'aprobado', 'rechazado'] as const;
export type WorkPlanStatus = (typeof WORK_PLAN_STATUSES)[number];

export const WORK_PLAN_STATUS_LABELS: Record<WorkPlanStatus, string> = {
  borrador: 'Borrador', enviado: 'Enviado', en_revision: 'En Revision',
  aprobado: 'Aprobado', rechazado: 'Rechazado',
};

export const WORK_PLAN_STATUS_COLORS: Record<WorkPlanStatus, { bg: string; text: string; dot: string }> = {
  borrador: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
  enviado: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  en_revision: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  aprobado: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  rechazado: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export interface WorkPlan {
  _id: string;
  _createdAt: string;
  methodology?: string;
  objectives?: string;
  startDate?: string;
  endDate?: string;
  estimatedDays?: number;
  deliverablesDescription?: string;
  status: WorkPlanStatus;
  submittedAt?: string;
  rejectionComments?: string;
  assignedExpert?: { _id: string; displayName: string };
  reviewedBy?: { _id: string; displayName: string };
  committeeApprovedBy?: { _id: string; displayName: string };
  createdBy?: { _id: string; displayName: string };
}

// ============================================
// ENTREGAS
// ============================================

export const DELIVERABLE_PHASES = ['marco_conceptual', 'desarrollo_tecnico', 'dictamen_final'] as const;
export type DeliverablePhase = (typeof DELIVERABLE_PHASES)[number];

export const DELIVERABLE_PHASE_LABELS: Record<DeliverablePhase, string> = {
  marco_conceptual: 'Marco Conceptual', desarrollo_tecnico: 'Desarrollo Tecnico',
  dictamen_final: 'Dictamen Final',
};

export const DELIVERABLE_STATUSES = ['enviado', 'en_revision', 'aprobado', 'rechazado'] as const;
export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
  enviado: 'Enviado', en_revision: 'En Revision', aprobado: 'Aprobado', rechazado: 'Rechazado',
};

export const DELIVERABLE_STATUS_COLORS: Record<DeliverableStatus, { bg: string; text: string; dot: string }> = {
  enviado: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  en_revision: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  aprobado: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  rechazado: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export interface Deliverable {
  _id: string;
  _createdAt: string;
  phase: DeliverablePhase;
  phaseNumber: number;
  fileName?: string;
  status: DeliverableStatus;
  comments?: string;
  rejectionReason?: string;
  version: number;
  fileUrl?: string;
  submittedBy?: { _id: string; displayName: string };
  reviewedBy?: { _id: string; displayName: string };
  approvedBy?: { _id: string; displayName: string };
}

// ============================================
// EVALUACIONES
// ============================================

export interface Evaluation {
  _id: string;
  _createdAt: string;
  punctualityScore: number;
  qualityScore: number;
  serviceScore: number;
  finalScore: number;
  clientFeedback?: string;
  technicalFeedback?: string;
  expert?: { _id: string; displayName: string };
  evaluatedBy?: { _id: string; displayName: string };
}

// ============================================
// AUDIENCIAS
// ============================================

export const HEARING_RESULTS = ['favorable', 'desfavorable', 'aplazada', 'pendiente'] as const;
export type HearingResult = (typeof HEARING_RESULTS)[number];

export const HEARING_RESULT_LABELS: Record<HearingResult, string> = {
  favorable: 'Favorable', desfavorable: 'Desfavorable',
  aplazada: 'Aplazada', pendiente: 'Pendiente',
};

export interface Hearing {
  _id: string;
  _createdAt: string;
  scheduledDate: string;
  location?: string;
  courtName?: string;
  judgeName?: string;
  expertAttended?: boolean;
  clientAttended?: boolean;
  durationMinutes?: number;
  result?: HearingResult;
  notes?: string;
  followUpRequired?: boolean;
}

// ============================================
// PAGOS
// ============================================

export const PAYMENT_METHODS = ['transferencia', 'cheque', 'efectivo', 'tarjeta', 'otro'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['pendiente', 'completado', 'anulado'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string; dot: string }> = {
  pendiente: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  completado: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  anulado: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
};

export interface Payment {
  _id: string;
  _createdAt: string;
  amount: number;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  status: PaymentStatus;
  transactionReference?: string;
  notes?: string;
  caseRef?: { _id: string; caseCode: string; title: string };
  createdBy?: { _id: string; displayName: string };
}

// ============================================
// COMISIONES
// ============================================

export const COMMISSION_STATUSES = ['pendiente', 'pagada', 'anulada'] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export interface Commission {
  _id: string;
  _createdAt: string;
  baseAmount: number;
  bonusPercentage: number;
  penaltyPercentage: number;
  finalAmount: number;
  status: CommissionStatus;
  paymentDate?: string;
  paymentReference?: string;
  expert?: { _id: string; displayName: string };
  caseRef?: { _id: string; caseCode: string; title: string };
}

// ============================================
// NOTIFICACIONES
// ============================================

export const NOTIFICATION_TYPES = ['info', 'warning', 'success', 'error'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_PRIORITIES = ['baja', 'normal', 'alta'] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export interface AppNotification {
  _id: string;
  _createdAt: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  linkUrl?: string;
  isRead: boolean;
  readAt?: string;
}

// ============================================
// AUDIT LOG
// ============================================

export interface AuditLog {
  _id: string;
  _createdAt: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  user?: { _id: string; displayName: string };
}

// ============================================
// SYSTEM SETTINGS
// ============================================

export interface SystemSetting {
  _id: string;
  key: string;
  value: string;
  dataType: string;
  description?: string;
}
