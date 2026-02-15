"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle } from "lucide-react";
import { ROLE_LABELS } from "@/lib/types";
import type { UserRole } from "@/lib/types";
import PasswordChangeForm from "@/components/crm/PasswordChangeForm";

interface UserInfo {
  sub: string;
  role: string;
  displayName: string;
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* User info card skeleton */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-full bg-gray-200" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-3 w-24 rounded bg-gray-100" />
            <div className="h-3 w-32 rounded bg-gray-100" />
          </div>
        </div>
      </div>
      {/* Password card skeleton */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 h-5 w-40 rounded bg-gray-200" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-28 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-lg bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CrmProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/crm/login");
          return;
        }

        const data = await res.json();
        if (!data.success) {
          router.push("/crm/login");
          return;
        }

        setUser(data.data);
      } catch {
        router.push("/crm/login");
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [router]);

  function handlePasswordSuccess() {
    setSuccessMsg("Contrasena actualizada correctamente.");
    setTimeout(() => setSuccessMsg(""), 5000);
  }

  return (
    <>
      {/* Page header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2969b0]/10">
              <UserCircle className="h-5 w-5" style={{ color: '#2969b0' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#1b5697' }}>Mi Perfil</h1>
              <p className="text-sm text-muted-foreground">
                Administra tu informacion personal y seguridad
              </p>
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && <ProfileSkeleton />}

        {user && (
          <div className="space-y-6">
            {/* User info card */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold text-gray-900">
                Informacion de Usuario
              </h2>
              <div className="flex items-center gap-5">
                {/* Avatar circle */}
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white shadow-md" style={{ background: 'linear-gradient(135deg, #2969b0, #1b5697)' }}>
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {user.displayName}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                      </svg>
                      {ROLE_LABELS[user.role as UserRole] || user.role}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                      </svg>
                      ID: {user.sub}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Password change card */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <h2 className="text-lg font-semibold text-gray-900">
                  Cambiar Contrasena
                </h2>
              </div>

              {/* Success message with checkmark */}
              {successMsg && (
                <div
                  className="mb-5 flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-5 py-4 transition-all"
                  role="status"
                >
                  <svg
                    className="h-5 w-5 shrink-0 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-green-700">
                    {successMsg}
                  </p>
                </div>
              )}

              <PasswordChangeForm
                endpoint="/api/crm/change-password"
                onSuccess={handlePasswordSuccess}
              />
            </div>
          </div>
        )}
    </>
  );
}
