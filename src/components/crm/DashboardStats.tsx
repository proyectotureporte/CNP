import { Users, Activity, Clock, FileText } from 'lucide-react';
import type { DashboardStats as DashboardStatsType } from '@/lib/types';

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

const statConfig = [
  {
    key: 'totalClients' as const,
    label: 'Total Clientes',
    icon: Users,
    color: '#2969b0',
    lightBg: 'bg-[#2969b0]/8',
  },
  {
    key: 'activeUsers' as const,
    label: 'Usuarios Activos',
    icon: Activity,
    color: '#1b5697',
    lightBg: 'bg-[#1b5697]/8',
  },
  {
    key: 'recentCount' as const,
    label: 'Clientes Recientes',
    icon: Clock,
    color: '#002b89',
    lightBg: 'bg-[#002b89]/8',
  },
];

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const statValues = {
    totalClients: stats.totalClients,
    activeUsers: stats.activeUsers,
    recentCount: stats.recentClients.length,
  };

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {statConfig.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="relative overflow-hidden rounded-xl border border-border/60 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight" style={{ color: card.color }}>
                    {statValues[card.key]}
                  </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.lightBg}`}>
                  <Icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
              </div>
              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 h-0.5 w-full" style={{ background: `linear-gradient(90deg, ${card.color}, transparent)` }} />
            </div>
          );
        })}
      </div>

      {/* Recent Clients Section */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-base font-semibold">
              Clientes Recientes
            </h3>
          </div>
        </div>

        {stats.recentClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <FileText className="h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              No hay clientes recientes
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Los nuevos clientes apareceran aqui
            </p>
          </div>
        ) : (
          <ul>
            {stats.recentClients.slice(0, 5).map((client, index) => (
              <li
                key={client._id}
                className={`flex items-center justify-between px-6 py-4 transition-colors duration-200 hover:bg-accent/30 ${
                  index < Math.min(stats.recentClients.length, 5) - 1
                    ? 'border-b border-border/40'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #2969b0, #1b5697)' }}
                  >
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {client.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{client.company}</p>
                  </div>
                </div>
                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {formatDate(client._createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
