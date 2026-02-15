"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  Plus, Send, CheckCircle, XCircle, DollarSign,
  Loader2, Clock, FileText, Pencil,
} from "lucide-react";
import {
  QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS,
  type Quote, type QuoteStatus,
} from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import QuoteForm from "./QuoteForm";

interface QuoteListProps {
  caseId: string;
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

export default function QuoteList({ caseId }: QuoteListProps) {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialogQuote, setRejectDialogQuote] = useState<Quote | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");

  const canManageQuotes = user && ["admin", "comercial", "tecnico"].includes(user.role);
  const canApproveQuotes = user && ["admin", "cliente", "comite"].includes(user.role);

  async function loadQuotes() {
    try {
      const res = await fetch(`/api/cases/${caseId}/quotes`);
      const data = await res.json();
      if (data.success) {
        setQuotes(data.data);
      }
    } catch {
      setError("Error al cargar cotizaciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuotes();
  }, [caseId]);

  async function handleSend(quoteId: string) {
    setActionLoading(quoteId);
    setError("");
    try {
      const res = await fetch(`/api/quotes/${quoteId}/send`, { method: "POST" });
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
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Horas</p>
                      <p className="text-sm font-medium">{quote.estimatedHours} hrs</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tarifa/Hora</p>
                      <p className="text-sm font-medium">{formatCurrency(quote.hourlyRate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Subtotal</p>
                      <p className="text-sm font-medium">{formatCurrency(quote.totalValue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Final</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(quote.finalValue)}</p>
                    </div>
                  </div>

                  {/* Detail breakdown */}
                  <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Base ({quote.estimatedHours}h x {formatCurrency(quote.hourlyRate)})</span>
                      <span>{formatCurrency(quote.baseValue)}</span>
                    </div>
                    {quote.expenses > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Gastos</span>
                        <span>+ {formatCurrency(quote.expenses)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Margen ({quote.marginPercentage}%)</span>
                      <span>+ {formatCurrency(quote.baseValue * quote.marginPercentage / 100)}</span>
                    </div>
                    {quote.discountPercentage > 0 && (
                      <div className="flex justify-between text-xs text-red-600">
                        <span>Descuento ({quote.discountPercentage}%)</span>
                        <span>- {formatCurrency(quote.totalValue * quote.discountPercentage / 100)}</span>
                      </div>
                    )}
                  </div>

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
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingQuote(quote)}
                          disabled={isLoading}
                        >
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSend(quote._id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="mr-2 h-3.5 w-3.5" />
                          )}
                          Enviar
                        </Button>
                      </>
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
