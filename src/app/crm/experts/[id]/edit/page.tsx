"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import ExpertForm from "@/components/experts/ExpertForm";
import type { Expert } from "@/lib/types";

export default function EditExpertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadExpert() {
      try {
        const res = await fetch(`/api/experts/${id}`);
        const data = await res.json();
        if (data.success) {
          setExpert(data.data);
        } else {
          setError(data.error || "Perito no encontrado");
        }
      } catch {
        setError("Error al cargar perito");
      } finally {
        setLoading(false);
      }
    }
    loadExpert();
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

  if (!expert) return null;

  return (
    <>
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/crm/experts" className="hover:text-primary transition-colors">
          Peritos
        </Link>
        <span>/</span>
        <Link href={`/crm/experts/${id}`} className="hover:text-primary transition-colors">
          {expert.user?.displayName || "Perito"}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Editar</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight mb-6">Editar Perito</h1>

      <ExpertForm initialData={expert} expertId={id} />
    </>
  );
}
