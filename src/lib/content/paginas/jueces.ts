import type { SeccionLanding } from '../tipos'

export const NOMBRE = 'Página Jueces'
export const URL_PUBLICA = '/jueces'

export const DEFAULTS = {
  estilos: {
    fuente: 'var(--font-oswald), Arial, sans-serif',
  },
  hero: {
    titulo: 'Claridad, rigor y sustento técnico para la toma de decisiones judiciales.',
    subtitulo: 'Proveemos a jueces y magistrados análisis financiero imparcial y dictámenes periciales de alta precisión técnica para fundamentar cada resolución.',
    imagen: '/images/gavel.jpg',
    boton1: 'Solicitar evaluación imparcial',
    boton2: 'Hablar con un agente',
  },
  contenido: {
    titulo: 'Auxiliares de la justicia especializados',
    texto: 'CNP actúa como auxiliar de la justicia aportando claridad técnica en aspectos contables, financieros y económicos que resultan determinantes en la valoración probatoria de cada proceso.',
    tarjeta1Titulo: 'Dictámenes Imparciales',
    tarjeta1Imagen: '/images/1.png',
    tarjeta1Texto: 'Elaboramos dictámenes con rigor técnico e imparcialidad absoluta, diseñados para aportar claridad en la valoración de la prueba financiera y contable en procesos complejos.',
    tarjeta2Titulo: 'Valoración Pericial',
    tarjeta2Imagen: '/images/2.png',
    tarjeta2Texto: 'Valoramos pruebas periciales y contra-dictámenes para facilitar la comprensión técnica de aspectos económicos y financieros determinantes en la decisión judicial.',
    tarjeta3Titulo: 'Análisis del Juramento Estimatorio',
    tarjeta3Imagen: '/images/3.png',
    tarjeta3Texto: 'Proveemos análisis técnico del juramento estimatorio con enfoque financiero y probatorio de alto rigor, contribuyendo a una valoración objetiva y fundamentada.',
  },
  banner: {
    titulo: 'Claridad técnica al servicio de la justicia',
    texto: 'Estamos disponibles para atender requerimientos judiciales con la celeridad y precisión que cada proceso exige, garantizando imparcialidad y rigor metodológico.',
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
