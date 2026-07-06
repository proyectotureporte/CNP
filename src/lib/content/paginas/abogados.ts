import type { SeccionLanding } from '../tipos'

export const NOMBRE = 'Página Abogados'
export const URL_PUBLICA = '/abogados'

export const DEFAULTS = {
  estilos: {
    fuente: 'var(--font-oswald), Arial, sans-serif',
  },
  hero: {
    titulo: 'No improvise la prueba técnica. Fortalecemos su teoría del caso.',
    subtitulo: 'Aportamos sustento financiero y pericial para fortalecer cada pretensión de su caso con precisión, rigor y credibilidad técnica.',
    imagen: '/images/lawyers-office.jpg',
    boton1: 'Evaluar mi caso jurídico',
    boton2: 'Hablar con un agente',
  },
  contenido: {
    titulo: 'Cómo fortalecemos su práctica jurídica',
    texto: 'En CNP acompañamos a abogados litigantes con dictámenes, cálculos y análisis que aportan la precisión técnica que sus casos necesitan para prosperar en cualquier instancia judicial o arbitral.',
    tarjeta1Titulo: 'Dictámenes Periciales',
    tarjeta1Imagen: '/images/1.png',
    tarjeta1Texto: 'Elaboramos dictámenes con plena validez probatoria para respaldar sus pretensiones en procesos judiciales y arbitrales, con rigor técnico y trazabilidad metodológica.',
    tarjeta2Titulo: 'Cálculo de Perjuicios',
    tarjeta2Imagen: '/images/2.png',
    tarjeta2Texto: 'Cuantificamos lucro cesante, daño emergente y perjuicios morales con metodología técnica rigurosa, aportando solidez numérica a cada pretensión económica del proceso.',
    tarjeta3Titulo: 'Estrategia Probatoria',
    tarjeta3Imagen: '/images/3.png',
    tarjeta3Texto: 'Definimos junto a usted la estrategia probatoria que genere ventajas competitivas, estructurando argumentos técnicos que contribuyan a persuadir con claridad y precisión.',
  },
  banner: {
    titulo: '¿Listo para fortalecer su caso?',
    texto: 'Contáctenos hoy y uno de nuestros expertos analizará su situación sin costo inicial. Estamos disponibles para responder con la celeridad que su proceso exige.',
  },
}

export const SECCIONES: SeccionLanding[] = [
  {
    id: 'estilos',
    titulo: 'Estilos generales',
    campos: [{ path: 'estilos.fuente', label: 'Fuente de la página', tipo: 'fuente' }],
  },
  {
    id: 'hero',
    titulo: 'Hero (cabecera)',
    campos: [
      { path: 'hero.titulo', label: 'Título', tipo: 'texto' },
      { path: 'hero.subtitulo', label: 'Subtítulo', tipo: 'parrafo' },
      { path: 'hero.imagen', label: 'Imagen de fondo', tipo: 'imagen' },
      { path: 'hero.boton1', label: 'Texto botón 1', tipo: 'texto' },
      { path: 'hero.boton2', label: 'Texto botón 2 (WhatsApp)', tipo: 'texto' },
    ],
  },
  {
    id: 'contenido',
    titulo: 'Sección de servicios (3 tarjetas)',
    campos: [
      { path: 'contenido.titulo', label: 'Título de sección', tipo: 'texto' },
      { path: 'contenido.texto', label: 'Texto de sección', tipo: 'parrafo' },
      { path: 'contenido.tarjeta1Titulo', label: 'Tarjeta 1 — título', tipo: 'texto' },
      { path: 'contenido.tarjeta1Imagen', label: 'Tarjeta 1 — imagen', tipo: 'imagen' },
      { path: 'contenido.tarjeta1Texto', label: 'Tarjeta 1 — texto', tipo: 'parrafo' },
      { path: 'contenido.tarjeta2Titulo', label: 'Tarjeta 2 — título', tipo: 'texto' },
      { path: 'contenido.tarjeta2Imagen', label: 'Tarjeta 2 — imagen', tipo: 'imagen' },
      { path: 'contenido.tarjeta2Texto', label: 'Tarjeta 2 — texto', tipo: 'parrafo' },
      { path: 'contenido.tarjeta3Titulo', label: 'Tarjeta 3 — título', tipo: 'texto' },
      { path: 'contenido.tarjeta3Imagen', label: 'Tarjeta 3 — imagen', tipo: 'imagen' },
      { path: 'contenido.tarjeta3Texto', label: 'Tarjeta 3 — texto', tipo: 'parrafo' },
    ],
  },
  {
    id: 'banner',
    titulo: 'Banner final',
    campos: [
      { path: 'banner.titulo', label: 'Título', tipo: 'texto' },
      { path: 'banner.texto', label: 'Texto', tipo: 'parrafo' },
    ],
  },
]
