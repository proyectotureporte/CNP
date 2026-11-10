"use client";

import { useState } from "react";
import { CheckCircle2, History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CASE_DOCUMENT_REVIEW_COLORS,
  CASE_DOCUMENT_REVIEW_LABELS,
  type CaseDocument,
  type CaseDocumentReviewStatus,
} from "@/lib/types";

/** Insignia del estado de revisión (null = requerido sin archivo). */
export function ReviewBadge({ status, compact = false }: { status?: CaseDocumentReviewStatus | null; compact?: boolean }) {
  if (!status) return null;
  const colors = CASE_DOCUMENT_REVIEW_COLORS[status];
  return (
    <Badge className={`border-0 ${compact ? "text-[10px]" : "text-xs"} ${colors.bg} ${colors.text}`}>
      <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${colors.dot}`} />
      {CASE_DOCUMENT_REVIEW_LABELS[status]}
    </Badge>
  );
}

interface DocumentReviewControlsProps {
  document: CaseDocument;
  onChanged: () => void;
}

/** Aprobar / devolver un documento recibido (solo comercial jurídico o acceso total). */
export default function DocumentReviewControls({ document, onChanged }: DocumentReviewControlsProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(document.reviewNote || "");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function submit(reviewStatus: CaseDocumentReviewStatus) {
    setWorking(true);
    setError("");
    try {
      const res = await fetch(`/api/documents/${document._id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus, note: note.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "No fue posible registrar la revisión");
      setOpen(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de conexión");
    } finally {
      setWorking(false);
    }
  }

  if (!document.fileName || document.supersededAt) return null;

  return (
    <>
      {document.reviewStatus !== "aprobado" && (
        <Button
          variant="ghost"
          size="sm"
          className="text-green-700"
          title="Aprobar documento"
          disabled={working}
          onClick={() => { setNote(""); submit("aprobado"); }}
        >
          <CheckCircle2 className="h-4 w-4" />
        </Button>
      )}
      {document.reviewStatus !== "requiere_correccion" && (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-700"
          title="Devolver: requiere corrección"
          disabled={working}
          onClick={() => { setNote(""); setError(""); setOpen(true); }}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={(value) => { if (!working) setOpen(value); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><History className="h-5 w-5" />Solicitar una versión corregida</DialogTitle>
            <DialogDescription>
              El cliente recibirá la observación por correo y en su portal, y podrá enviar una versión nueva. La versión actual
              ({document.fileName}, v{document.version}) se conserva en el historial.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor={`review-note-${document._id}`}>Observación para el cliente *</Label>
            <Textarea
              id={`review-note-${document._id}`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Ej. El documento está incompleto: faltan las páginas 3 y 4 firmadas."
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={working}>Cancelar</Button>
            <Button onClick={() => submit("requiere_correccion")} disabled={working || note.trim().length < 5}>
              {working ? "Enviando..." : "Devolver al cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
