'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePusher } from '@/hooks/usePusher';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  DELIVERABLE_PHASE_LABELS,
  DELIVERABLE_STATUS_LABELS,
  DELIVERABLE_STATUS_COLORS,
  type Deliverable,
  type DeliverablePhase,
  type DeliverableStatus,
} from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

interface DeliverableWithCase extends Deliverable {
  case?: { _id: string; caseCode: string; title: string };
}

function formatDate(d?: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function DeliverablesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [deliverables, setDeliverables] = useState<DeliverableWithCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [phase, setPhase] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Review dialog
  const [reviewTarget, setReviewTarget] = useState<DeliverableWithCase | null>(null);
  const [reviewAction, setReviewAction] = useState<'aprobado' | 'rechazado'>('aprobado');
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (phase) params.set('phase', phase);
      params.set('page', String(page));
      params.set('limit', '20');
      const res = await fetch(`/api/deliverables?${params}`);
      const data = await res.json();
      if (data.success) {
        setDeliverables(data.data);
        setTotalPages(data.meta?.totalPages || 1);
        setTotal(data.meta?.total || 0);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [status, phase, page]);

  useEffect(() => {
    load();
  }, [load]);

  usePusher(['deliverable:created', 'deliverable:reviewed'], () => { load(); });

  async function handleReview() {
    if (!reviewTarget) return;
    if (reviewAction === 'rechazado' && !rejectionReason.trim()) return;
    setReviewing(true);
    try {
      const res = await fetch(`/api/deliverables/${reviewTarget._id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          rejectionReason: reviewAction === 'rechazado' ? rejectionReason : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewTarget(null);
        setRejectionReason('');
        load();
      }
    } catch {
      /* ignore */
    } finally {
      setReviewing(false);
    }
  }

  const isAdmin = user?.role === 'admin';

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
            <ClipboardList className="h-5 w-5" style={{ color: '#2969b0' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>
              Entregas
            </h1>
            <p className="text-sm text-muted-foreground">
              {total} entrega{total !== 1 ? 's' : ''} en el sistema
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          value={status || 'all'}
          onValueChange={(v) => {
            setStatus(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="en_revision">En Revision</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={phase || 'all'}
          onValueChange={(v) => {
            setPhase(v === 'all' ? '' : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Fase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fases</SelectItem>
            <SelectItem value="marco_conceptual">Marco Conceptual</SelectItem>
            <SelectItem value="desarrollo_tecnico">Desarrollo Tecnico</SelectItem>
            <SelectItem value="dictamen_final">Dictamen Final</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : deliverables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay entregas registradas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {deliverables.map((d) => {
            const sc = DELIVERABLE_STATUS_COLORS[d.status as DeliverableStatus];
            return (
              <Card key={d._id} className="transition-colors hover:bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      {/* Case info */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => d.case?._id && router.push(`/crm/cases/${d.case._id}`)}
                          className="text-xs font-mono text-muted-foreground hover:text-primary hover:underline"
                        >
                          {d.case?.caseCode}
                        </button>
                        <span className="text-xs text-muted-foreground truncate">
                          {d.case?.title}
                        </span>
                      </div>

                      {/* Phase + Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {DELIVERABLE_PHASE_LABELS[d.phase as DeliverablePhase]}
                        </Badge>
                        <Badge className={`${sc?.bg} ${sc?.text} border-0 text-xs`}>
                          <span
                            className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${sc?.dot}`}
                          />
                          {DELIVERABLE_STATUS_LABELS[d.status as DeliverableStatus]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">v{d.version}</span>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {d.submittedBy && <span>Por: {d.submittedBy.displayName}</span>}
                        <span>{formatDate(d._createdAt)}</span>
                        {d.fileName && <span>{d.fileName}</span>}
                      </div>

                      {/* Rejection reason */}
                      {d.status === 'rechazado' && d.rejectionReason && (
                        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 mt-1">
                          Rechazado: {d.rejectionReason}
                        </p>
                      )}

                      {/* Comments */}
                      {d.comments && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          {d.comments}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      {d.fileUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(d.fileUrl, '_blank')}
                          title="Descargar archivo"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => d.case?._id && router.push(`/crm/cases/${d.case._id}`)}
                        title="Ver caso"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      {isAdmin &&
                        (d.status === 'enviado' || d.status === 'en_revision') && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                setReviewTarget(d);
                                setReviewAction('aprobado');
                              }}
                              title="Aprobar"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setReviewTarget(d);
                                setReviewAction('rechazado');
                                setRejectionReason('');
                              }}
                              title="Rechazar"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Pagina {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog
        open={!!reviewTarget}
        onOpenChange={(open) => {
          if (!open) {
            setReviewTarget(null);
            setRejectionReason('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'aprobado' ? 'Aprobar Entrega' : 'Rechazar Entrega'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-sm font-medium">
                {reviewTarget?.case?.caseCode} - {reviewTarget?.case?.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {DELIVERABLE_PHASE_LABELS[reviewTarget?.phase as DeliverablePhase]} | v
                {reviewTarget?.version}
              </p>
              {reviewTarget?.fileName && (
                <p className="text-xs text-muted-foreground">{reviewTarget.fileName}</p>
              )}
            </div>

            {reviewAction === 'aprobado' ? (
              <p className="text-sm text-muted-foreground">
                Confirma que deseas aprobar esta entrega. El perito sera notificado.
              </p>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Razon del rechazo *</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explica por que se rechaza esta entrega..."
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewTarget(null)} disabled={reviewing}>
              Cancelar
            </Button>
            <Button
              onClick={handleReview}
              disabled={reviewing || (reviewAction === 'rechazado' && !rejectionReason.trim())}
              className={
                reviewAction === 'aprobado'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {reviewing
                ? 'Procesando...'
                : reviewAction === 'aprobado'
                  ? 'Aprobar'
                  : 'Rechazar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
