import type { SeccionLanding } from '../tipos'

export const NOMBRE = 'Página MasterClass'
export const URL_PUBLICA = '/masterclass'

export const DEFAULTS = {
  estilos: {
    fuente: 'var(--font-montserrat), Arial, sans-serif',
  },
  hero: {
    titulo: 'MasterClass Especializadas',
    parrafo: 'Formación de alto nivel para abogados, litigantes y profesionales del sector jurídico y pericial que buscan fortalecer su criterio técnico, dominar la prueba y alcanzar resultados con rigor y excelencia.',
    imagen: '/images/masterclass/hero.webp',
    botonTexto: 'Reservar cupo',
  },
  destacada: {
    mes: 'Julio',
    dia: '16',
    anio: '2026',
    fechaTexto: '16 de julio de 2026',
    hora: '10:00 a. m.',
    horaNota: '(Hora Colombia)',
    horaMeta: '10:00 a. m. (hora Colombia)',
    modalidad: 'Online en vivo',
    cupoTexto: 'Reserva tu lugar',
    titulo: 'Lucro cesante y daño emergente: cómo se prueban y cómo se controvierten',
    descripcion: 'Una sesión especializada que aborda, desde una perspectiva técnico-probatoria, las claves para acreditar y controvertir el lucro cesante y el daño emergente en el marco de la práctica judicial.',
    ponenteNombre: 'Dr. Freddy Armando Oliveros Carvajal',
    ponenteCargo: 'Director CNP',
    ponenteFoto: '/images/masterclass/ponente-freddy-oliveros.webp',
    botonTexto: 'Reservar cupo',
  },
  porQueAsistir: {
    titulo: '¿POR QUÉ ASISTIR?',
    f1Titulo: 'Rigor probatorio',
    f1Texto: 'Metodologías y estándares que fortalecen la calidad y credibilidad de la prueba.',
    f2Titulo: 'Análisis experto',
    f2Texto: 'Perspectivas interdisciplinarias de profesionales con amplia experiencia.',
    f3Titulo: 'Aplicación práctica',
    f3Texto: 'Herramientas y casos reales para aplicar de inmediato en sus procesos.',
    f4Titulo: 'Actualización jurídica',
    f4Texto: 'Contenidos alineados con la normativa vigente y las tendencias jurisprudenciales.',
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
      { path: 'hero.parrafo', label: 'Párrafo', tipo: 'parrafo' },
      { path: 'hero.imagen', label: 'Imagen', tipo: 'imagen' },
      { path: 'hero.botonTexto', label: 'Texto del botón', tipo: 'texto' },
    ],
  },
  {
    id: 'destacada',
    titulo: 'MasterClass destacada (fecha, tema y ponente)',
    campos: [
      { path: 'destacada.mes', label: 'Mes (tarjeta fecha)', tipo: 'texto' },
      { path: 'destacada.dia', label: 'Día (número grande)', tipo: 'texto' },
      { path: 'destacada.anio', label: 'Año', tipo: 'texto' },
      { path: 'destacada.fechaTexto', label: 'Fecha en texto (columna detalles)', tipo: 'texto' },
      { path: 'destacada.hora', label: 'Hora', tipo: 'texto' },
      { path: 'destacada.horaNota', label: 'Nota de hora (zona horaria)', tipo: 'texto' },
      { path: 'destacada.horaMeta', label: 'Hora en texto (columna detalles)', tipo: 'texto' },
      { path: 'destacada.modalidad', label: 'Modalidad', tipo: 'texto' },
      { path: 'destacada.cupoTexto', label: 'Texto de cupo', tipo: 'texto' },
      { path: 'destacada.titulo', label: 'Título de la masterclass', tipo: 'parrafo' },
      { path: 'destacada.descripcion', label: 'Descripción', tipo: 'parrafo' },
      { path: 'destacada.ponenteNombre', label: 'Nombre del ponente', tipo: 'texto' },
      { path: 'destacada.ponenteCargo', label: 'Cargo del ponente', tipo: 'texto' },
      { path: 'destacada.ponenteFoto', label: 'Foto del ponente', tipo: 'imagen' },
      { path: 'destacada.botonTexto', label: 'Texto del botón', tipo: 'texto' },
    ],
  },
  {
    id: 'porQueAsistir',
    titulo: 'Sección "¿Por qué asistir?"',
    campos: [
      { path: 'porQueAsistir.titulo', label: 'Título de sección', tipo: 'texto' },
      { path: 'porQueAsistir.f1Titulo', label: 'Feature 1 — título', tipo: 'texto' },
      { path: 'porQueAsistir.f1Texto', label: 'Feature 1 — texto', tipo: 'parrafo' },
      { path: 'porQueAsistir.f2Titulo', label: 'Feature 2 — título', tipo: 'texto' },
      { path: 'porQueAsistir.f2Texto', label: 'Feature 2 — texto', tipo: 'parrafo' },
      { path: 'porQueAsistir.f3Titulo', label: 'Feature 3 — título', tipo: 'texto' },
      { path: 'porQueAsistir.f3Texto', label: 'Feature 3 — texto', tipo: 'parrafo' },
      { path: 'porQueAsistir.f4Titulo', label: 'Feature 4 — título', tipo: 'texto' },
      { path: 'porQueAsistir.f4Texto', label: 'Feature 4 — texto', tipo: 'parrafo' },
    ],
  },
]
