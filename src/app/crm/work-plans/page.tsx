'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePusher } from '@/hooks/usePusher';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
  CheckCircle2,
  XCircle,
  Send,
  Calendar,
  User,
  ExternalLink,
} from 'lucide-react';
import {
  WORK_PLAN_STATUS_LABELS,
  WORK_PLAN_STATUS_COLORS,
  type WorkPlan,
  type WorkPlanStatus,
} from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

interface WorkPlanWithCase extends WorkPlan {
  case?: { _id: string; caseCode: string; title: string };
  activityCounts?: { total: number; completadas: number };
}

function formatDate(d?: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function WorkPlansPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [plans, setPlans] = useState<WorkPlanWithCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Action dialogs
  const [actionTarget, setActionTarget] = useState<WorkPlanWithCase | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'submit'>('approve');
  const [rejectionComments, setRejectionComments] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('page', String(page));
      params.set('limit', '20');
      const res = await fetch(`/api/work-plans?${params}`);
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
        setTotalPages(data.meta?.totalPages || 1);
        setTotal(data.meta?.total || 0);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  usePusher(
    ['work-plan:submitted', 'work-plan:approved', 'work-plan:rejected', 'activity:created', 'activity:updated'],
    () => { load(); }
  );

  async function handleAction() {
    if (!actionTarget) return;
    if (actionType === 'reject' && !rejectionComments.trim()) return;
    setProcessing(true);
    try {
      let url = '';
      let body: Record<string, string> = {};

      if (actionType === 'approve') {
        url = `/api/work-plans/${actionTarget._id}/approve`;
      } else if (actionType === 'reject') {
        url = `/api/work-plans/${actionTarget._id}/reject`;
        body = { rejectionComments };
      } else if (actionType === 'submit') {
        url = `/api/work-plans/${actionTarget._id}/submit`;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setActionTarget(null);
        setRejectionComments('');
        load();
      }
    } catch {
      /* ignore */
    } finally {
      setProcessing(false);
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
              Planes de Trabajo
            </h1>
            <p className="text-sm text-muted-foreground">
              {total} plan{total !== 1 ? 'es' : ''} de trabajo en el sistema
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
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="en_revision">En Revision</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <ClipboardList className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay planes de trabajo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {plans.map((p) => {
            const sc = WORK_PLAN_STATUS_COLORS[p.status as WorkPlanStatus];
            const actTotal = p.activityCounts?.total || 0;
            const actDone = p.activityCounts?.completadas || 0;
            const progressPct = actTotal > 0 ? Math.round((actDone / actTotal) * 100) : 0;

            return (
              <Card key={p._id} className="transition-colors hover:bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Case info */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            p.case?._id && router.push(`/crm/cases/${p.case._id}`)
                          }
                          className="text-xs font-mono text-muted-foreground hover:text-primary hover:underline"
                        >
                          {p.case?.caseCode}
                        </button>
                        <span className="text-xs text-muted-foreground truncate">
                          {p.case?.title}
                        </span>
                      </div>

                      {/* Status + Expert */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${sc?.bg} ${sc?.text} border-0 text-xs`}>
                          <span
                            className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${sc?.dot}`}
                          />
                          {WORK_PLAN_STATUS_LABELS[p.status as WorkPlanStatus]}
                        </Badge>
                        {p.assignedExpert && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {p.assignedExpert.displayName}
                          </span>
                        )}
                      </div>

                      {/* Dates + methodology */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {(p.startDate || p.endDate) && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(p.startDate)} - {formatDate(p.endDate)}
                          </span>
                        )}
                        {p.estimatedDays && <span>{p.estimatedDays} dias estimados</span>}
                        <span>{formatDate(p._createdAt)}</span>
                      </div>

                      {/* Methodology preview */}
                      {p.methodology && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {p.methodology}
                        </p>
                      )}

                      {/* Rejection reason */}
                      {p.status === 'rechazado' && p.rejectionComments && (
                        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                          Rechazado: {p.rejectionComments}
                        </p>
                      )}

                      {/* Activities progress */}
                      {actTotal > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              Actividades: {actDone}/{actTotal} completadas
                            </span>
                            <span>{progressPct}%</span>
                          </div>
                          <Progress value={progressPct} className="h-1.5" />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          p.case?._id && router.push(`/crm/cases/${p.case._id}`)
                        }
                        title="Ver caso"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>

                      {/* Submit (borrador/rechazado) */}
                      {(p.status === 'borrador' || p.status === 'rechazado') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => {
                            setActionTarget(p);
                            setActionType('submit');
                          }}
                          title="Enviar a revision"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Approve/Reject (enviado/en_revision) - admin only */}
                      {isAdmin &&
                        (p.status === 'enviado' || p.status === 'en_revision') && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                setActionTarget(p);
                                setActionType('approve');
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
                                setActionTarget(p);
                                setActionType('reject');
                                setRejectionComments('');
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
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
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
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog
        open={!!actionTarget}
        onOpenChange={(open) => {
          if (!open) {
            setActionTarget(null);
            setRejectionComments('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve'
                ? 'Aprobar Plan de Trabajo'
                : actionType === 'reject'
                  ? 'Rechazar Plan de Trabajo'
                  : 'Enviar Plan a Revision'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-sm font-medium">
                {actionTarget?.case?.caseCode} - {actionTarget?.case?.title}
              </p>
              {actionTarget?.assignedExpert && (
                <p className="text-xs text-muted-foreground">
                  Perito: {actionTarget.assignedExpert.displayName}
                </p>
              )}
              {actionTarget?.methodology && (
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {actionTarget.methodology}
                </p>
              )}
            </div>

            {actionType === 'approve' && (
              <p className="text-sm text-muted-foreground">
                Confirma que deseas aprobar este plan de trabajo.
              </p>
            )}

            {actionType === 'submit' && (
              <p className="text-sm text-muted-foreground">
                El plan sera enviado para revision por el comite.
              </p>
            )}

            {actionType === 'reject' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Comentarios de rechazo *</label>
                <Textarea
                  value={rejectionComments}
                  onChange={(e) => setRejectionComments(e.target.value)}
                  placeholder="Explica por que se rechaza este plan..."
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionTarget(null)}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              disabled={
                processing || (actionType === 'reject' && !rejectionComments.trim())
              }
              className={
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : actionType === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : ''
              }
            >
              {processing
                ? 'Procesando...'
                : actionType === 'approve'
                  ? 'Aprobar'
                  : actionType === 'reject'
                    ? 'Rechazar'
                    : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
