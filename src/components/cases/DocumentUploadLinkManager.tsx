"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, Check, Copy, Link2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DocumentUploadLinkStatus } from "@/lib/types";

export default function DocumentUploadLinkManager({ caseId }: { caseId: string }) {
  const [status, setStatus] = useState<DocumentUploadLinkStatus | null>(null);
  const [url, setUrl] = useState("");
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/cases/${caseId}/document-upload-link`);
      const payload = await response.json();
      if (payload.success) setStatus(payload.data || null);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  async function generateLink() {
    if (status?.active && !window.confirm("Al generar un enlace nuevo, el anterior dejará de funcionar. ¿Continuar?")) return;
    setWorking(true);
    setError("");
    setCopied(false);
    try {
      const response = await fetch(`/api/cases/${caseId}/document-upload-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInDays: Number(days) }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "No fue posible generar el enlace");
      setStatus(payload.data);
      setUrl(payload.data.url);
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "No fue posible generar el enlace");
    } finally {
      setWorking(false);
    }
  }

  async function copyLink() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function revokeLink() {
    if (!window.confirm("¿Revocar este enlace? El cliente ya no podrá usarlo.")) return;
    setWorking(true);
    setError("");
    try {
      const response = await fetch(`/api/cases/${caseId}/document-upload-link`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "No fue posible revocar el enlace");
      setUrl("");
      await loadStatus();
    } catch (revokeError) {
      setError(revokeError instanceof Error ? revokeError.message : "No fue posible revocar el enlace");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/40 p-4">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-blue-100 p-2 text-blue-700"><Link2 className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-blue-950">Link para carga de documentos del cliente</h3>
          <p className="mt-1 text-xs text-blue-800">
            El enlace es exclusivo de este caso, vence automáticamente y puede revocarse en cualquier momento.
            El cliente verá los documentos requeridos que estén marcados como visibles.
          </p>
        </div>
        {status?.active && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
            <ShieldCheck className="h-3.5 w-3.5" /> Vigente
          </span>
        )}
      </div>

      {!loading && status && (
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <span>Vence: <strong className="text-foreground">{new Date(status.expiresAt).toLocaleString("es-CO")}</strong></span>
          <span>Archivos recibidos: <strong className="text-foreground">{status.uploadCount}</strong></span>
          <span>Última carga: <strong className="text-foreground">{status.lastUsedAt ? new Date(status.lastUsedAt).toLocaleString("es-CO") : "Sin cargas"}</strong></span>
        </div>
      )}

      {url && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input value={url} readOnly aria-label="Enlace de carga" className="min-w-0 flex-1 rounded-md border bg-white px-3 py-2 text-sm" />
          <Button type="button" variant="outline" onClick={copyLink}>
            {copied ? <Check className="mr-2 h-4 w-4 text-green-600" /> : <Copy className="mr-2 h-4 w-4" />}
            {copied ? "Copiado" : "Copiar enlace"}
          </Button>
        </div>
      )}

      {status?.active && !url && (
        <p className="rounded-md bg-white px-3 py-2 text-xs text-muted-foreground">
          Por seguridad el enlace completo se muestra una sola vez. Puedes revocarlo o generar uno nuevo para volver a copiarlo.
        </p>
      )}

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[150px] bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Vence en 7 días</SelectItem>
            <SelectItem value="30">Vence en 30 días</SelectItem>
            <SelectItem value="60">Vence en 60 días</SelectItem>
            <SelectItem value="90">Vence en 90 días</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" onClick={generateLink} disabled={working}>
          <RefreshCw className={`mr-2 h-4 w-4 ${working ? "animate-spin" : ""}`} />
          {status?.active ? "Generar enlace nuevo" : "Generar link para carga"}
        </Button>
        {status?.active && (
          <Button type="button" variant="outline" onClick={revokeLink} disabled={working} className="text-red-700 hover:text-red-800">
            <Ban className="mr-2 h-4 w-4" /> Revocar
          </Button>
        )}
      </div>
    </div>
  );
}
