"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import PasswordChangeForm from "@/components/crm/PasswordChangeForm";

export default function AdminSettingsPage() {
  const [successMessage, setSuccessMessage] = useState("");

  function handlePasswordChangeSuccess() {
    setSuccessMessage("Contraseña cambiada correctamente.");
    setTimeout(() => setSuccessMessage(""), 5000);
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
              <Settings className="h-5 w-5" style={{ color: '#2969b0' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>Configuración</h1>
              <p className="text-sm text-muted-foreground">
                Ajustes de seguridad y preferencias del sistema
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-lg rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          {/* Section Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
              <svg
                className="h-5 w-5 text-[#2969b0]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Cambiar Contraseña Secundaria
              </h2>
              <p className="text-xs text-gray-500">
                Actualiza la contraseña de acceso al panel
              </p>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div
              className="mb-6 flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 p-4 animate-in fade-in duration-300"
              role="status"
            >
              <svg
                className="h-5 w-5 shrink-0 text-green-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p className="text-sm font-medium text-green-700">
                {successMessage}
              </p>
            </div>
          )}

          <PasswordChangeForm
            endpoint="/api/admin/change-password"
            onSuccess={handlePasswordChangeSuccess}
          />

          {/* Info Note */}
          <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-amber-50 p-3">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <p className="text-xs text-amber-700">
              La contraseña maestra no se puede cambiar desde este panel.
              Contacta al administrador del sistema si necesitas restablecerla.
            </p>
          </div>
        </div>
    </>
  );
}
