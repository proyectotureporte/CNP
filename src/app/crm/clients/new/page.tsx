"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClientForm from "@/components/crm/ClientForm";

export default function CrmNewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [portalCredentials, setPortalCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  async function handleSubmit(formData: Record<string, string>) {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Error al crear el cliente.");
        return;
      }

      // Show portal credentials if auto-created
      if (data.portalPassword) {
        setPortalCredentials({
          email: formData.email,
          password: data.portalPassword,
        });
      } else {
        router.push("/crm/clients");
      }
    } catch {
      setError("Error de conexion. Intente nuevamente.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Header with breadcrumb */}
        <div className="mb-8">
          <nav className="mb-2 flex items-center gap-1 text-sm text-gray-400">
            <Link
              href="/crm/clients"
              className="transition-colors hover:text-[#2969b0]"
            >
              Clientes
            </Link>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
            <span className="text-gray-600">Nuevo</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Cliente</h1>
          <p className="mt-1 text-sm text-gray-500">
            Completa los datos para registrar un nuevo cliente
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4"
            role="alert"
          >
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* Portal credentials modal */}
        {portalCredentials && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Cliente Creado</h2>
                  <p className="text-sm text-gray-500">Se genero acceso al portal automaticamente</p>
                </div>
              </div>

              <div className="mb-5 space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Credenciales del Portal
                </p>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-mono text-sm font-medium text-gray-900">{portalCredentials.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contrasena temporal</p>
                  <p className="font-mono text-lg font-bold text-gray-900">{portalCredentials.password}</p>
                </div>
                <p className="text-xs text-amber-700">
                  El cliente debera cambiar su contrasena en el primer inicio de sesion.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Portal: ${window.location.origin}/portal/login\nEmail: ${portalCredentials.email}\nContrasena: ${portalCredentials.password}`
                    );
                  }}
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  Copiar credenciales
                </button>
                <button
                  onClick={() => router.push("/crm/clients")}
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #2969b0, #1b5697)' }}
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form card */}
        {!portalCredentials && (
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <ClientForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        )}
    </>
  );
}
