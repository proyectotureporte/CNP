'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Calendar, Download, Eye, FileText, MapPin, Scale, Clock, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PortalDocumentUpload from '@/components/portal/PortalDocumentUpload';
import DeliverablesTab from '@/components/cases/DeliverablesTab';
import CasePaymentsTab from '@/components/cases/CasePaymentsTab';
import CaseMessages from '@/components/cases/CaseMessages';
import { usePusher } from '@/hooks/usePusher';
import {
  CASE_DOCUMENT_REVIEW_COLORS,
  CASE_DOCUMENT_REVIEW_LABELS,
  CASE_EVENT_LABELS,
  CASE_STATUS_COLORS,
  CASE_STATUS_LABELS,
  COMPLEXITY_LABELS,
  DISCIPLINE_LABELS,
  DOCUMENT_CATEGORY_LABELS,
  PRIORITY_LABELS,
  QUOTE_STATUS_COLORS,
  QUOTE_STATUS_LABELS,
  type CaseComplexity,
  type CaseDiscipline,
  type CaseDocument,
  type CaseEvent,
  type CaseEventType,
  type CaseExpanded,
  type CasePriority,
  type CaseStatus,
  type ClientPendingDocument,
  type DocumentCategory,
  type Quote,
  type QuoteStatus,
} from '@/lib/types';

const PORTAL_TABS = ['info', 'quotes', 'documents', 'deliverables', 'payments', 'messages', 'timeline'];

const EXECUTION_STATE_LABELS: Record<string, string> = {
  no_iniciada: 'Pendiente de inicio',
  activa: 'En desarrollo',
  suspendida: 'Suspendido temporalmente',
  finalizada: 'Finalizado',
};

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
}

function formatDateTime(value?: string) {
  return value ? new Date(value).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
}

function formatCurrency(value?: number | null) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function canPreviewInBrowser(mimeType?: string) {
  return Boolean(mimeType && (mimeType === 'application/pdf' || mimeType === 'text/plain' || mimeType.startsWith('image/')));
}

/** Etapa del caso en lenguaje del cliente (combina estado técnico, ejecución y dictamen). */
function stageLabel(caseData: CaseExpanded) {
  if (caseData.status === 'archivado') return 'Caso cerrado';
  if (caseData.status === 'cancelado') return 'Caso cancelado';
  if (caseData.executionState && caseData.executionState !== 'no_iniciada') {
    return EXECUTION_STATE_LABELS[caseData.executionState] || caseData.executionState;
  }
  if (caseData.status === 'gestionado') return 'En gestión';
  return 'Solicitud recibida';
}

/** Pendientes del cliente a partir de los documentos visibles (misma regla que el enlace público). */
function pendingFromDocuments(documents: CaseDocument[]): ClientPendingDocument[] {
  return documents
    .filter((doc) => !doc.supersededAt && doc.category !== 'dictamen' && (
      (doc.isRequired && doc.status !== 'recibido') || doc.reviewStatus === 'requiere_correccion'
    ))
    .map((doc) => ({
      _id: doc._id,
      description: doc.description || doc.fileName || 'Documento requerido',
      category: doc.category,
      reason: doc.reviewStatus === 'requiere_correccion' ? 'correccion' : 'requerido',
      reviewNote: doc.reviewNote ?? null,
      fileName: doc.fileName ?? null,
      version: doc.version,
    }));
}

export default function PortalCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(requestedTab && PORTAL_TABS.includes(requestedTab) ? requestedTab : 'info');
  const [caseData, setCaseData] = useState<CaseExpanded | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [events, setEvents] = useState<CaseEvent[]>([]);
  const [documents, setDocuments] = useState<CaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quoteAction, setQuoteAction] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<CaseDocument | null>(null);
  const [uploadTargetId, setUploadTargetId] = useState('');

  useEffect(() => {
    if (requestedTab && PORTAL_TABS.includes(requestedTab)) setActiveTab(requestedTab);
  }, [requestedTab]);

  const loadDocuments = useCallback(async () => {
    const response = await fetch(`/api/cases/${id}/documents`);
    const payload = await response.json();
    if (payload.success) setDocuments(payload.data || []);
  }, [id]);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const [caseResponse, quotesResponse, eventsResponse, documentsResponse] = await Promise.all([
        fetch(`/api/cases/${id}`),
        fetch(`/api/cases/${id}/quotes`),
        fetch(`/api/cases/${id}/events`),
        fetch(`/api/cases/${id}/documents`),
      ]);
      const [casePayload, quotesPayload, eventsPayload, documentsPayload] = await Promise.all([
        caseResponse.json(), quotesResponse.json(), eventsResponse.json(), documentsResponse.json(),
      ]);
      if (!casePayload.success) throw new Error(casePayload.error || 'Caso no encontrado');
      setCaseData(casePayload.data);
      if (quotesPayload.success) setQuotes(quotesPayload.data || []);
      if (eventsPayload.success) setEvents(eventsPayload.data || []);
      if (documentsPayload.success) setDocuments(documentsPayload.data || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar el caso');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  usePusher(['case:updated', 'case:status-changed', 'document:created', 'document:deleted', 'quote:created', 'deliverable:reviewed'], () => {
    load(false);
  });

  async function updateQuote(quoteId: string, action: 'approve' | 'reject') {
    let rejectionReason = '';
    if (action === 'reject') {
      rejectionReason = window.prompt('Indica la razón del rechazo:')?.trim() || '';
      if (!rejectionReason) return;
    }
    setQuoteAction(quoteId);
    setError('');
    try {
      const response = await fetch(`/api/quotes/${quoteId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action === 'reject' ? { rejectionReason } : {}),
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || 'No fue posible actualizar la cotización');
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'No fue posible actualizar la cotización');
    } finally {
      setQuoteAction(null);
    }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-72" /></div>;
  if (!caseData) return <div className="py-12 text-center"><p className="text-muted-foreground">{error || 'Caso no encontrado'}</p><Button asChild className="mt-4" variant="outline"><Link href="/portal/cases">Volver</Link></Button></div>;

  const statusColors = CASE_STATUS_COLORS[caseData.status as CaseStatus];
  const pendingDocuments = pendingFromDocuments(documents);
  const receivedDocuments = documents.filter((doc) => doc.fileName);
  const serviceType = [DISCIPLINE_LABELS[caseData.discipline as CaseDiscipline], caseData.dictamenObject ? 'Dictamen pericial' : null].filter(Boolean).join(' · ');

  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4"><Link href="/portal/cases"><ArrowLeft className="mr-1 h-4 w-4" />Mis casos</Link></Button>
      <div className="mb-6">
        <div className="mb-1 flex flex-wrap items-center gap-3"><span className="font-mono text-sm text-muted-foreground">{caseData.caseCode}</span><Badge className={`${statusColors?.bg} ${statusColors?.text} border-0`}>{CASE_STATUS_LABELS[caseData.status as CaseStatus]}</Badge><Badge variant="outline">{caseData.brand}</Badge></div>
        <h1 className="text-2xl font-bold tracking-tight">{caseData.title}</h1>
      </div>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {/* Resumen del estado: lo primero que el cliente necesita saber */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Summary label="Servicio contratado" value={serviceType || '-'} />
        <Summary label="Etapa del caso" value={stageLabel(caseData)} />
        <Summary label="Fecha de inicio" value={formatDate(caseData.executionStartDate || caseData._createdAt)} hint={caseData.executionStartDate ? 'Inicio de la ejecución' : 'Registro de la solicitud'} />
        <Summary label="Última actualización" value={formatDateTime(caseData._updatedAt)} />
      </div>

      {pendingDocuments.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/60">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-amber-900">Para continuar necesitamos…</h2>
                <ul className="mt-2 space-y-2">
                  {pendingDocuments.map((item) => (
                    <li key={item._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {DOCUMENT_CATEGORY_LABELS[item.category] || item.category}
                          {item.reason === 'correccion' ? ` · versión corregida de ${item.fileName || 'tu archivo'}` : ''}
                        </p>
                        {item.reviewNote && <p className="mt-1 text-xs text-red-700">Observación: {item.reviewNote}</p>}
                      </div>
                      <Button size="sm" variant={item.reason === 'correccion' ? 'destructive' : 'default'} onClick={() => { setUploadTargetId(item._id); setActiveTab('documents'); }}>
                        {item.reason === 'correccion' ? <><RefreshCw className="mr-1 h-3.5 w-3.5" />Enviar corregido</> : 'Enviar'}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="quotes">Cotizaciones ({quotes.length})</TabsTrigger>
          <TabsTrigger value="documents">Documentos ({receivedDocuments.length}{pendingDocuments.length ? ` · ${pendingDocuments.length} pendientes` : ''})</TabsTrigger>
          <TabsTrigger value="deliverables">Dictamen</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="messages">Mensajes</TabsTrigger>
          <TabsTrigger value="timeline">Seguimiento ({events.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2"><CardContent className="space-y-5 p-6">
              {caseData.description && <div><p className="text-sm font-medium text-muted-foreground">Descripción</p><p className="mt-1 whitespace-pre-wrap text-sm">{caseData.description}</p></div>}
              {caseData.dictamenObject && <div><p className="text-sm font-medium text-muted-foreground">Objeto del dictamen</p><p className="mt-1 whitespace-pre-wrap text-sm">{caseData.dictamenObject}</p></div>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Info icon={<Scale className="h-4 w-4" />} label="Disciplina" value={DISCIPLINE_LABELS[caseData.discipline as CaseDiscipline]} />
                <Info icon={<Clock className="h-4 w-4" />} label="Prioridad" value={PRIORITY_LABELS[caseData.priority as CasePriority]} />
                <Info icon={<MapPin className="h-4 w-4" />} label="Ciudad" value={caseData.city || '-'} />
                <Info icon={<Calendar className="h-4 w-4" />} label="Fecha límite" value={formatDate(caseData.executionDeadline || caseData.deadlineDate)} />
                <Info icon={<FileText className="h-4 w-4" />} label="Complejidad" value={COMPLEXITY_LABELS[caseData.complexity as CaseComplexity]} />
                <Info icon={<FileText className="h-4 w-4" />} label="Expediente" value={caseData.caseNumber || '-'} />
                {caseData.courtName && <Info icon={<Scale className="h-4 w-4" />} label="Despacho" value={caseData.courtName} />}
                {caseData.hearingDate && <Info icon={<Calendar className="h-4 w-4" />} label="Audiencia" value={formatDateTime(caseData.hearingDate)} />}
              </div>
            </CardContent></Card>
            <Card><CardContent className="space-y-3 p-6"><h3 className="font-semibold">Contacto jurídico</h3>{caseData.assignedJuridico ? <><p className="text-sm font-medium">{caseData.assignedJuridico.displayName}</p>{caseData.assignedJuridico.email && <p className="break-all text-sm text-muted-foreground">{caseData.assignedJuridico.email}</p>}{caseData.assignedJuridico.phone && <p className="text-sm text-muted-foreground">{caseData.assignedJuridico.phone}</p>}<p className="rounded-md bg-blue-50 p-2 text-xs text-blue-800">Este es tu único contacto dentro del proceso.</p></> : <p className="text-sm text-muted-foreground">Pendiente de asignar.</p>}</CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="quotes">
          {quotes.length === 0 ? <Empty text="No hay cotizaciones disponibles." /> : <div className="space-y-3">{quotes.map((quote) => { const colors = QUOTE_STATUS_COLORS[quote.status as QuoteStatus]; return <Card key={quote._id}><CardContent className="flex flex-wrap items-center justify-between gap-4 p-4"><div className="space-y-1"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{formatCurrency(quote.finalValue)}</span><Badge className={`${colors?.bg} ${colors?.text} border-0`}>{QUOTE_STATUS_LABELS[quote.status as QuoteStatus]}</Badge><span className="text-xs text-muted-foreground">v{quote.version}</span></div><p className="text-xs text-muted-foreground">Plazo: {quote.quotedBusinessDays || 15} días hábiles · creada {formatDate(quote._createdAt)}</p>{quote.notes && <p className="text-sm text-muted-foreground">{quote.notes}</p>}{quote.downloadUrl && <Button variant="link" className="h-auto p-0" asChild><a href={quote.downloadUrl} target="_blank" rel="noopener noreferrer"><Download className="mr-1 h-3.5 w-3.5" />Ver cotización</a></Button>}</div>{quote.status === 'enviada' && <div className="flex gap-2"><Button size="sm" variant="outline" className="text-red-700" disabled={quoteAction === quote._id} onClick={() => updateQuote(quote._id, 'reject')}>Rechazar</Button><Button size="sm" disabled={quoteAction === quote._id} onClick={() => updateQuote(quote._id, 'approve')}>Aprobar</Button></div>}</CardContent></Card>; })}</div>}
        </TabsContent>

        <TabsContent value="documents">
          <div className="space-y-4">
            <Card><CardContent className="p-6">
              <h3 className="mb-1 text-sm font-medium">Enviar documentos</h3>
              <p className="mb-3 text-xs text-muted-foreground">Los archivos quedan asociados a tu caso y el equipo los revisa. Te avisaremos si alguno necesita corrección.</p>
              <PortalDocumentUpload
                key={uploadTargetId || 'free'}
                caseId={id}
                onUploadComplete={() => { setUploadTargetId(''); loadDocuments(); }}
                pendingDocuments={pendingDocuments}
                initialTargetId={uploadTargetId}
              />
            </CardContent></Card>
            {receivedDocuments.length === 0 ? <Empty text="Aún no hay documentos disponibles." /> : (
              <div className="space-y-2">
                {receivedDocuments.map((document) => {
                  const review = document.reviewStatus ? CASE_DOCUMENT_REVIEW_COLORS[document.reviewStatus] : null;
                  return (
                    <Card key={document._id} className={document.reviewStatus === 'requiere_correccion' ? 'border-red-200' : ''}>
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {document.fileName}
                              {document.version > 1 && <span className="ml-1 text-xs text-muted-foreground">v{document.version}</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {document.description ? `${document.description} · ` : ''}
                              {DOCUMENT_CATEGORY_LABELS[document.category as DocumentCategory] || document.category}
                              {document.fileSize ? ` · ${formatFileSize(document.fileSize)}` : ''} · {formatDate(document.uploadedAt || document._createdAt)}
                            </p>
                            {document.reviewStatus && review && (
                              <Badge className={`mt-1 border-0 text-[10px] ${review.bg} ${review.text}`}>
                                {CASE_DOCUMENT_REVIEW_LABELS[document.reviewStatus]}
                              </Badge>
                            )}
                            {document.reviewStatus === 'requiere_correccion' && document.reviewNote && (
                              <p className="mt-1 text-xs text-red-700">Observación: {document.reviewNote}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {document.viewUrl && canPreviewInBrowser(document.mimeType) && (
                            <Button variant="ghost" size="icon" title="Ver" onClick={() => setPreviewDocument(document)}><Eye className="h-4 w-4" /></Button>
                          )}
                          {document.downloadUrl && (
                            <Button variant="ghost" size="icon" title="Descargar" asChild><a href={document.downloadUrl}><Download className="h-4 w-4" /></a></Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deliverables"><DeliverablesTab caseId={id} userRole="cliente" /></TabsContent>
        <TabsContent value="payments"><CasePaymentsTab caseId={id} userRole="cliente" /></TabsContent>
        <TabsContent value="messages"><CaseMessages caseId={id} userRole="cliente" /></TabsContent>
        <TabsContent value="timeline">
          {events.length === 0 ? <Empty text="Sin actuaciones registradas todavía." /> : (
            <div className="relative space-y-0">
              {events.map((event, index) => (
                <div key={event._id} className="flex gap-4 pb-6 last:pb-0">
                  <div className="relative flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#2969b0] ring-4 ring-background" />
                    {index < events.length - 1 && <div className="mt-1 w-px flex-1 bg-border" />}
                  </div>
                  <Card className="-mt-1 flex-1"><CardContent className="p-4">
                    <p className="text-sm font-medium">{event.title || CASE_EVENT_LABELS[event.eventType as CaseEventType] || event.eventType}</p>
                    {event.description && <p className="mt-0.5 whitespace-pre-wrap text-sm text-muted-foreground">{event.description}</p>}
                    {event.document && (
                      <a href={`/api/documents/${event.document._id}/download?inline=1`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-[#1b5697] hover:underline">
                        <FileText className="h-3.5 w-3.5" />{event.document.fileName || event.document.description || 'Documento de soporte'}
                      </a>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.eventDate || event._createdAt)}</p>
                  </CardContent></Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(previewDocument)} onOpenChange={(open) => { if (!open) setPreviewDocument(null); }}>
        <DialogContent className="flex h-[90vh] max-w-5xl flex-col">
          <DialogHeader>
            <DialogTitle>{previewDocument?.fileName || 'Documento'}</DialogTitle>
            <DialogDescription>Vista previa protegida. También puedes descargar el archivo.</DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-muted/20">
            {previewDocument?.viewUrl && previewDocument.mimeType?.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewDocument.viewUrl} alt={previewDocument.fileName || 'Documento'} className="h-full w-full object-contain" />
            ) : previewDocument?.viewUrl ? (
              <iframe src={previewDocument.viewUrl} title={previewDocument.fileName || 'Documento'} className="h-full w-full" />
            ) : null}
          </div>
          {previewDocument?.downloadUrl && (
            <div className="flex justify-end"><Button variant="outline" asChild><a href={previewDocument.downloadUrl}><Download className="mr-2 h-4 w-4" />Descargar</a></Button></div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Summary({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card><CardContent className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </CardContent></Card>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-2 text-muted-foreground">{icon}<div><p className="text-xs">{label}</p><p className="text-sm font-medium text-foreground">{value}</p></div></div>;
}

function Empty({ text }: { text: string }) {
  return <Card><CardContent className="flex flex-col items-center py-12 text-muted-foreground"><FileText className="mb-3 h-8 w-8" /><p className="text-sm">{text}</p></CardContent></Card>;
}
