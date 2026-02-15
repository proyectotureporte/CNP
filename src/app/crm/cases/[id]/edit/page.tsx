"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CaseForm from "@/components/cases/CaseForm";
import type { CaseExpanded } from "@/lib/types";

export default function CrmEditCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [caseData, setCaseData] = useState<CaseExpanded | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCase() {
      try {
        const res = await fetch(`/api/cases/${id}`);
        const data = await res.json();
        if (data.success) {
          setCaseData(data.data);
        } else {
          setError(data.error || "Caso no encontrado");
        }
      } catch {
        setError("Error al cargar el caso");
      } finally {
        setLoading(false);
      }
    }
    loadCase();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/crm/cases" className="hover:text-primary transition-colors">
          Casos
        </Link>
        <span>/</span>
        <Link href={`/crm/cases/${id}`} className="hover:text-primary transition-colors">
          {caseData?.caseCode}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Editar</span>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>Editar Caso: {caseData?.caseCode}</CardTitle>
        </CardHeader>
        <CardContent>
          {caseData && <CaseForm initialData={caseData} caseId={id} />}
        </CardContent>
      </Card>
    </>
  );
}
