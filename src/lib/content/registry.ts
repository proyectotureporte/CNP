/**
 * Registro de páginas públicas editables de cnp.com.co (site 'cnp').
 * Cada módulo exporta DEFAULTS, SECCIONES, NOMBRE y URL_PUBLICA.
 */

import type { SeccionLanding } from './tipos'
import * as home from './paginas/home'
import * as abogados from './paginas/abogados'
import * as empresas from './paginas/empresas'
import * as jueces from './paginas/jueces'
import * as masterclass from './paginas/masterclass'

export interface PaginaRegistrada {
  key: string
  nombre: string
  url: string
  defaults: Record<string, unknown>
  secciones: SeccionLanding[]
}

const modulos = { home, abogados, empresas, jueces, masterclass } as const

export const PAGINAS_CNP: PaginaRegistrada[] = Object.entries(modulos).map(
  ([key, mod]) => ({
    key,
    nombre: (mod as { NOMBRE?: string }).NOMBRE ?? key,
    url: (mod as { URL_PUBLICA?: string }).URL_PUBLICA ?? `/${key}`,
    defaults: (mod as { DEFAULTS: Record<string, unknown> }).DEFAULTS,
    secciones: (mod as { SECCIONES: SeccionLanding[] }).SECCIONES,
  }),
)

export function getPaginaCnp(key: string): PaginaRegistrada | null {
  return PAGINAS_CNP.find((p) => p.key === key) ?? null
}
