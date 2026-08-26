import type { Cliente } from './types';

/**
 * Riel de clientes.
 *
 * El `nombre` es el que va al atributo `alt`. Hoy, en cnp.com.co, cuatro de
 * estos logos están publicados como "LOGON", "LOGON1", "LOGON2" y "LOGON3":
 * para un buscador y para un lector de pantalla no dicen nada. Se identificaron
 * uno por uno abriendo los archivos.
 *
 *   LOGON.png  → Fundación Valle del Lili
 *   LOGON1.png → EDEMSA — Eléctricas de Medellín
 *   LOGON2.png → Banco Falabella
 *   LOGON3.png → Clínica Rey David
 *
 * EMCALI salió del riel por decisión de Santiago (25-ago-2026).
 */
export const clientes: readonly Cliente[] = [
  { nombre: 'Bancolombia', logo: '/images/cliente-bancolombia.png', ancho: 1280, alto: 301 },
  { nombre: 'Davivienda', logo: '/images/cliente-davivienda.png', ancho: 3400, alto: 2125 },
  { nombre: 'Banco Falabella', logo: '/images/cliente-banco-falabella.png', ancho: 500, alto: 500 },
  { nombre: 'Metrovía', logo: '/images/cliente-metrovia.png', ancho: 697, alto: 191 },
  { nombre: 'Ruta N Medellín', logo: '/images/cliente-ruta-n-medellin.png', ancho: 400, alto: 238 },
  { nombre: 'Fundación Valle del Lili', logo: '/images/cliente-valle-del-lili.png', ancho: 500, alto: 500 },
  { nombre: 'EDEMSA — Eléctricas de Medellín', logo: '/images/cliente-edemsa.png', ancho: 500, alto: 500 },
  { nombre: 'Clínica Rey David', logo: '/images/cliente-clinica-rey-david.png', ancho: 500, alto: 500 },
];
