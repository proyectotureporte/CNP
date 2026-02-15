'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { CASE_DISCIPLINES, DISCIPLINE_LABELS, type CaseDiscipline } from '@/lib/types';
import Link from 'next/link';

export default function NewCaseRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    discipline: '' as CaseDiscipline | '',
    description: '',
    city: '',
    courtName: '',
    caseNumber: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.discipline) {
      setError('Titulo y disciplina son obligatorios');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/cases/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          discipline: form.discipline,
          description: form.description,
          city: form.city || undefined,
          courtName: form.courtName || undefined,
          caseNumber: form.caseNumber || undefined,
          complexity: 'media',
          priority: 'normal',
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Error al crear caso');
        return;
      }
      router.push('/portal/cases');
    } catch {
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/portal/cases">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Solicitar Nuevo Caso</h1>
        <p className="text-sm text-muted-foreground">
          Completa la informacion para solicitar un dictamen pericial
        </p>
      </div>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Datos del Caso</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Titulo del caso *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Dictamen contable empresa XYZ"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Disciplina *</Label>
              <Select
                value={form.discipline}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, discipline: v as CaseDiscipline }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {CASE_DISCIPLINES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DISCIPLINE_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion del caso</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe brevemente que necesitas..."
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Bogota"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="courtName">Juzgado</Label>
                <Input
                  id="courtName"
                  value={form.courtName}
                  onChange={(e) => setForm((f) => ({ ...f, courtName: e.target.value }))}
                  placeholder="Juzgado 3 Civil"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caseNumber">Numero de expediente</Label>
              <Input
                id="caseNumber"
                value={form.caseNumber}
                onChange={(e) => setForm((f) => ({ ...f, caseNumber: e.target.value }))}
                placeholder="Ej: 2026-00123"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Solicitud
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
