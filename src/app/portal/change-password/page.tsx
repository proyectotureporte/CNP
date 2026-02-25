'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function PortalChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/portal/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Error al cambiar la contrasena');
        return;
      }

      router.replace('/portal/cases');
    } catch {
      setError('Error de conexion. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/images/favicon.png"
            alt="CNP"
            width={48}
            height={48}
            className="mx-auto rounded-xl"
          />
          <h1 className="mt-4 text-xl font-bold text-gray-900">Cambiar Contrasena</h1>
          <p className="mt-1 text-sm text-gray-500">
            Por seguridad, debe cambiar su contrasena antes de continuar
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                Nueva contrasena
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#2969b0] focus:outline-none focus:ring-2 focus:ring-[#2969b0]/20"
                placeholder="Minimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-gray-700">
                Confirmar contrasena
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#2969b0] focus:outline-none focus:ring-2 focus:ring-[#2969b0]/20"
                placeholder="Repita la contrasena"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-100 bg-red-50 p-3" role="alert">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#2969b0] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #2969b0, #1b5697)' }}
            >
              {isLoading ? 'Cambiando...' : 'Cambiar Contrasena'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
