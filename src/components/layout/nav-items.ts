import {
  LayoutDashboard,
  Briefcase,
  Users,
  UserSearch,
  FileText,
  ClipboardList,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  UserCircle,
  Scale,
  Wallet,
  Shield,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: string;
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/crm', icon: LayoutDashboard, permission: 'dashboard' },
  { label: 'Casos', href: '/crm/cases', icon: Briefcase, permission: 'cases' },
  { label: 'Mis Casos', href: '/crm/my-cases', icon: Briefcase, permission: 'my-cases' },
  { label: 'Clientes', href: '/crm/clients', icon: Users, permission: 'clients' },
  { label: 'Peritos', href: '/crm/experts', icon: UserSearch, permission: 'experts' },
  { label: 'Cotizaciones', href: '/crm/quotes', icon: FileText, permission: 'quotes' },
  { label: 'Entregas', href: '/crm/deliverables', icon: ClipboardList, permission: 'deliverables' },
  { label: 'Planes de Trabajo', href: '/crm/work-plans', icon: ClipboardList, permission: 'work-plans' },
  { label: 'Evaluaciones', href: '/crm/evaluations', icon: Scale, permission: 'evaluations' },
  { label: 'Pagos', href: '/crm/payments', icon: CreditCard, permission: 'payments' },
  { label: 'Comisiones', href: '/crm/commissions', icon: Wallet, permission: 'commissions' },
  { label: 'Reportes', href: '/crm/reports', icon: BarChart3, permission: 'reports' },
  { label: 'Notificaciones', href: '/crm/notifications', icon: Bell, permission: 'notifications' },
  { label: 'Mi Perfil', href: '/crm/profile', icon: UserCircle, permission: 'profile' },
];

export const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, permission: 'dashboard' },
  { label: 'Usuarios', href: '/admin/users', icon: Users, permission: 'users' },
  { label: 'Clientes', href: '/admin/clients', icon: Users, permission: 'clients' },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: Shield, permission: 'audit-logs' },
  { label: 'Configuracion', href: '/admin/settings', icon: Settings, permission: 'settings' },
];
