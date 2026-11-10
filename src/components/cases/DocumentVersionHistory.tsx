"use client";

import { useEffect, useState } from "react";
import { Download, Eye, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CaseDocument } from "@/lib/types";
import { ReviewBadge } from "./DocumentReviewControls";

interface DocumentVersionHistoryProps {
  document: CaseDocument;
  onPreview?: (document: CaseDocument) => void;
}

/** Versiones anteriores de un documento (se conservan al devolver y reemplazar). */
export default function DocumentVersionHistory({ document, onPreview }: DocumentVersionHistoryProps) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<CaseDocument[] | null>(null);

  useEffect(() => {
    if (!open || versions) return;
    fetch(`/api/documents/${document._id}/versions`)
      .then((res) => res.json())
      .then((data) => setVersions(data.success ? data.data : []))
      .catch(() => setVersions([]));
  }, [open, versions, document._id]);

  if (!document.supersedesDocumentId) return null;

  return (
    <div className="mt-2">
      <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setOpen((value) => !value)}>
        <History className="mr-1 h-3.5 w-3.5" />
        {open ? "Ocultar versiones anteriores" : `Ver versiones anteriores (v${document.version} vigente)`}
      </Button>
      {open && (
        <ul className="mt-2 space-y-1 rounded-md border bg-muted/20 p-2">
          {versions === null ? (
            <li className="text-xs text-muted-foreground">Cargando...</li>
          ) : versions.length === 0 ? (
            <li className="text-xs text-muted-foreground">Sin versiones anteriores disponibles.</li>
          ) : versions.map((version) => (
            <li key={version._id} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium">v{version.version}</span>
              <span className="truncate">{version.fileName}</span>
              <ReviewBadge status={version.reviewStatus} compact />
              {version.reviewNote && <span className="text-muted-foreground">— {version.reviewNote}</span>}
              <span className="text-muted-foreground">{new Date(version.uploadedAt || version._createdAt).toLocaleString("es-CO")}</span>
              {version.viewUrl && onPreview && (
                <Button variant="ghost" size="sm" className="h-6 px-1" onClick={() => onPreview(version)} title="Ver">
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              )}
              {version.downloadUrl && (
                <Button variant="ghost" size="sm" className="h-6 px-1" asChild>
                  <a href={version.downloadUrl} title="Descargar"><Download className="h-3.5 w-3.5" /></a>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
