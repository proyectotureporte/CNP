'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'crm', email, password }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Credenciales invalidas');
        return;
      }

      if (data.data?.role !== 'cliente') {
        setError('Acceso solo para clientes. Usa /crm/login para otros roles.');
        return;
      }

      router.replace('/portal/cases');
    } catch {
      setError('Error de conexion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f0f4f8 0%, #e8eef5 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/images/logo-cnp.png"
            alt="Centro Nacional de Pruebas"
            width={280}
            height={70}
            style={{ height: '60px', width: 'auto' }}
            priority
          />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100">
          <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #002b89, #2969b0)' }} />

          <div className="px-8 pb-8 pt-8">
            <div className="mb-6 flex justify-center">
              <Image src="/images/favicon.png" alt="CNP" width={48} height={48} className="rounded-xl" />
            </div>

            <h1 className="mb-2 text-center text-xl font-bold" style={{ color: '#1b5697' }}>
              Portal Cliente
            </h1>
            <p className="mb-8 text-center text-sm text-gray-400">
              Acceso exclusivo para clientes
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  <AlertCircle className="h-[18px] w-[18px] shrink-0 text-red-500" />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Mail className="h-[18px] w-[18px] text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="correo@ejemplo.com"
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-[#2969b0] focus:outline-none focus:ring-2 focus:ring-[#2969b0]/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">Contrasena</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Lock className="h-[18px] w-[18px] text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Ingrese su contrasena"
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-[#2969b0] focus:outline-none focus:ring-2 focus:ring-[#2969b0]/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2969b0] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #2969b0, #1b5697)' }}
              >
                <span className="flex items-center justify-center gap-2">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loading ? 'Ingresando...' : 'Iniciar Sesion'}
                </span>
              </button>
            </form>

            <p className="mt-8 text-center text-xs text-gray-400">
              Centro Nacional de Pruebas &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
