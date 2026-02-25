"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus, CheckCircle, XCircle, DollarSign,
  Loader2, Clock, FileText, Pencil, Upload, ExternalLink,
  AlertTriangle, Info,
} from "lucide-react";
import {
  QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  type Quote, type Payment,
} from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import QuoteForm from "./QuoteForm";

interface QuoteListProps {
  caseId: string;
  userRole?: string;
}

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "$0";
  return `${value.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-CO", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function formatDateTime(dateStr?: string) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("es-CO", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function QuoteList({ caseId, userRole }: QuoteListProps) {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotePayments, setQuotePayments] = useState<Record<string, Payment[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogQuote, setRejectDialogQuote] = useState<Quote | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [uploadingPaymentId, setUploadingPaymentId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const role = userRole || user?.role || '';
  const canManageQuotes = user && ["admin", "juridico", "financiero"].includes(role);
  const canApproveQuotes = user && ["admin", "cliente"].includes(role);
  const isFinanciero = role === "financiero";

  const loadQuotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${caseId}/quotes`);
      const data = await res.json();
      if (data.success) {
        setQuotes(data.data);
        // Load payments for each quote
        const paymentMap: Record<string, Payment[]> = {};
        await Promise.all(
          data.data.map(async (q: Quote) => {
            const pRes = await fetch(`/api/payments/${q._id}/quote`);
            const pData = await pRes.json();
            if (pData.success) {
              paymentMap[q._id] = pData.data;
            }
          })
        );
        setQuotePayments(paymentMap);
      }
    } catch {
      setError("Error al cargar cotizaciones");
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  async function handleApprove(quoteId: string) {
    setActionLoading(quoteId);
    setError("");
    try {
      const res = await fetch(`/api/quotes/${quoteId}/approve`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await loadQuotes();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!rejectDialogQuote || !rejectionReason.trim()) return;
    setActionLoading(rejectDialogQuote._id);
    setError("");
    try {
      const res = await fetch(`/api/quotes/${rejectDialogQuote._id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setRejectDialogQuote(null);
        setRejectionReason("");
        await loadQuotes();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUploadReceipt(paymentId: string, file: File) {
    setUploadingPaymentId(paymentId);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/payments/${paymentId}/receipt`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        await loadQuotes();
      } else {
        setError(data.error || "Error subiendo justificante");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setUploadingPaymentId(null);
    }
  }


  function handleFormSuccess() {
    setShowForm(false);
    setEditingQuote(null);
    setLoading(true);
    loadQuotes();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (showForm || editingQuote) {
    return (
      <QuoteForm
        caseId={caseId}
        initialData={editingQuote || undefined}
        onSuccess={handleFormSuccess}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {quotes.length} cotizacion{quotes.length !== 1 ? "es" : ""}
        </p>
        {canManageQuotes && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cotizacion
          </Button>
        )}
      </div>

      {/* Quotes List */}
      {quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <DollarSign className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No hay cotizaciones</p>
          {canManageQuotes && (
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear primera cotizacion
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => {
            const statusColor = QUOTE_STATUS_COLORS[quote.status];
            const isLoading = actionLoading === quote._id;
            const payments = quotePayments[quote._id] || [];
            return (
              <Card key={quote._id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Version {quote.version}
                    </CardTitle>
                    <Badge className={`${statusColor?.bg} ${statusColor?.text} border-0`}>
                      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusColor?.dot}`} />
                      {QUOTE_STATUS_LABELS[quote.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Values Summary */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Precio Total</p>
                      <p className="text-sm font-medium">{formatCurrency(quote.totalPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Descuento</p>
                      <p className="text-sm font-medium">{quote.discountPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Final</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(quote.finalValue)}</p>
                    </div>
                  </div>

                  {/* Quote Document */}
                  {quote.quoteDocumentUrl && (
                    <a
                      href={quote.quoteDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver Documento de Cotizacion
                    </a>
                  )}

                  {/* Payments Section */}
                  {payments.length > 0 && (
                    <div className="rounded-lg border p-3 space-y-3">
                      <p className="text-sm font-medium">Pagos</p>
                      {payments.map((payment) => {
                        const pColor = PAYMENT_STATUS_COLORS[payment.status];
                        const isUploading = uploadingPaymentId === payment._id;
                        return (
                          <div key={payment._id} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 p-2">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">
                                  Pago {payment.paymentNumber}: {formatCurrency(payment.amount)}
                                </span>
                                <Badge className={`${pColor?.bg} ${pColor?.text} border-0 text-xs`}>
                                  <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${pColor?.dot}`} />
                                  {PAYMENT_STATUS_LABELS[payment.status]}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {payment.percentage}% | Vence: {formatDate(payment.dueDate)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Upload receipt button - only for pending payments when user can manage */}
                              {payment.status === "pendiente" && canManageQuotes && (
                                <div className="relative">
                                  <Input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleUploadReceipt(payment._id, f);
                                    }}
                                    disabled={isUploading}
                                  />
                                  <Button variant="outline" size="sm" disabled={isUploading} className="pointer-events-none">
                                    {isUploading ? (
                                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Upload className="mr-1.5 h-3.5 w-3.5" />
                                    )}
                                    Subir Pago {payment.paymentNumber}
                                  </Button>
                                </div>
                              )}
                              {/* View receipt link - only for validated payments */}
                              {payment.status === "validado" && payment.receiptUrl && (
                                <a
                                  href={payment.receiptUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button variant="outline" size="sm" type="button">
                                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                                    Ver Justificante {payment.paymentNumber}
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Creada: {formatDateTime(quote._createdAt)}
                    </span>
                    {quote.validUntil && (
                      <span>Valida hasta: {formatDate(quote.validUntil)}</span>
                    )}
                    {quote.sentAt && (
                      <span>Enviada: {formatDateTime(quote.sentAt)}</span>
                    )}
                    {quote.approvedAt && (
                      <span>Aprobada: {formatDateTime(quote.approvedAt)}</span>
                    )}
                    {quote.createdBy && (
                      <span>Por: {quote.createdBy.displayName}</span>
                    )}
                    {quote.approvedBy && (
                      <span>Aprobada por: {quote.approvedBy.displayName}</span>
                    )}
                  </div>

                  {/* Notes */}
                  {quote.notes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Notas</p>
                      <p className="text-sm mt-0.5">{quote.notes}</p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {quote.rejectionReason && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                      <p className="text-xs font-medium text-red-700">Razon de Rechazo</p>
                      <p className="text-sm text-red-600 mt-0.5">{quote.rejectionReason}</p>
                    </div>
                  )}

                  <Separator />

                  {/* Actions */}
                  <div className="flex justify-end gap-2">
                    {quote.status === "borrador" && canManageQuotes && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingQuote(quote)}
                        disabled={isLoading}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Editar
                      </Button>
                    )}
                    {quote.status === "enviada" && canApproveQuotes && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRejectDialogQuote(quote);
                            setRejectionReason("");
                          }}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="mr-2 h-3.5 w-3.5" />
                          Rechazar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(quote._id)}
                          disabled={isLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isLoading ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-2 h-3.5 w-3.5" />
                          )}
                          Aprobar
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

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialogQuote} onOpenChange={(open) => !open && setRejectDialogQuote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Cotizacion</DialogTitle>
            <DialogDescription>
              Indique la razon por la cual rechaza esta cotizacion (Version {rejectDialogQuote?.version}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Razon de rechazo *</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explique la razon del rechazo..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogQuote(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || !!actionLoading}
            >
              {actionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
