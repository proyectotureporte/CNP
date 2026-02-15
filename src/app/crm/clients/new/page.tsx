"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClientForm from "@/components/crm/ClientForm";

export default function CrmNewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

      router.push("/crm/clients");
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

        {/* Form card */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <ClientForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
    </>
  );
}
