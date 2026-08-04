"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, Receipt, Upload, Wallet } from "lucide-react";
import { usePusher } from "@/hooks/usePusher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  type Payment,
  type PaymentStatus,
} from "@/lib/types";

function formatCurrency(value: number) {
  return `$${Number(value || 0).toLocaleString("es-CO")}`;
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString("es-CO") : "Sin fecha";
}

export default function CasePaymentsTab({ caseId, userRole }: { caseId: string; userRole: string }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    if (userRole === "perito") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/cases/${caseId}/payments`);
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "No fue posible cargar los pagos");
      setPayments(payload.data || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los pagos");
    } finally {
      setLoading(false);
    }
  }, [caseId, userRole]);

  useEffect(() => { load(); }, [load]);
  usePusher(["payment:updated", "payment:receipt"], () => { load(); });

  async function uploadReceipt(paymentId: string, file: File) {
    setUploadingId(paymentId);
    setError("");
    try {
      const form = new FormData();
      form.set("paymentId", paymentId);
      form.set("file", file);
      const response = await fetch(`/api/cases/${caseId}/payment-receipts`, { method: "POST", body: form });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "No fue posible cargar el comprobante");
      await load();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No fue posible cargar el comprobante");
    } finally {
      setUploadingId(null);
      if (fileRefs.current[paymentId]) fileRefs.current[paymentId]!.value = "";
    }
  }

  if (userRole === "perito") {
    return (
      <Card><CardContent className="flex flex-col items-center py-12 text-center"><Wallet className="mb-3 h-8 w-8 text-muted-foreground" /><h3 className="font-semibold">Pagos de tu servicio</h3><p className="mb-4 max-w-md text-sm text-muted-foreground">Los pagos del cliente son privados. Tus propios comprobantes se consultan en Mis pagos.</p><Button asChild><Link href="/crm/commissions">Ir a Mis pagos</Link></Button></CardContent></Card>
    );
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {userRole === "cliente" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Carga aquí tu comprobante. El pago permanecerá pendiente hasta que el área financiera lo valide.
        </div>
      )}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {payments.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-12 text-muted-foreground"><Receipt className="mb-3 h-8 w-8" /><p className="text-sm">No hay pagos registrados para este caso.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const colors = PAYMENT_STATUS_COLORS[payment.status as PaymentStatus];
            return (
              <Card key={payment._id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">Pago {payment.paymentNumber || ""}: {formatCurrency(payment.amount)}</span>
                      <Badge className={`${colors?.bg} ${colors?.text} border-0`}>{PAYMENT_STATUS_LABELS[payment.status as PaymentStatus]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{payment.percentage || 0}% · vence {formatDate(payment.dueDate)}</p>
                    {payment.paymentDate && <p className="text-xs text-muted-foreground">Comprobante cargado {formatDate(payment.paymentDate)}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {payment.receiptDownloadUrl && (
                      <Button variant="outline" size="sm" asChild><a href={payment.receiptDownloadUrl} target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" />Ver comprobante</a></Button>
                    )}
                    {userRole === "cliente" && payment.status !== "validado" && (
                      <>
                        <input
                          ref={(element) => { fileRefs.current[payment._id] = element; }}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                          className="hidden"
                          onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadReceipt(payment._id, file); }}
                        />
                        <Button size="sm" onClick={() => fileRefs.current[payment._id]?.click()} disabled={uploadingId === payment._id}>
                          {uploadingId === payment._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                          {payment.receiptDownloadUrl ? "Reemplazar comprobante" : "Cargar comprobante"}
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
    </div>
  );
}
