"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CaseForm from "@/components/cases/CaseForm";

export default function CrmNewCasePage() {
  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/crm/cases" className="hover:text-primary transition-colors">
          Casos
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">Nuevo</span>
      </nav>

      <Card>
        <CardHeader>
          <CardTitle>Nuevo Caso</CardTitle>
        </CardHeader>
        <CardContent>
          <CaseForm />
        </CardContent>
      </Card>
    </>
  );
}
