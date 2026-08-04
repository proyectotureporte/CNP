"use client";

import { useEffect, useRef, useState } from "react";
import { usePusher } from "@/hooks/usePusher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Wallet, ChevronLeft, ChevronRight, Download, Loader2, Upload } from "lucide-react";
import type { Commission } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";

function formatCurrency(v: number) { return `$${v.toLocaleString("es-CO")}`; }

export default function CommissionsPage() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  useEffect(() => { load(); }, [page, status]); // eslint-disable-line react-hooks/exhaustive-deps

  usePusher(['commission:calculated', 'commission:updated'], () => { load(); });

  async function uploadReceipt(id: string, file: File) {
    setUploadingId(id);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const response = await fetch(`/api/commissions/${id}/receipt`, { method: "POST", body: form });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "No fue posible cargar el comprobante");
      await load();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No fue posible cargar el comprobante");
    } finally {
      setUploadingId(null);
      if (fileRefs.current[id]) fileRefs.current[id]!.value = "";
    }
  }

  const isExpert = user?.role === "perito";
  const canUploadReceipt = user?.role === "admin" || user?.role === "financiero";

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
            <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>{isExpert ? "Mis pagos" : "Comisiones"}</h1>
            <p className="text-sm text-muted-foreground">{isExpert ? "Consulta únicamente los pagos y comprobantes de tus servicios" : "Gestiona las comisiones de peritos"}</p>
          </div>
        </div>
      </div>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
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
                <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatCurrency(c.finalAmount)}</span>
                      <Badge className={`${sc.bg} ${sc.text} border-0 text-xs`}>{c.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {!isExpert && <>Perito: {c.expert?.displayName || "-"} | </>}{c.caseRef?.caseCode} - {c.caseRef?.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Base: {formatCurrency(c.baseAmount)} | Bonus: {c.bonusPercentage}% | Penalidad: {c.penaltyPercentage}%
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.receiptDownloadUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={c.receiptDownloadUrl} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" />Ver comprobante</a>
                      </Button>
                    )}
                    {canUploadReceipt && (
                      <>
                        <input ref={(element) => { fileRefs.current[c._id] = element; }} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadReceipt(c._id, file); }} />
                        <Button size="sm" onClick={() => fileRefs.current[c._id]?.click()} disabled={uploadingId === c._id}>
                          {uploadingId === c._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          {c.receiptDownloadUrl ? "Reemplazar comprobante" : "Cargar comprobante"}
                        </Button>
                      </>
                    )}
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
