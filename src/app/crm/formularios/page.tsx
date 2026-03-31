"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox } from "lucide-react";

interface WebLead {
  _id: string;
  _createdAt: string;
  nombre?: string;
  email: string;
  mensaje?: string;
  origen: string;
  estado: string;
}

const ESTADO_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  nuevo:       { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500" },
  en_gestion:  { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500" },
  convertido:  { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500" },
  descartado:  { bg: "bg-gray-100",  text: "text-gray-500",   dot: "bg-gray-400" },
};

const ESTADO_LABELS: Record<string, string> = {
  nuevo: "Nuevo",
  en_gestion: "En gestión",
  convertido: "Convertido",
  descartado: "Descartado",
};

const ORIGEN_LABELS: Record<string, string> = {
  landing:  "Landing",
  abogados: "Abogados",
  empresas: "Empresas",
  jueces:   "Jueces",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("es-CO", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function FormulariosPage() {
  const [leads, setLeads] = useState<WebLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/web-form/list")
      .then((r) => r.json())
      .then((d) => { if (d.success) setLeads(d.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
          <Inbox className="h-5 w-5" style={{ color: "#2969b0" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1b5697" }}>Formularios Web</h1>
          <p className="text-sm text-muted-foreground">Solicitudes recibidas desde el sitio web</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Inbox className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No hay formularios recibidos aún</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const sc = ESTADO_COLORS[lead.estado] ?? ESTADO_COLORS.nuevo;
            return (
              <Card key={lead._id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{lead.nombre || "Sin nombre"}</span>
                      <span className="text-sm text-muted-foreground">{lead.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{ORIGEN_LABELS[lead.origen] ?? lead.origen}</Badge>
                      <Badge className={`${sc.bg} ${sc.text} border-0 text-xs`}>
                        <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                        {ESTADO_LABELS[lead.estado] ?? lead.estado}
                      </Badge>
                    </div>
                  </div>
                  {lead.mensaje && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{lead.mensaje}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{formatDate(lead._createdAt)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
