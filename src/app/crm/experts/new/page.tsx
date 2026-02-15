"use client";

import Link from "next/link";
import ExpertForm from "@/components/experts/ExpertForm";

export default function NewExpertPage() {
  return (
    <>
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/crm/experts" className="hover:text-primary transition-colors">
          Peritos
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Nuevo Perito</span>
      </nav>

      <h1 className="text-2xl font-bold tracking-tight mb-6">Registrar Perito</h1>

      <ExpertForm />
    </>
  );
}
