"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, MessageSquare, Paperclip, Send, X } from "lucide-react";
import { usePusher } from "@/hooks/usePusher";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CaseMessage, CaseMessageAudience, UserRole } from "@/lib/types";

interface CaseMessagesProps {
  caseId: string;
  userRole: UserRole | string;
}

const THREAD_LABELS: Record<CaseMessageAudience, string> = {
  juridico_perito: "Jurídico ↔ Perito",
  juridico_cliente: "Jurídico ↔ Cliente final",
};

function fixedAudience(role: string): CaseMessageAudience | null {
  if (role === "perito") return "juridico_perito";
  if (role === "cliente") return "juridico_cliente";
  return null;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function CaseMessages({ caseId, userRole }: CaseMessagesProps) {
  const lockedAudience = fixedAudience(userRole);
  const [audience, setAudience] = useState<CaseMessageAudience>(lockedAudience || "juridico_perito");
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/cases/${caseId}/messages?audience=${audience}`);
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "No fue posible cargar los mensajes");
      setMessages(payload.data || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible cargar los mensajes");
    } finally {
      setLoading(false);
    }
  }, [audience, caseId]);

  useEffect(() => { load(); }, [load]);
  usePusher(["message:created"], () => { load(); });

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError("");
    try {
      const form = new FormData();
      form.set("audience", audience);
      form.set("body", body.trim());
      if (attachment) form.set("attachment", attachment);
      const response = await fetch(`/api/cases/${caseId}/messages`, { method: "POST", body: form });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || "No fue posible enviar el mensaje");
      setBody("");
      setAttachment(null);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "No fue posible enviar el mensaje");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {!lockedAudience && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="mb-2 text-xs font-medium text-amber-900">
            Los hilos son independientes. Ningún mensaje se comparte entre cliente final y perito.
          </p>
          <Tabs value={audience} onValueChange={(value) => setAudience(value as CaseMessageAudience)}>
            <TabsList className="grid w-full grid-cols-2 bg-white">
              <TabsTrigger value="juridico_perito">Con el perito</TabsTrigger>
              <TabsTrigger value="juridico_cliente">Con el cliente final</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      <div>
        <h3 className="font-semibold">{THREAD_LABELS[audience]}</h3>
        <p className="text-sm text-muted-foreground">
          {audience === "juridico_perito"
            ? "Canal exclusivo con el abogado jurídico asignado."
            : "Canal exclusivo con el abogado jurídico asignado."}
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
              <MessageSquare className="mb-3 h-8 w-8" />
              <p className="text-sm">Aún no hay mensajes en este hilo.</p>
            </div>
          ) : (
            <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
              {messages.map((message) => (
                <div key={message._id} className="rounded-lg border bg-muted/30 p-3">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{message.senderName}</span>
                    <span className="text-xs text-muted-foreground">{formatDateTime(message._createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                  {message.attachmentDownloadUrl && (
                    <Button variant="outline" size="sm" className="mt-3" asChild>
                      <a href={message.attachmentDownloadUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-3.5 w-3.5" />
                        {message.attachmentName || "Descargar adjunto"}
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={sendMessage} className="space-y-3 rounded-lg border bg-white p-4">
        <div className="space-y-2">
          <Label htmlFor={`message-${caseId}`}>Nuevo mensaje</Label>
          <Textarea
            id={`message-${caseId}`}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Escribe un mensaje para el abogado jurídico asignado..."
            rows={4}
            maxLength={5000}
            disabled={sending}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(event) => setAttachment(event.target.files?.[0] || null)}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={sending}>
              <Paperclip className="mr-2 h-4 w-4" />Adjuntar
            </Button>
            {attachment && (
              <span className="flex max-w-xs items-center gap-1 truncate text-xs text-muted-foreground">
                {attachment.name}
                <button type="button" onClick={() => setAttachment(null)} aria-label="Quitar adjunto"><X className="h-3.5 w-3.5" /></button>
              </span>
            )}
          </div>
          <Button type="submit" disabled={sending || !body.trim()}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
}
