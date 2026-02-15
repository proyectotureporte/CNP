"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calculator, Save, Loader2 } from "lucide-react";
import type { Quote } from "@/lib/types";

interface QuoteFormProps {
  caseId: string;
  initialData?: Quote;
  onSuccess?: () => void;
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function QuoteForm({ caseId, initialData, onSuccess }: QuoteFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [estimatedHours, setEstimatedHours] = useState(
    initialData?.estimatedHours ? String(initialData.estimatedHours) : ""
  );
  const [hourlyRate, setHourlyRate] = useState(
    initialData?.hourlyRate ? String(initialData.hourlyRate) : ""
  );
  const [expenses, setExpenses] = useState(
    initialData?.expenses ? String(initialData.expenses) : "0"
  );
  const [marginPercentage, setMarginPercentage] = useState(
    initialData?.marginPercentage ? String(initialData.marginPercentage) : "30"
  );
  const [discountPercentage, setDiscountPercentage] = useState(
    initialData?.discountPercentage ? String(initialData.discountPercentage) : "0"
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [validUntil, setValidUntil] = useState(
    initialData?.validUntil ? initialData.validUntil.slice(0, 16) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const calculated = useMemo(() => {
    const hours = parseFloat(estimatedHours) || 0;
    const rate = parseFloat(hourlyRate) || 0;
    const exp = parseFloat(expenses) || 0;
    const margin = parseFloat(marginPercentage) || 0;
    const discount = parseFloat(discountPercentage) || 0;

    const baseValue = hours * rate;
    const marginValue = baseValue * margin / 100;
    const totalValue = baseValue + exp + marginValue;
    const discountValue = totalValue * discount / 100;
    const finalValue = totalValue - discountValue;

    return { baseValue, marginValue, totalValue, discountValue, finalValue };
  }, [estimatedHours, hourlyRate, expenses, marginPercentage, discountPercentage]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!estimatedHours || !hourlyRate) {
      setError("Horas estimadas y tarifa por hora son requeridas");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        estimatedHours: parseFloat(estimatedHours),
        hourlyRate: parseFloat(hourlyRate),
        expenses: parseFloat(expenses) || 0,
        marginPercentage: parseFloat(marginPercentage) || 0,
        discountPercentage: parseFloat(discountPercentage) || 0,
        notes,
        validUntil: validUntil || undefined,
      };

      const url = isEditing
        ? `/api/quotes/${initialData._id}`
        : `/api/cases/${caseId}/quotes`;

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
      } else {
        setError(data.error || "Error al guardar cotizacion");
      }
    } catch {
      setError("Error de conexion");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parametros de Cotizacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Horas Estimadas *</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Tarifa/Hora (COP) *</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  min="0"
                  step="1000"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="150000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenses">Gastos Adicionales (COP)</Label>
              <Input
                id="expenses"
                type="number"
                min="0"
                step="1000"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marginPercentage">Margen (%)</Label>
                <Input
                  id="marginPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={marginPercentage}
                  onChange={(e) => setMarginPercentage(e.target.value)}
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPercentage">Descuento (%)</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="validUntil">Valida Hasta</Label>
              <Input
                id="validUntil"
                type="datetime-local"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales sobre la cotizacion..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Calculator Preview */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Resumen de Cotizacion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Horas estimadas</span>
                <span className="font-medium">{parseFloat(estimatedHours) || 0} hrs</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tarifa por hora</span>
                <span className="font-medium">{formatCurrency(parseFloat(hourlyRate) || 0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor Base (horas x tarifa)</span>
                <span className="font-medium">{formatCurrency(calculated.baseValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gastos adicionales</span>
                <span className="font-medium">+ {formatCurrency(parseFloat(expenses) || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Margen ({marginPercentage || 0}%)</span>
                <span className="font-medium">+ {formatCurrency(calculated.marginValue)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-medium">
                <span>Subtotal</span>
                <span>{formatCurrency(calculated.totalValue)}</span>
              </div>
              {parseFloat(discountPercentage) > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Descuento ({discountPercentage}%)</span>
                  <span>- {formatCurrency(calculated.discountValue)}</span>
                </div>
              )}
              <Separator className="border-primary/30" />
              <div className="flex justify-between text-lg font-bold">
                <span>Valor Final</span>
                <span className="text-primary">{formatCurrency(calculated.finalValue)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isEditing ? "Actualizar Cotizacion" : "Crear Cotizacion"}
        </Button>
      </div>
    </form>
  );
}
