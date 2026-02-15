"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, FileText, LayoutDashboard } from "lucide-react";
import type { CrmUser, CrmClient, ApiResponse } from "@/lib/types";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [clients, setClients] = useState<CrmClient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [usersRes, clientsRes] = await Promise.all([
          fetch("/api/admin/users"),
          fetch("/api/clients"),
        ]);

        if (usersRes.status === 401 || clientsRes.status === 401) {
          router.push("/admin/login");
          return;
        }

        const usersData: ApiResponse<CrmUser[]> = await usersRes.json();
        const clientsData: ApiResponse<CrmClient[]> = await clientsRes.json();

        if (usersData.success && usersData.data) setUsers(usersData.data);
        if (clientsData.success && clientsData.data) setClients(clientsData.data);
      } catch {
        // Network error
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const recentClients = clients.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#002b89]/10">
            <LayoutDashboard className="h-5 w-5" style={{ color: '#002b89' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>Dashboard Admin</h1>
            <p className="text-sm text-muted-foreground">Resumen del sistema</p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/60 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2969b0]/10">
              <Users className="h-4 w-4" style={{ color: '#2969b0' }} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: '#1b5697' }}>{users.length}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clientes</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1b5697]/10">
              <FileText className="h-4 w-4" style={{ color: '#1b5697' }} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" style={{ color: '#1b5697' }}>{clients.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-white">
        <CardHeader>
          <CardTitle>Clientes recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentClients.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay clientes registrados
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentClients.map((client) => (
                    <tr key={client._id} className="transition-colors hover:bg-accent/30">
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">{client.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{client.email}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{client.company}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          client.status === "activo" ? "bg-green-50 text-green-700"
                          : client.status === "inactivo" ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                        }`}>
                          {client.status === "activo" ? "Activo" : client.status === "inactivo" ? "Inactivo" : "Prospecto"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
