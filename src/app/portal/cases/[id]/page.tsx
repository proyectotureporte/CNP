'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Calendar, Download, FileText, MapPin, Scale, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PortalDocumentUpload from '@/components/portal/PortalDocumentUpload';
import DeliverablesTab from '@/components/cases/DeliverablesTab';
import CasePaymentsTab from '@/components/cases/CasePaymentsTab';
import CaseMessages from '@/components/cases/CaseMessages';
import {
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
  type DocumentCategory,
  type Quote,
  type QuoteStatus,
} from '@/lib/types';

const PORTAL_TABS = ['info', 'quotes', 'documents', 'deliverables', 'payments', 'messages', 'timeline'];

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

  const loadDocuments = useCallback(async () => {
    const response = await fetch(`/api/cases/${id}/documents`);
    const payload = await response.json();
    if (payload.success) setDocuments(payload.data || []);
  }, [id]);

  const load = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

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
  return (
    <>
      <Button asChild variant="ghost" size="sm" className="mb-4"><Link href="/portal/cases"><ArrowLeft className="mr-1 h-4 w-4" />Mis casos</Link></Button>
      <div className="mb-6">
        <div className="mb-1 flex flex-wrap items-center gap-3"><span className="font-mono text-sm text-muted-foreground">{caseData.caseCode}</span><Badge className={`${statusColors?.bg} ${statusColors?.text} border-0`}>{CASE_STATUS_LABELS[caseData.status as CaseStatus]}</Badge><Badge variant="outline">{caseData.brand}</Badge></div>
        <h1 className="text-2xl font-bold tracking-tight">{caseData.title}</h1>
      </div>
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="quotes">Cotizaciones ({quotes.length})</TabsTrigger>
          <TabsTrigger value="documents">Documentos ({documents.length})</TabsTrigger>
          <TabsTrigger value="deliverables">Dictamen</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="messages">Mensajes</TabsTrigger>
          <TabsTrigger value="timeline">Historial ({events.length})</TabsTrigger>
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
                <Info icon={<Calendar className="h-4 w-4" />} label="Fecha límite" value={formatDate(caseData.deadlineDate)} />
                <Info icon={<FileText className="h-4 w-4" />} label="Complejidad" value={COMPLEXITY_LABELS[caseData.complexity as CaseComplexity]} />
                <Info icon={<FileText className="h-4 w-4" />} label="Expediente" value={caseData.caseNumber || '-'} />
              </div>
            </CardContent></Card>
            <Card><CardContent className="space-y-3 p-6"><h3 className="font-semibold">Contacto jurídico</h3>{caseData.assignedJuridico ? <><p className="text-sm font-medium">{caseData.assignedJuridico.displayName}</p>{caseData.assignedJuridico.email && <p className="break-all text-sm text-muted-foreground">{caseData.assignedJuridico.email}</p>}{caseData.assignedJuridico.phone && <p className="text-sm text-muted-foreground">{caseData.assignedJuridico.phone}</p>}<p className="rounded-md bg-blue-50 p-2 text-xs text-blue-800">Este es tu único contacto dentro del proceso.</p></> : <p className="text-sm text-muted-foreground">Pendiente de asignar.</p>}</CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="quotes">
          {quotes.length === 0 ? <Empty text="No hay cotizaciones disponibles." /> : <div className="space-y-3">{quotes.map((quote) => { const colors = QUOTE_STATUS_COLORS[quote.status as QuoteStatus]; return <Card key={quote._id}><CardContent className="flex flex-wrap items-center justify-between gap-4 p-4"><div className="space-y-1"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{formatCurrency(quote.finalValue)}</span><Badge className={`${colors?.bg} ${colors?.text} border-0`}>{QUOTE_STATUS_LABELS[quote.status as QuoteStatus]}</Badge><span className="text-xs text-muted-foreground">v{quote.version}</span></div><p className="text-xs text-muted-foreground">Plazo: {quote.quotedBusinessDays || 15} días hábiles · creada {formatDate(quote._createdAt)}</p>{quote.notes && <p className="text-sm text-muted-foreground">{quote.notes}</p>}{quote.downloadUrl && <Button variant="link" className="h-auto p-0" asChild><a href={quote.downloadUrl} target="_blank" rel="noopener noreferrer"><Download className="mr-1 h-3.5 w-3.5" />Ver cotización</a></Button>}</div>{quote.status === 'enviada' && <div className="flex gap-2"><Button size="sm" variant="outline" className="text-red-700" disabled={quoteAction === quote._id} onClick={() => updateQuote(quote._id, 'reject')}>Rechazar</Button><Button size="sm" disabled={quoteAction === quote._id} onClick={() => updateQuote(quote._id, 'approve')}>Aprobar</Button></div>}</CardContent></Card>; })}</div>}
        </TabsContent>

        <TabsContent value="documents"><div className="space-y-4"><Card><CardContent className="p-6"><h3 className="mb-3 text-sm font-medium">Subir documento</h3><PortalDocumentUpload caseId={id} onUploadComplete={loadDocuments} /></CardContent></Card>{documents.length === 0 ? <Empty text="No hay documentos disponibles." /> : <div className="space-y-2">{documents.map((document) => <Card key={document._id}><CardContent className="flex items-center justify-between gap-3 p-4"><div className="flex min-w-0 items-center gap-3"><FileText className="h-5 w-5 shrink-0 text-muted-foreground" /><div className="min-w-0"><p className="truncate text-sm font-medium">{document.fileName || document.description}</p><p className="text-xs text-muted-foreground">{DOCUMENT_CATEGORY_LABELS[document.category as DocumentCategory] || document.category}{document.fileSize ? ` · ${formatFileSize(document.fileSize)}` : ''} · {formatDate(document._createdAt)}</p></div></div>{document.downloadUrl && <Button variant="ghost" size="icon" asChild><a href={document.downloadUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a></Button>}</CardContent></Card>)}</div>}</div></TabsContent>

        <TabsContent value="deliverables"><DeliverablesTab caseId={id} userRole="cliente" /></TabsContent>
        <TabsContent value="payments"><CasePaymentsTab caseId={id} userRole="cliente" /></TabsContent>
        <TabsContent value="messages"><CaseMessages caseId={id} userRole="cliente" /></TabsContent>
        <TabsContent value="timeline">{events.length === 0 ? <Empty text="Sin actividad registrada." /> : <div className="space-y-2">{events.map((event) => <Card key={event._id}><CardContent className="flex items-start gap-3 p-4"><div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" /><div><p className="text-sm font-medium">{CASE_EVENT_LABELS[event.eventType as CaseEventType] || event.eventType}</p>{event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}<p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event._createdAt)} · {event.createdBy?.displayName || event.createdByName || 'Sistema'}</p></div></CardContent></Card>)}</div>}</TabsContent>
      </Tabs>
    </>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-2 text-muted-foreground">{icon}<div><p className="text-xs">{label}</p><p className="text-sm font-medium text-foreground">{value}</p></div></div>;
}

function Empty({ text }: { text: string }) {
  return <Card><CardContent className="flex flex-col items-center py-12 text-muted-foreground"><FileText className="mb-3 h-8 w-8" /><p className="text-sm">{text}</p></CardContent></Card>;
}
