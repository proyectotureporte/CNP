"use client";

import { useEffect, useState } from "react";
import { usePusher } from "@/hooks/usePusher";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2, CheckCircle, FileText, Download, Calendar, User, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ACTIVITY_STATUS_LABELS, ACTIVITY_STATUS_COLORS, ROLE_LABELS,
  type WorkPlanActivity, type UserRole,
} from "@/lib/types";

interface DeliverablesTabProps { caseId: string; }

function formatDate(d?: string) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

export default function DeliverablesTab({ caseId }: DeliverablesTabProps) {
  const [activities, setActivities] = useState<WorkPlanActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/cases/${caseId}/activities`);
        const data = await res.json();
        if (data.success) {
          // Solo actividades completadas
          const completed = (data.data.activities || []).filter(
            (a: WorkPlanActivity) => a.status === "completada"
          );
          setActivities(completed);
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, [caseId, refreshKey]);

  usePusher(
    ['activity:updated', 'deliverable:created', 'deliverable:reviewed'],
    () => { setRefreshKey((k) => k + 1); }
  );

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-muted-foreground">
        <CheckCircle className="h-8 w-8 mb-3" />
        <p className="text-sm">No hay actividades completadas</p>
        <p className="text-xs mt-1">Las actividades completadas del plan de trabajo apareceran aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{activities.length} actividad{activities.length !== 1 ? "es" : ""} completada{activities.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="space-y-3">
        {activities.map((act) => {
          const sc = ACTIVITY_STATUS_COLORS[act.status];
          return (
            <Card key={act._id}>
              <CardContent className="py-4 px-5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                      <p className="text-sm font-semibold">{act.title}</p>
                      <Badge className={`${sc?.bg} ${sc?.text} border-0 text-[11px] px-1.5 py-0`}>
                        {ACTIVITY_STATUS_LABELS[act.status]}
                      </Badge>
                    </div>

                    {act.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{act.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      {act.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="font-medium text-foreground">{act.assignedTo.displayName}</span>
                          <span className="opacity-60">({ROLE_LABELS[act.assignedTo.role as UserRole] || act.assignedTo.role})</span>
                        </span>
                      )}
                      {act.startedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Inicio: {formatDate(act.startedAt)}
                        </span>
                      )}
                      {act.completedAt && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Completada: {formatDate(act.completedAt)}
                        </span>
                      )}
                      {act.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Fecha limite: {formatDate(act.dueDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Documento adjunto */}
                  {act.fileUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={act.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5" />
                        {act.fileName || "Descargar"}
                      </a>
                    </Button>
                  )}
                </div>

                {/* Documento info */}
                {act.fileUrl && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 pl-6">
                    <FileText className="h-3 w-3" />
                    <span>Documento adjunto: {act.fileName || "Archivo"}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
