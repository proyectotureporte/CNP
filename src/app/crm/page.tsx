"use client";

import { useEffect, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import DashboardStats from "@/components/crm/DashboardStats";
import type { CrmClient, DashboardStats as DashboardStatsType } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-white p-6">
            <Skeleton className="mb-3 h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-3 h-2 w-32" />
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

  useEffect(() => {
    async function loadData() {
      try {
        const clientsRes = await fetch("/api/clients");
        const clientsData = await clientsRes.json();
        const clients: CrmClient[] = clientsData.success ? clientsData.data : [];

        setStats({
          totalClients: clients.length,
          activeUsers: 0,
          recentClients: clients.slice(0, 5),
        });
      } catch {
        setError("Error al cargar los datos del dashboard.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
            <LayoutDashboard className="h-5 w-5" style={{ color: '#2969b0' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Resumen general del sistema
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      )}

      {loading && <DashboardSkeleton />}
      {stats && <DashboardStats stats={stats} />}
    </div>
  );
}
