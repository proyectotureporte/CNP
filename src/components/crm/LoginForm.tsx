'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

interface LoginFormProps {
  type: 'admin' | 'crm';
  title: string;
}

export default function LoginForm({ type, title }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = type === 'admin';

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Error al iniciar sesion');
        return;
      }

      router.push(type === 'crm' ? '/crm' : '/admin');
    } catch {
      setError('Error de conexion. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #002b89 0%, #1b5697 50%, #2969b0 100%)' }}
      >
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url("/images/pattern-bg.png")',
            backgroundSize: '200px',
            backgroundRepeat: 'repeat',
          }}
        />
        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          <Image
            src="/images/logo-cnp.png"
            alt="Centro Nacional de Pruebas"
            width={420}
            height={105}
            className="mb-8 brightness-0 invert"
            style={{ height: '100px', width: 'auto' }}
            priority
          />
          <p className="text-lg text-white/80 max-w-md leading-relaxed" style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif' }}>
            Somos expertos en Derecho Financiero. Dictamenes periciales, acompañamientos y calculos financieros.
          </p>
          <div className="mt-12 flex items-center gap-6 text-white/50 text-sm">
            <span>Dictamen Pericial</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>Liquidaciones</span>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <span>Perjuicios</span>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex justify-center lg:hidden">
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
            {/* Top accent bar */}
            <div className="h-1.5 w-full" style={{ background: isAdmin ? 'linear-gradient(90deg, #002b89, #1b5697)' : 'linear-gradient(90deg, #2969b0, #1b5697)' }} />

            <div className="px-8 pb-8 pt-8">
              {/* Favicon as icon */}
              <div className="mb-6 flex justify-center">
                <Image
                  src="/images/favicon.png"
                  alt="CNP"
                  width={56}
                  height={56}
                  className="rounded-xl shadow-sm"
                />
              </div>

              {/* Title */}
              <h1 className="mb-2 text-center text-xl font-bold tracking-tight" style={{ color: '#1b5697' }}>
                {title}
              </h1>
              <p className="mb-8 text-center text-sm text-gray-400">
                {isAdmin ? 'Acceso restringido a administradores' : 'Ingrese sus credenciales para acceder'}
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username field (CRM only) */}
                {type === 'crm' && (
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <Mail className="h-[18px] w-[18px] text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-[#2969b0] focus:outline-none focus:ring-2 focus:ring-[#2969b0]/20"
                        placeholder="correo@ejemplo.com"
                        autoComplete="email"
                      />
                    </div>
                  </div>
                )}

                {/* Password field */}
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                    {isAdmin ? 'Contrasena de Administrador' : 'Contrasena'}
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Lock className="h-[18px] w-[18px] text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-[#2969b0] focus:outline-none focus:ring-2 focus:ring-[#2969b0]/20"
                      placeholder="Ingrese su contrasena"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2.5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                    <AlertCircle className="h-[18px] w-[18px] shrink-0 text-red-500" />
                    {error}
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full overflow-hidden rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 focus:ring-[#2969b0]"
                  style={{
                    background: isAdmin
                      ? 'linear-gradient(135deg, #002b89, #1b5697)'
                      : 'linear-gradient(135deg, #2969b0, #1b5697)',
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isLoading ? 'Ingresando...' : 'Iniciar Sesion'}
                  </span>
                </button>
              </form>

              {/* Footer */}
              <p className="mt-8 text-center text-xs text-gray-400">
                Centro Nacional de Pruebas &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
