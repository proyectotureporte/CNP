"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import type { Commission } from "@/lib/types";

function formatCurrency(v: number) { return `$${v.toLocaleString("es-CO")}`; }

export default function CommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("page", String(page));
      params.set("limit", "20");
      const res = await fetch(`/api/commissions/list?${params}`);
      const data = await res.json();
      if (data.success) { setCommissions(data.data); setTotalPages(data.meta?.totalPages || 1); }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page, status]);

  const statusColors: Record<string, { bg: string; text: string }> = {
    pendiente: { bg: "bg-amber-50", text: "text-amber-700" },
    pagada: { bg: "bg-green-50", text: "text-green-700" },
    anulada: { bg: "bg-red-50", text: "text-red-700" },
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
            <Wallet className="h-5 w-5" style={{ color: '#2969b0' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>Comisiones</h1>
            <p className="text-sm text-muted-foreground">Gestiona las comisiones de peritos</p>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <Select value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="pagada">Pagada</SelectItem>
            <SelectItem value="anulada">Anulada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      : commissions.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12"><Wallet className="h-8 w-8 text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">No hay comisiones</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {commissions.map((c) => {
            const sc = statusColors[c.status] || statusColors.pendiente;
            return (
              <Card key={c._id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatCurrency(c.finalAmount)}</span>
                      <Badge className={`${sc.bg} ${sc.text} border-0 text-xs`}>{c.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Perito: {c.expert?.displayName || "-"} | {c.caseRef?.caseCode} - {c.caseRef?.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Base: {formatCurrency(c.baseAmount)} | Bonus: {c.bonusPercentage}% | Penalidad: {c.penaltyPercentage}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm text-muted-foreground">Pagina {page} de {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      )}
    </>
  );
}
