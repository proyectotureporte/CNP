"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DollarSign, ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import { PAYMENT_STATUS_COLORS, type Payment, type PaymentStatus } from "@/lib/types";

function formatCurrency(v: number) { return `$${v.toLocaleString("es-CO")}`; }
function formatDate(d?: string) { if (!d) return "-"; return new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" }); }

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
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
      const res = await fetch(`/api/payments/list?${params}`);
      const data = await res.json();
      if (data.success) { setPayments(data.data); setTotalPages(data.meta?.totalPages || 1); }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [page, status]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
            <CreditCard className="h-5 w-5" style={{ color: '#2969b0' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>Pagos</h1>
            <p className="text-sm text-muted-foreground">Gestiona los pagos del sistema</p>
          </div>
        </div>
      </div>
      <div className="mb-4 flex gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="anulado">Anulado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : payments.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12"><DollarSign className="h-8 w-8 text-muted-foreground mb-3" /><p className="text-sm text-muted-foreground">No hay pagos</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const sc = PAYMENT_STATUS_COLORS[p.status as PaymentStatus];
            return (
              <Card key={p._id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatCurrency(p.amount)}</span>
                      <Badge className={`${sc?.bg} ${sc?.text} border-0 text-xs`}><span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${sc?.dot}`} />{p.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.caseRef?.caseCode} - {p.caseRef?.title} | {p.paymentMethod} | {formatDate(p.paymentDate)}
                    </p>
                    {p.transactionReference && <p className="text-xs text-muted-foreground">Ref: {p.transactionReference}</p>}
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
