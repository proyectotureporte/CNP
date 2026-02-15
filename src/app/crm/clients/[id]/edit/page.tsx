"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ClientForm from "@/components/crm/ClientForm";
import type { CrmClient } from "@/lib/types";

function FormSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-lg bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="mt-6 space-y-2">
        <div className="h-3 w-16 rounded bg-gray-200" />
        <div className="h-24 w-full rounded-lg bg-gray-100" />
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <div className="h-10 w-24 rounded-lg bg-gray-100" />
        <div className="h-10 w-32 rounded-lg bg-gray-200" />
      </div>
    </div>
  );
}

export default function CrmEditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [client, setClient] = useState<CrmClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, clientRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch(`/api/clients/${id}`),
        ]);

        if (!meRes.ok) {
          router.push("/crm/login");
          return;
        }

        const meData = await meRes.json();
        if (!meData.success) {
          router.push("/crm/login");
          return;
        }

        const clientData = await clientRes.json();
        if (!clientData.success) {
          setError(clientData.error || "Cliente no encontrado.");
          return;
        }

        setClient(clientData.data);
      } catch {
        setError("Error al cargar los datos del cliente.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, router]);

  async function handleSubmit(formData: Record<string, string>) {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Error al actualizar el cliente.");
        return;
      }

      router.push(`/crm/clients/${id}`);
    } catch {
      setError("Error de conexion. Intente nuevamente.");
    } finally {
      setIsSubmitting(false);
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
            {client && (
              <>
                <Link
                  href={`/crm/clients/${id}`}
                  className="transition-colors hover:text-[#2969b0]"
                >
                  {client.name}
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
              </>
            )}
            <span className="text-gray-600">Editar</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Editar Cliente</h1>
          <p className="mt-1 text-sm text-gray-500">
            Actualiza la informacion del cliente
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

        {/* Loading skeleton or form */}
        {loading && <FormSkeleton />}

        {client && (
          <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <ClientForm
              initialData={client}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
            />
          </div>
        )}
    </>
  );
}
