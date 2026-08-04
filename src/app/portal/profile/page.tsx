'use client';

import { useEffect, useState } from 'react';
import { Building2, CreditCard, Loader2, Save, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import PasswordChangeForm from '@/components/crm/PasswordChangeForm';
import { CLIENT_TYPE_LABELS, type ClientType } from '@/lib/types';

interface PortalProfile {
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  clientType?: ClientType;
}

interface PaymentAccount {
  brand: 'CNP' | 'Peritus';
  details: Record<string, string>;
}

const ACCOUNT_LABELS: Record<string, string> = {
  banco: 'Banco', bank: 'Banco', tipoCuenta: 'Tipo de cuenta', accountType: 'Tipo de cuenta',
  numeroCuenta: 'Número de cuenta', accountNumber: 'Número de cuenta', titular: 'Titular', holder: 'Titular',
  nit: 'NIT', documento: 'Documento', convenio: 'Convenio', informacion: 'Información',
};

export default function PortalProfilePage() {
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/portal/profile')
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.success) throw new Error(payload.error || 'No fue posible cargar el perfil');
        setProfile(payload.data.profile);
        setAccounts(payload.data.paymentAccounts || []);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'No fue posible cargar el perfil'))
      .finally(() => setLoading(false));
  }, []);

  function update(field: keyof PortalProfile, value: string) {
    setProfile((current) => current ? { ...current, [field]: value } : current);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/portal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.error || 'No fue posible guardar');
      setProfile((current) => current ? { ...current, ...payload.data } : current);
      setMessage('Datos de contacto actualizados correctamente.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No fue posible guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1><p className="text-sm text-muted-foreground">Datos de contacto, seguridad y cuentas para pagar tus servicios.</p></div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{message}</div>}

      {profile && (
        <form onSubmit={save}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5" />Datos de contacto</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-2"><Badge variant="outline">{profile.clientType ? CLIENT_TYPE_LABELS[profile.clientType] : 'Cliente final'}</Badge><span className="text-xs text-muted-foreground">En el proceso siempre se identifica como cliente final.</span></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="portal-name">Nombre *</Label><Input id="portal-name" value={profile.name} onChange={(event) => update('name', event.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="portal-email">Correo *</Label><Input id="portal-email" type="email" value={profile.email} onChange={(event) => update('email', event.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="portal-phone">Teléfono</Label><Input id="portal-phone" value={profile.phone || ''} onChange={(event) => update('phone', event.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="portal-company">Empresa</Label><Input id="portal-company" value={profile.company || ''} onChange={(event) => update('company', event.target.value)} /></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="portal-position">Cargo</Label><Input id="portal-position" value={profile.position || ''} onChange={(event) => update('position', event.target.value)} /></div>
              </div>
              <div className="flex justify-end"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Guardar</Button></div>
            </CardContent>
          </Card>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {accounts.map((account) => (
          <Card key={account.brand}>
            <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Cuenta para pagar · {account.brand}</CardTitle></CardHeader>
            <CardContent>
              {Object.keys(account.details).length === 0 ? (
                <p className="text-sm text-muted-foreground">El área administrativa aún no ha publicado la cuenta de esta marca.</p>
              ) : (
                <dl className="space-y-3">
                  {Object.entries(account.details).map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-4 border-b pb-2 last:border-0"><dt className="text-sm text-muted-foreground">{ACCOUNT_LABELS[key] || key}</dt><dd className="text-right text-sm font-medium">{value}</dd></div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>
        ))}
        {accounts.length === 0 && <Card><CardContent className="flex items-center gap-3 p-5 text-sm text-muted-foreground"><Building2 className="h-5 w-5" />La cuenta de pago aparecerá cuando tengas un caso activo.</CardContent></Card>}
      </div>

      <Card>
        <CardHeader><CardTitle>Seguridad</CardTitle></CardHeader>
        <CardContent><PasswordChangeForm endpoint="/api/portal/change-password" onSuccess={() => setMessage('Contraseña actualizada correctamente.')} /></CardContent>
      </Card>
    </div>
  );
}
