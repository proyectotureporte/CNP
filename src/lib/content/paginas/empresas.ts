import type { SeccionLanding } from '../tipos'

export const NOMBRE = 'Página Empresas'
export const URL_PUBLICA = '/empresas'

export const DEFAULTS = {
  estilos: {
    fuente: 'var(--font-oswald), Arial, sans-serif',
  },
  hero: {
    titulo: 'Soporte técnico integral para la defensa y protección de su patrimonio.',
    subtitulo: 'Acompañamos a empresas del sector real con análisis contable, tributario y económico en sus procesos judiciales, contractuales y de reclamación.',
    imagen: '/images/office-meeting.jpg',
    boton1: 'Evaluar mi empresa',
    boton2: 'Hablar con un agente',
  },
  contenido: {
    titulo: 'Servicios diseñados para empresas',
    texto: 'CNP ofrece a las empresas el respaldo técnico y pericial necesario para tomar decisiones fundamentadas en controversias judiciales, liquidaciones y procesos de reclamación económica.',
    tarjeta1Titulo: 'Liquidaciones de Contratos',
    tarjeta1Imagen: '/images/liquidaciones.jpg',
    tarjeta1Texto: 'Ejecutamos liquidaciones de contratos, créditos y obligaciones con precisión contable y plena validez probatoria, garantizando claridad en cada cifra presentada.',
    tarjeta2Titulo: 'Valoración de Daños Económicos',
    tarjeta2Imagen: '/images/2.png',
    tarjeta2Texto: 'Valoramos los daños económicos sufridos por su empresa con enfoque financiero y metodología probada, facilitando la reclamación efectiva ante instancias judiciales o arbitrales.',
    tarjeta3Titulo: 'Análisis Tributario Especializado',
    tarjeta3Imagen: '/images/3.png',
    tarjeta3Texto: 'Ofrecemos análisis tributario especializado para procesos de fiscalización y controversias con entidades estatales, con sustento técnico sólido y argumentación estratégica.',
  },
  banner: {
    titulo: 'Proteja el patrimonio de su empresa',
    texto: 'Nuestros expertos están listos para acompañarle en cada etapa del proceso con el rigor técnico y la experiencia que su empresa merece.',
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
