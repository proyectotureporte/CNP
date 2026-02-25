"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, Save, Loader2, Upload } from "lucide-react";
import type { Quote } from "@/lib/types";

interface QuoteFormProps {
  caseId: string;
  initialData?: Quote;
  onSuccess?: () => void;
}

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "$0";
  return `${value.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function QuoteForm({ caseId, initialData, onSuccess }: QuoteFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [totalPrice, setTotalPrice] = useState(
    initialData?.totalPrice ? String(initialData.totalPrice) : ""
  );
  const [discountPercentage, setDiscountPercentage] = useState(
    initialData?.discountPercentage ? String(initialData.discountPercentage) : "0"
  );
  const [validUntil, setValidUntil] = useState(
    initialData?.validUntil ? initialData.validUntil.slice(0, 16) : ""
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [firstPaymentDate, setFirstPaymentDate] = useState(
    initialData?.firstPaymentDate ? initialData.firstPaymentDate.slice(0, 10) : ""
  );
  const [lastPaymentDate, setLastPaymentDate] = useState(
    initialData?.lastPaymentDate ? initialData.lastPaymentDate.slice(0, 10) : ""
  );
  const [customSplit, setCustomSplit] = useState(initialData?.customSplit || false);
  const [firstPaymentPercentage, setFirstPaymentPercentage] = useState(
    initialData?.firstPaymentPercentage ? String(initialData.firstPaymentPercentage) : "50"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const calculated = useMemo(() => {
    const price = parseFloat(totalPrice) || 0;
    const discount = parseFloat(discountPercentage) || 0;
    const discountValue = price * discount / 100;
    const finalValue = price - discountValue;
    const pct1 = customSplit ? (parseFloat(firstPaymentPercentage) || 50) : 50;
    const pct2 = 100 - pct1;
    const payment1 = Math.round(finalValue * pct1 / 100);
    const payment2 = finalValue - payment1;

    return { discountValue, finalValue, pct1, pct2, payment1, payment2 };
  }, [totalPrice, discountPercentage, customSplit, firstPaymentPercentage]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!totalPrice || parseFloat(totalPrice) <= 0) {
      setError("Precio total es requerido y debe ser mayor a 0");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("totalPrice", totalPrice);
      fd.append("discountPercentage", discountPercentage || "0");
      fd.append("notes", notes);
      if (validUntil) fd.append("validUntil", new Date(validUntil).toISOString());
      if (quoteFile) fd.append("quoteDocument", quoteFile);
      if (firstPaymentDate) fd.append("firstPaymentDate", new Date(firstPaymentDate).toISOString());
      if (lastPaymentDate) fd.append("lastPaymentDate", new Date(lastPaymentDate).toISOString());
      fd.append("customSplit", String(customSplit));
      if (customSplit) {
        fd.append("firstPaymentPercentage", firstPaymentPercentage || "50");
      }

      const url = isEditing
        ? `/api/quotes/${initialData._id}`
        : `/api/cases/${caseId}/quotes`;

      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        body: fd,
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
            <CardTitle className="text-base">Datos de Cotizacion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totalPrice">Precio Total (COP) *</Label>
              <Input
                id="totalPrice"
                type="number"
                min="0"
                step="1000"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                placeholder="5000000"
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

            <div className="space-y-2">
              <Label htmlFor="validUntil">Cotizacion Valida Hasta</Label>
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

            <div className="space-y-2">
              <Label htmlFor="quoteDocument">Documento de Cotizacion</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="quoteDocument"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={(e) => setQuoteFile(e.target.files?.[0] || null)}
                  className="file:mr-2 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:text-primary"
                />
                {quoteFile && (
                  <Upload className="h-4 w-4 text-green-600 shrink-0" />
                )}
              </div>
              {initialData?.quoteDocumentUrl && !quoteFile && (
                <p className="text-xs text-muted-foreground">
                  Documento actual:{" "}
                  <a href={initialData.quoteDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Ver documento
                  </a>
                </p>
              )}
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstPaymentDate">Fecha Primer Pago</Label>
                <Input
                  id="firstPaymentDate"
                  type="date"
                  value={firstPaymentDate}
                  onChange={(e) => setFirstPaymentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastPaymentDate">Fecha Ultimo Pago</Label>
                <Input
                  id="lastPaymentDate"
                  type="date"
                  value={lastPaymentDate}
                  onChange={(e) => setLastPaymentDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="customSplit"
                checked={customSplit}
                onCheckedChange={(checked) => setCustomSplit(checked === true)}
              />
              <Label htmlFor="customSplit" className="text-sm font-normal cursor-pointer">
                Diferente al 50/50?
              </Label>
            </div>

            {customSplit && (
              <div className="space-y-2">
                <Label htmlFor="firstPaymentPercentage">Porcentaje Primer Pago (%)</Label>
                <Input
                  id="firstPaymentPercentage"
                  type="number"
                  min="1"
                  max="99"
                  step="1"
                  value={firstPaymentPercentage}
                  onChange={(e) => setFirstPaymentPercentage(e.target.value)}
                  placeholder="50"
                />
              </div>
            )}
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
                <span className="text-muted-foreground">Precio Total</span>
                <span className="font-medium">{formatCurrency(parseFloat(totalPrice) || 0)}</span>
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

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">Plan de Pagos</p>
              <div className="rounded-lg bg-background/60 p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Pago 1 ({calculated.pct1}%)
                  </span>
                  <span className="font-medium">{formatCurrency(calculated.payment1)}</span>
                </div>
                {firstPaymentDate && (
                  <p className="text-xs text-muted-foreground ml-4">
                    Vence: {new Date(firstPaymentDate).toLocaleDateString("es-CO")}
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-background/60 p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Pago 2 ({calculated.pct2}%)
                  </span>
                  <span className="font-medium">{formatCurrency(calculated.payment2)}</span>
                </div>
                {lastPaymentDate && (
                  <p className="text-xs text-muted-foreground ml-4">
                    Vence: {new Date(lastPaymentDate).toLocaleDateString("es-CO")}
                  </p>
                )}
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
