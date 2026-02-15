'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Plus, ChevronRight } from 'lucide-react';
import {
  CASE_STATUS_LABELS,
  CASE_STATUS_COLORS,
  DISCIPLINE_LABELS,
  type CaseExpanded,
  type CaseStatus,
  type CaseDiscipline,
} from '@/lib/types';

export default function PortalCasesPage() {
  const [cases, setCases] = useState<CaseExpanded[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cases/list?scope=my');
        const data = await res.json();
        if (data.success) setCases(data.data || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis Casos</h1>
          <p className="text-sm text-muted-foreground">
            Seguimiento de tus dictamenes periciales
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/new-case">
            <Plus className="mr-2 h-4 w-4" />
            Solicitar Caso
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Briefcase className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No tienes casos aun</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/portal/new-case">Solicitar tu primer caso</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => {
            const sc = CASE_STATUS_COLORS[c.status as CaseStatus];
            return (
              <Link key={c._id} href={`/portal/cases/${c._id}`}>
                <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
                  <CardContent className="flex items-center justify-between pt-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">
                          {c.caseCode}
                        </span>
                        <Badge className={`${sc?.bg} ${sc?.text} border-0 text-xs`}>
                          <span
                            className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${sc?.dot}`}
                          />
                          {CASE_STATUS_LABELS[c.status as CaseStatus]}
                        </Badge>
                      </div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {DISCIPLINE_LABELS[c.discipline as CaseDiscipline]} |{' '}
                        {new Date(c._createdAt).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
