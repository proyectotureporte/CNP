"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Clock3, Loader2, Pause, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ClockData {
  state: "no_iniciada" | "activa" | "suspendida" | "finalizada";
  totalBusinessDays: number;
  remainingBusinessDays: number | null;
  startDate?: string;
  deadline: string | null;
  suspendedAt?: string | null;
  alert: boolean;
}

const STATE_LABELS: Record<ClockData["state"], string> = {
  no_iniciada: "No iniciado",
  activa: "En ejecución",
  suspendida: "Suspendido",
  finalizada: "Finalizado",
};

export default function ExecutionClockCard({ caseId, userRole }: { caseId: string; userRole: string }) {
  const [clock, setClock] = useState<ClockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/cases/${caseId}/execution`);
    const payload = await response.json();
    if (payload.success) setClock(payload.data);
    setLoading(false);
  }, [caseId]);

  useEffect(() => { load(); }, [load]);

  async function change(action: "suspend" | "resume") {
    setChanging(true);
    try {
      const response = await fetch(`/api/cases/${caseId}/execution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();
      if (payload.success) setClock(payload.data);
    } finally {
      setChanging(false);
    }
  }

  if (loading) return <Card><CardContent className="flex justify-center p-5"><Loader2 className="h-5 w-5 animate-spin" /></CardContent></Card>;
  if (!clock) return null;
  const canControl = userRole === "admin" || userRole === "juridico";

  return (
    <Card className={clock.alert ? "border-red-300 bg-red-50/40" : ""}>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${clock.alert ? "bg-red-100 text-red-700" : "bg-blue-50 text-blue-700"}`}>
            {clock.alert ? <AlertTriangle className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Plazo cotizado</h3>
              <Badge variant="outline">{STATE_LABELS[clock.state]}</Badge>
            </div>
            {clock.state === "no_iniciada" ? (
              <p className="text-sm text-muted-foreground">Inicia al validarse el primer pago · {clock.totalBusinessDays} días hábiles.</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                <strong className={clock.alert ? "text-red-700" : "text-foreground"}>{clock.remainingBusinessDays} día(s) hábil(es) restante(s)</strong>
                {clock.deadline ? ` · vence ${new Date(clock.deadline).toLocaleDateString("es-CO")}` : ""}
              </p>
            )}
          </div>
        </div>
        {canControl && clock.state === "activa" && (
          <Button size="sm" variant="outline" onClick={() => change("suspend")} disabled={changing}><Pause className="mr-2 h-4 w-4" />Suspender</Button>
        )}
        {canControl && clock.state === "suspendida" && (
          <Button size="sm" onClick={() => change("resume")} disabled={changing}><Play className="mr-2 h-4 w-4" />Reanudar</Button>
        )}
      </CardContent>
    </Card>
  );
}
