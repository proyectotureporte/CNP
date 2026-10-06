"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, UserRoundPen } from "lucide-react";
import { ROLE_LABELS, USER_ROLES, type CrmUser, type UserRole } from "@/lib/types";

export default function AdminEditUserPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<CrmUser | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("comercial_juridico");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch(`/api/admin/users/${id}`);
        if (response.status === 401) {
          router.push("/admin/login");
          return;
        }
        const payload = await response.json();
        if (!response.ok || !payload.success) throw new Error(payload.error || "Usuario no encontrado");
        const value = payload.data as CrmUser;
        setUser(value);
        setDisplayName(value.displayName || "");
        setUsername(value.username || "");
        setEmail(value.email || "");
        setPhone(value.phone || "");
        setRole(value.role);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el usuario");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [id, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, username, email, phone, role, password }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || "No fue posible guardar los cambios");
      router.push("/admin/users");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar los cambios");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-[#2969b0] focus:outline-none focus:ring-2 focus:ring-[#2969b0]/20";
  const editableRoles = user && (user.role === "admin" || user.role === "cliente")
    ? [user.role]
    : USER_ROLES.filter((item) => item !== "admin" && item !== "cliente");

  return (
    <>
      <Link href="/admin/users" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#2969b0] hover:underline">
        <ArrowLeft className="h-4 w-4" /> Volver a usuarios
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <span className="rounded-lg bg-[#2969b0]/10 p-2.5 text-[#2969b0]"><UserRoundPen className="h-5 w-5" /></span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar usuario</h1>
          <p className="text-sm text-gray-500">Actualiza la información de la cuenta sin crear un usuario nuevo.</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="space-y-4 animate-pulse">{[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-11 rounded-lg bg-gray-100" />)}</div>
        ) : !user ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
              <span className="text-gray-600">Estado actual</span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{user.active ? "Activo" : "Inactivo"}</span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium text-gray-700">Nombre completo</label>
                <input id="displayName" required minLength={2} maxLength={120} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={inputClass} autoComplete="name" />
              </div>
              <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700">Nombre de usuario</label>
                <input id="username" required minLength={2} maxLength={100} value={username} onChange={(event) => setUsername(event.target.value)} className={inputClass} autoComplete="username" />
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                <input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} autoComplete="email" />
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">Teléfono</label>
                <input id="phone" type="tel" maxLength={50} value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} autoComplete="tel" />
              </div>
              <div>
                <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-gray-700">Rol</label>
                <select id="role" value={role} onChange={(event) => setRole(event.target.value as UserRole)} className={inputClass}>
                  {editableRoles.map((item) => <option key={item} value={item}>{ROLE_LABELS[item]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">Nueva contraseña <span className="font-normal text-gray-400">(opcional)</span></label>
                <input id="password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} autoComplete="new-password" placeholder="Dejar vacío para conservarla" />
              </div>
            </div>

            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="flex justify-end gap-3 border-t pt-5">
              <Link href="/admin/users" className="rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</Link>
              <button type="submit" disabled={saving} className="inline-flex items-center rounded-lg bg-[#2969b0] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#1b5697] disabled:opacity-60">
                <Save className="mr-2 h-4 w-4" />{saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
