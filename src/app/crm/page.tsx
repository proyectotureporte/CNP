"use client";

import { useEffect, useState } from "react";
import { usePusher } from "@/hooks/usePusher";
import DashboardStats from "@/components/crm/DashboardStats";
import type {
  CrmClient,
  DashboardStats as DashboardStatsType,
  DashboardCaseMetricPoint,
  DashboardMetricPoint,
} from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="min-h-64 overflow-hidden rounded-2xl border border-border/60 bg-white p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
            <Skeleton className="mt-6 h-10 w-20" />
            <Skeleton className="mt-2 h-3 w-36" />
            <Skeleton className="mt-5 h-24 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border/60 bg-white p-6">
        <Skeleton className="mb-4 h-5 w-40" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-2 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CrmDashboardPage() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, loading: authLoading } = useAuth();

  usePusher(['client:created', 'client:updated', 'case:created', 'case:updated', 'case:status-changed'], () => {
    setRefreshKey((k) => k + 1);
  });

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const canReadClients = user.allRoles || user.role === 'admin' || user.role === 'comercial_juridico';
        const [summaryRes, clientsRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          canReadClients ? fetch("/api/clients") : Promise.resolve(null),
        ]);
        const summaryData = await summaryRes.json();
        const clientsData = clientsRes ? await clientsRes.json() : { success: true, data: [] };
        const clients: CrmClient[] = clientsData.success ? clientsData.data : [];

        if (!summaryData.success) {
          throw new Error(summaryData.error || 'No fue posible cargar las métricas');
        }

        const summary = summaryData.data as {
          totalClients: number;
          clientGrowthByMonth: DashboardMetricPoint[];
          clientRegistrationsByDay: DashboardMetricPoint[];
          caseRegistrationsByDay: DashboardCaseMetricPoint[];
        };

        setStats({
          totalClients: summary.totalClients,
          recentClients: clients.slice(0, 5),
          clientGrowthByMonth: summary.clientGrowthByMonth,
          clientRegistrationsByDay: summary.clientRegistrationsByDay,
          caseRegistrationsByDay: summary.caseRegistrationsByDay,
        });
      } catch {
        setError("Error al cargar los datos del dashboard.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshKey, user]);

  return (
    <div>
      {error && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {(loading || authLoading) && <DashboardSkeleton />}
      {stats && user && <DashboardStats stats={stats} userRole={user.role} allRoles={user.allRoles} />}
    </div>
  );
}
