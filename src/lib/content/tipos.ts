/**
 * Sistema de contenido editable de las páginas públicas de CNP
 * (editado desde el panel /santiago de total, vía /api/site-content/*).
 *
 * Cada página registra en src/lib/content/paginas/<key>.ts:
 *   - DEFAULTS: contenido actual hardcodeado (fuente de verdad sin overrides)
 *   - SECCIONES: manifiesto de campos para el editor
 * y su page.tsx lee los overrides de la tabla site_content (site='cnp').
 */

export type TipoCampo = 'texto' | 'parrafo' | 'imagen' | 'color' | 'enlace' | 'fuente'

export interface CampoLanding {
  /** Dot-path dentro del JSON de contenido, ej: "hero.titulo" */
  path: string
  label: string
  tipo: TipoCampo
}

export interface SeccionLanding {
  id: string
  titulo: string
  campos: CampoLanding[]
}

/** Fuentes disponibles (las del layout de CNP vía next/font + seguras). */
export const FUENTES_DISPONIBLES: Array<{ label: string; value: string }> = [
  { label: 'Oswald (actual del sitio)', value: 'var(--font-oswald), Arial, sans-serif' },
  { label: 'Montserrat', value: 'var(--font-montserrat), Arial, sans-serif' },
  { label: 'Quicksand', value: 'var(--font-quicksand), Arial, sans-serif' },
  { label: 'Arial / Helvetica', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia (serif elegante)', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Sistema (nativa del dispositivo)', value: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
]

function esObjetoPlano(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Merge profundo: overrides pisan defaults; strings vacíos se ignoran. */
export function mergeContenido<T extends Record<string, unknown>>(
  defaults: T,
  overrides: unknown,
): T {
  if (!esObjetoPlano(overrides)) return defaults
  const out: Record<string, unknown> = { ...defaults }
  for (const [k, v] of Object.entries(overrides)) {
    const base = (defaults as Record<string, unknown>)[k]
    if (esObjetoPlano(base) && esObjetoPlano(v)) {
      out[k] = mergeContenido(base as Record<string, unknown>, v)
    } else if (v !== undefined && v !== null && v !== '') {
      out[k] = v
    }
  }
  return out as T
}
