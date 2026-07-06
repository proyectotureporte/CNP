import type { SeccionLanding } from '../tipos'

export const NOMBRE = 'Home cnp.com.co (landing principal)'
export const URL_PUBLICA = '/'

// v1: hero editable (el resto de secciones de la home siguen fijas en código;
// se pueden ir sumando aquí con el mismo patrón sin tocar el editor).
export const DEFAULTS = {
  estilos: {
    fuente: 'var(--font-oswald), Arial, sans-serif',
    colorBoton: '#ea580c',
  },
  hero: {
    imagen: '/images/herologo.png',
    titulo1: 'Prueba técnica para el litigio: Transformamos casos complejos en',
    tituloAcento: 'dictámenes claros, comprensibles y sustentables',
    titulo2: 'ante el juez',
    colorAcento: '#fbbf24',
    parrafo: 'Apoyamos a abogados, firmas y empresas en la elaboración de dictámenes financieros especializados, valoración técnica de pruebas, estrategia probatoria para litigio',
    boton1Texto: 'Solicitar diagnóstico',
    boton2Texto: 'Solicitar Dictamen Pericial',
  },
}

export const SECCIONES: SeccionLanding[] = [
  {
    id: 'estilos',
    titulo: 'Estilos generales',
    campos: [
      { path: 'estilos.fuente', label: 'Fuente de la página', tipo: 'fuente' },
      { path: 'estilos.colorBoton', label: 'Color de los botones CTA', tipo: 'color' },
    ],
  },
  {
    id: 'hero',
    titulo: 'Hero (cabecera principal)',
    campos: [
      { path: 'hero.imagen', label: 'Imagen de fondo', tipo: 'imagen' },
      { path: 'hero.titulo1', label: 'Título — parte 1', tipo: 'texto' },
      { path: 'hero.tituloAcento', label: 'Título — texto destacado (dorado)', tipo: 'texto' },
      { path: 'hero.titulo2', label: 'Título — parte final', tipo: 'texto' },
      { path: 'hero.colorAcento', label: 'Color del texto destacado', tipo: 'color' },
      { path: 'hero.parrafo', label: 'Párrafo', tipo: 'parrafo' },
      { path: 'hero.boton1Texto', label: 'Texto botón 1', tipo: 'texto' },
      { path: 'hero.boton2Texto', label: 'Texto botón 2', tipo: 'texto' },
    ],
  },
]
