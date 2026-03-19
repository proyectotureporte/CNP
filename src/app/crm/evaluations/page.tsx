'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePusher } from '@/hooks/usePusher';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Scale,
  ChevronLeft,
  ChevronRight,
  Star,
  ExternalLink,
  User,
  MessageSquare,
} from 'lucide-react';
import type { Evaluation } from '@/lib/types';

interface EvaluationWithCase extends Evaluation {
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

function ScoreBar({
  label,
  score,
  maxScore = 5,
}: {
  label: string;
  score: number;
  maxScore?: number;
}) {
  const pct = (score / maxScore) * 100;
  const color =
    score >= 4 ? 'bg-green-500' : score >= 3 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}/{maxScore}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={`h-1.5 rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FinalScoreBadge({ score }: { score: number }) {
  const color =
    score >= 4
      ? 'bg-green-100 text-green-700 border-green-200'
      : score >= 3
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : 'bg-red-100 text-red-700 border-red-200';

  return (
    <div
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 ${color}`}
    >
      <Star className="h-4 w-4 fill-current" />
      <span className="text-lg font-bold">{score.toFixed(1)}</span>
    </div>
  );
}

export default function EvaluationsPage() {
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<EvaluationWithCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      const res = await fetch(`/api/evaluations?${params}`);
      const data = await res.json();
      if (data.success) {
        setEvaluations(data.data);
        setTotalPages(data.meta?.totalPages || 1);
        setTotal(data.meta?.total || 0);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  usePusher(['evaluation:created'], () => { load(); });

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
            <Scale className="h-5 w-5" style={{ color: '#2969b0' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>
              Evaluaciones
            </h1>
            <p className="text-sm text-muted-foreground">
              {total} evaluacion{total !== 1 ? 'es' : ''} registrada{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : evaluations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Scale className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay evaluaciones registradas</p>
            <p className="text-xs text-muted-foreground mt-1">
              Las evaluaciones se crean desde el detalle de cada caso
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {evaluations.map((ev) => (
            <Card key={ev._id} className="transition-colors hover:bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-3">
                    {/* Case info */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          ev.case?._id && router.push(`/crm/cases/${ev.case._id}`)
                        }
                        className="text-xs font-mono text-muted-foreground hover:text-primary hover:underline"
                      >
                        {ev.case?.caseCode}
                      </button>
                      <span className="text-xs text-muted-foreground truncate">
                        {ev.case?.title}
                      </span>
                    </div>

                    {/* Expert + evaluator */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {ev.expert && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Perito: {ev.expert.displayName}
                        </span>
                      )}
                      {ev.evaluatedBy && (
                        <span>Evaluado por: {ev.evaluatedBy.displayName}</span>
                      )}
                      <span>{formatDate(ev._createdAt)}</span>
                    </div>

                    {/* Score bars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg">
                      <ScoreBar label="Puntualidad" score={ev.punctualityScore} />
                      <ScoreBar label="Calidad" score={ev.qualityScore} />
                      <ScoreBar label="Servicio" score={ev.serviceScore} />
                    </div>

                    {/* Feedback */}
                    {(ev.clientFeedback || ev.technicalFeedback) && (
                      <div className="space-y-1.5">
                        {ev.clientFeedback && (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>
                              <strong>Cliente:</strong> {ev.clientFeedback}
                            </span>
                          </div>
                        )}
                        {ev.technicalFeedback && (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>
                              <strong>Tecnico:</strong> {ev.technicalFeedback}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Final score + action */}
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <FinalScoreBadge score={ev.finalScore} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        ev.case?._id && router.push(`/crm/cases/${ev.case._id}`)
                      }
                      title="Ver caso"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
    </>
  );
}
