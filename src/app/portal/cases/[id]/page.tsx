'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, MapPin, Scale, Clock } from 'lucide-react';
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_COLORS,
  DISCIPLINE_LABELS,
  COMPLEXITY_LABELS,
  PRIORITY_LABELS,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
  type CaseExpanded,
  type CaseStatus,
  type CaseDiscipline,
  type CaseComplexity,
  type CasePriority,
  type Quote,
  type QuoteStatus,
  type CaseEvent,
  CASE_EVENT_LABELS,
  type CaseEventType,
} from '@/lib/types';

function formatDate(d?: string) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(v?: number) {
  if (!v) return '-';
  return `$${v.toLocaleString('es-CO')}`;
}

export default function PortalCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [caseData, setCaseData] = useState<CaseExpanded | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [caseRes, quotesRes, eventsRes] = await Promise.all([
          fetch(`/api/cases/${id}`),
          fetch(`/api/cases/${id}/quotes`),
          fetch(`/api/cases/${id}/events`),
        ]);
        const caseJson = await caseRes.json();
        const quotesJson = await quotesRes.json();
        const eventsJson = await eventsRes.json();

        if (caseJson.success) setCaseData(caseJson.data);
        if (quotesJson.success) setQuotes(quotesJson.data || []);
        if (eventsJson.success) setEvents(eventsJson.data || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Caso no encontrado</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/portal/cases">Volver</Link>
        </Button>
      </div>
    );
  }

  const sc = CASE_STATUS_COLORS[caseData.status as CaseStatus];

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/portal/cases">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Mis Casos
        </Link>
      </Button>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-sm text-muted-foreground">{caseData.caseCode}</span>
          <Badge className={`${sc?.bg} ${sc?.text} border-0`}>
            <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${sc?.dot}`} />
            {CASE_STATUS_LABELS[caseData.status as CaseStatus]}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{caseData.title}</h1>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informacion</TabsTrigger>
          <TabsTrigger value="quotes">Cotizaciones ({quotes.length})</TabsTrigger>
          <TabsTrigger value="timeline">Historial ({events.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {caseData.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Descripcion</p>
                  <p className="text-sm mt-1">{caseData.description}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Disciplina</p>
                    <p className="text-sm font-medium">
                      {DISCIPLINE_LABELS[caseData.discipline as CaseDiscipline]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Prioridad</p>
                    <p className="text-sm font-medium">
                      {PRIORITY_LABELS[caseData.priority as CasePriority]}
                    </p>
                  </div>
                </div>

                {caseData.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ciudad</p>
                      <p className="text-sm font-medium">{caseData.city}</p>
                    </div>
                  </div>
                )}

                {caseData.hearingDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Audiencia</p>
                      <p className="text-sm font-medium">{formatDate(caseData.hearingDate)}</p>
                    </div>
                  </div>
                )}

                {caseData.deadlineDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha limite</p>
                      <p className="text-sm font-medium">{formatDate(caseData.deadlineDate)}</p>
                    </div>
                  </div>
                )}

                {caseData.courtName && (
                  <div>
                    <p className="text-xs text-muted-foreground">Juzgado</p>
                    <p className="text-sm font-medium">{caseData.courtName}</p>
                  </div>
                )}

                {caseData.caseNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">Expediente</p>
                    <p className="text-sm font-medium">{caseData.caseNumber}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Complejidad</p>
                <p className="text-sm font-medium">
                  {COMPLEXITY_LABELS[caseData.complexity as CaseComplexity]}
                </p>
              </div>

              {caseData.commercial && (
                <div>
                  <p className="text-xs text-muted-foreground">Asesor Comercial</p>
                  <p className="text-sm font-medium">{caseData.commercial.displayName}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes">
          {quotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No hay cotizaciones aun</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {quotes.map((q) => {
                const qc = QUOTE_STATUS_COLORS[q.status as QuoteStatus];
                return (
                  <Card key={q._id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {formatCurrency(q.finalValue)}
                            </span>
                            <Badge className={`${qc?.bg} ${qc?.text} border-0 text-xs`}>
                              <span
                                className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${qc?.dot}`}
                              />
                              {QUOTE_STATUS_LABELS[q.status as QuoteStatus]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">v{q.version}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {q.estimatedHours}h | Tarifa: {formatCurrency(q.hourlyRate)}/h |{' '}
                            {formatDate(q._createdAt)}
                          </p>
                          {q.notes && (
                            <p className="text-xs text-muted-foreground">{q.notes}</p>
                          )}
                        </div>
                        {q.status === 'enviada' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={async () => {
                                const reason = prompt('Razon del rechazo:');
                                if (!reason) return;
                                await fetch(`/api/quotes/${q._id}/reject`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ rejectionReason: reason }),
                                });
                                window.location.reload();
                              }}
                            >
                              Rechazar
                            </Button>
                            <Button
                              size="sm"
                              onClick={async () => {
                                await fetch(`/api/quotes/${q._id}/approve`, {
                                  method: 'POST',
                                });
                                window.location.reload();
                              }}
                            >
                              Aprobar
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline">
          {events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">Sin actividad</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {events.map((ev) => (
                <Card key={ev._id}>
                  <CardContent className="flex items-start gap-3 pt-4">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {CASE_EVENT_LABELS[ev.eventType as CaseEventType]}
                      </p>
                      {ev.description && (
                        <p className="text-xs text-muted-foreground">{ev.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formatDate(ev._createdAt)} |{' '}
                        {ev.createdBy?.displayName || ev.createdByName || 'Sistema'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
