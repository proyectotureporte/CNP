"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileCheck2, FileUp, LockKeyhole, ShieldCheck } from "lucide-react";
import type { PublicDocumentUploadContext } from "@/lib/types";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/types";
import { CASE_DOCUMENT_MAX_SIZE_MB } from "@/lib/files/uploadLimits";

export default function ClientDocumentUploadPortal() {
  const [context, setContext] = useState<PublicDocumentUploadContext | null>(null);
  const [documentId, setDocumentId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadContext = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/public/document-upload", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "El enlace no está disponible");
      setContext(payload.data);
    } catch (loadError) {
      setContext(null);
      setError(loadError instanceof Error ? loadError.message : "El enlace no está disponible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadContext(); }, [loadContext]);

  const selectedRequest = useMemo(
    () => context?.pendingDocuments.find((item) => item._id === documentId),
    [context, documentId],
  );

  async function submitFiles(event: React.FormEvent) {
    event.preventDefault();
    if (files.length === 0) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const form = new FormData();
      files.forEach((file) => form.append("files", file));
      if (documentId) form.append("documentId", documentId);
      const response = await fetch("/api/public/document-upload", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "No fue posible enviar los archivos");
      setSuccess(`${payload.data.count} archivo(s) enviado(s) correctamente.`);
      setFiles([]);
      setDocumentId("");
      const input = document.getElementById("client-files") as HTMLInputElement | null;
      if (input) input.value = "";
      await loadContext();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No fue posible enviar los archivos");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:py-12" style={{ fontFamily: "var(--font-quicksand), sans-serif" }}>
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex items-center justify-between rounded-2xl bg-[#113a69] px-5 py-4 text-white shadow-lg sm:px-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">Portal documental seguro</p>
            <h1 className="mt-1 text-xl font-bold">CNP <span className="text-blue-300">|</span> PERITUS</h1>
          </div>
          <ShieldCheck className="h-8 w-8 text-blue-200" aria-hidden="true" />
        </header>

        {loading ? (
          <section className="rounded-2xl border bg-white p-8 text-center shadow-sm">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-[#2969b0]" />
            <p className="mt-4 text-sm text-slate-600">Validando el enlace seguro…</p>
          </section>
        ) : !context ? (
          <section className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <LockKeyhole className="mx-auto h-10 w-10 text-red-500" />
            <h2 className="mt-4 text-lg font-bold">Enlace no disponible</h2>
            <p className="mt-2 text-sm text-slate-600">{error || "El enlace fue revocado, venció o no es válido."}</p>
            <p className="mt-4 text-xs text-slate-500">Solicita un enlace nuevo al equipo responsable de tu caso.</p>
          </section>
        ) : (
          <div className="space-y-6">
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="rounded-xl bg-blue-50 p-3 text-[#2969b0]"><FileCheck2 className="h-6 w-6" /></span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{context.brand} · {context.caseCode}</p>
                  <h2 className="mt-1 text-xl font-bold text-[#113a69]">{context.caseTitle}</h2>
                  <p className="mt-2 text-sm text-slate-600">Cliente: <strong>{context.clientName}</strong></p>
                  <p className="mt-1 text-xs text-slate-500">Enlace válido hasta {new Date(context.expiresAt).toLocaleString("es-CO")}.</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold text-[#113a69]">Documentos pendientes</h3>
              <p className="mt-1 text-sm text-slate-600">Selecciona uno al cargarlo para que quede clasificado automáticamente.</p>
              {context.pendingDocuments.length ? (
                <ul className="mt-4 space-y-2">
                  {context.pendingDocuments.map((item) => (
                    <li key={item._id} className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                      <span className="flex-1 font-medium">{item.description}</span>
                      <span className="text-xs text-amber-800">{DOCUMENT_CATEGORY_LABELS[item.category]}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-4 flex items-center gap-3 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                  <CheckCircle2 className="h-5 w-5" /> No hay documentos pendientes. Aun así puedes enviar archivos adicionales.
                </div>
              )}
            </section>

            <form onSubmit={submitFiles} className="rounded-2xl border bg-white p-6 shadow-sm">
              <h3 className="font-bold text-[#113a69]">Enviar documentación</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="document-request" className="mb-1.5 block text-sm font-semibold">¿A qué solicitud corresponde?</label>
                  <select id="document-request" value={documentId} onChange={(event) => setDocumentId(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-[#2969b0] focus:outline-none focus:ring-2 focus:ring-blue-100">
                    <option value="">Documentación adicional / no está en la lista</option>
                    {context.pendingDocuments.map((item) => <option key={item._id} value={item._id}>{item.description}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="client-files" className="mb-1.5 block text-sm font-semibold">Archivos</label>
                  <label htmlFor="client-files" className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 px-5 py-8 text-center transition hover:bg-blue-50">
                    <FileUp className="h-9 w-9 text-[#2969b0]" />
                    <span className="mt-3 text-sm font-semibold text-[#113a69]">Seleccionar uno o varios archivos</span>
                    <span className="mt-1 text-xs text-slate-500">Máximo 10 archivos y {CASE_DOCUMENT_MAX_SIZE_MB} MB en total por envío</span>
                    <input id="client-files" type="file" multiple className="sr-only" onChange={(event) => setFiles(Array.from(event.target.files || []))} />
                  </label>
                  {files.length > 0 && (
                    <div className="mt-3 rounded-lg bg-slate-50 px-4 py-3 text-sm">
                      <p className="font-semibold">{files.length} archivo(s) seleccionado(s)</p>
                      <p className="mt-1 truncate text-xs text-slate-600">{files.map((file) => file.name).join(", ")}</p>
                    </div>
                  )}
                </div>
                {selectedRequest && files.length > 1 && (
                  <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">El primer archivo atenderá “{selectedRequest.description}”; los demás quedarán como anexos de la misma categoría.</p>
                )}
                {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                {success && <p role="status" className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700"><CheckCircle2 className="h-5 w-5" />{success}</p>}
                <button type="submit" disabled={submitting || files.length === 0} className="inline-flex w-full items-center justify-center rounded-lg bg-[#2969b0] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1b5697] disabled:cursor-not-allowed disabled:opacity-50">
                  <FileUp className="mr-2 h-5 w-5" />{submitting ? "Enviando de forma segura…" : "Enviar documentos"}
                </button>
              </div>
            </form>

            <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-500"><LockKeyhole className="h-3.5 w-3.5" />Tus archivos se asocian únicamente al caso indicado.</p>
          </div>
        )}
      </div>
    </main>
  );
}
