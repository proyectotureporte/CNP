'use client';

import { useEffect, useState } from 'react';

type Estado =
  | { fase: 'cargando' }
  | { fase: 'listo'; nombre: string; etiqueta: string }
  | { fase: 'entrando' }
  | { fase: 'error'; texto: string };

// Pantalla de confirmación del enlace de edición que entrega el MCP. El token está en el fragmento (#t=…): el navegador nunca lo envía al
// servidor, así que las vistas previas (WhatsApp, correo, Slack) no pueden verlo ni gastarlo. Lógica: lib/auth/mcpEnlace.ts.
export default function AccesoMcp() {
  const [estado, setEstado] = useState<Estado>({ fase: 'cargando' });
  const [token, setToken] = useState('');

  useEffect(() => {
    const t = new URLSearchParams(window.location.hash.slice(1)).get('t') ?? '';
    // Se quita de la barra de direcciones para que no quede en el historial ni se copie por accidente.
    window.history.replaceState(null, '', window.location.pathname);
    if (!t) { queueMicrotask(() => setEstado({ fase: 'error', texto: 'Este enlace no es válido. Pide uno nuevo en el chat.' })); return; }
    queueMicrotask(() => setToken(t));
    fetch('/api/auth/mcp-enlace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t, paso: 'ver' }) })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || 'Este enlace ya se usó o venció. Pide uno nuevo en el chat.');
        setEstado({ fase: 'listo', nombre: d.nombre, etiqueta: d.etiqueta });
      })
      .catch((e) => setEstado({ fase: 'error', texto: e instanceof Error ? e.message : 'No se pudo abrir el enlace' }));
  }, []);

  async function continuar() {
    setEstado({ fase: 'entrando' });
    try {
      const r = await fetch('/api/auth/mcp-enlace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ t: token, paso: 'canjear' }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || typeof d.destino !== 'string') throw new Error(d.error || 'Este enlace ya se usó o venció. Pide uno nuevo en el chat.');
      window.location.replace(d.destino);
    } catch (e) {
      setEstado({ fase: 'error', texto: e instanceof Error ? e.message : 'No se pudo abrir el enlace' });
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 text-white">
        <h1 className="text-xl font-semibold">Abrir desde el chat del MCP</h1>
        {estado.fase === 'cargando' && <p>Comprobando el enlace…</p>}
        {estado.fase === 'error' && <p className="bg-red-950 border border-red-800 rounded-lg p-3">{estado.texto}</p>}
        {(estado.fase === 'listo' || estado.fase === 'entrando') && (
          <>
            <p>Esta solicitud fue generada desde el chat del MCP a nombre de <strong>{estado.fase === 'listo' ? estado.nombre : ''}</strong>:</p>
            <p className="bg-gray-800 border border-gray-700 rounded-lg p-3 font-medium">{estado.fase === 'listo' ? estado.etiqueta : 'Abriendo…'}</p>
            <p className="text-sm">Al continuar entrarás al CRM de CNP con tu propio usuario por 30 minutos. El enlace sirve una sola vez. Si no lo pediste tú, cierra esta página.</p>
            <button
              onClick={continuar}
              disabled={estado.fase === 'entrando'}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg px-4 py-3 font-medium"
            >
              {estado.fase === 'entrando' ? 'Abriendo…' : 'Continuar'}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
