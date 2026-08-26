import type { ColumnaPie, DatoContacto, EnlaceNav } from './types';

/** Dominio que sobrevive a la unificación. Ver "Unificacion CNP-PERITUS". */
export const DOMINIO = 'https://cnp.com.co';

export const nav: readonly EnlaceNav[] = [
  { texto: 'Servicios', href: '#servicios' },
  { texto: 'Casos', href: '#casos' },
  { texto: 'Nosotros', href: '#nosotros' },
  { texto: 'Contacto', href: '#contacto' },
];

export const hero = {
  eyebrow: 'Centro Nacional de Pruebas',
  /**
   * PENDIENTE — este titular es el ejemplo del PDF de rediseño, puesto como
   * marcador. El definitivo sale de las tres conversaciones (dos abogados
   * clientes y un perito). No publicar sin eso.
   *
   * PENDIENTE — la palabra "médicos" es una promesa: hoy hay 7 casos médicos
   * sin cerrar y cero entregas clínicas. O se sostiene, o se saca.
   */
  titular: 'Elaboramos dictámenes periciales para',
  titularDestacado: 'abogados, firmas y empresas',
  bajada:
    'Financieros, médicos, de ingeniería, informáticos, grafológicos e industriales. Con metodología declarada, trazabilidad completa y plazo comprometido por escrito antes de empezar.',
  cta: { texto: 'Solicitar dictamen', href: '#contacto' },
  ctaPerito: { texto: '¿Eres perito? Trabaja con nosotros', href: '#perito' },
  datos: [
    { destacado: '+10 años', texto: 'en dictámenes periciales' },
    { destacado: 'Operación nacional', texto: 'en todo el territorio colombiano' },
    { destacado: '6 disciplinas', texto: 'en una sola red' },
  ],
} as const;

export const garantia = {
  titulo: 'Nuestra garantía: 100% hechos',
  texto:
    'Garantizamos total independencia y objetividad. Nuestros expertos se enfocan exclusivamente en los hallazgos técnicos para guiar la decisión judicial sin ambigüedades.',
} as const;

export const contacto = {
  eyebrow: 'Contacto',
  titulo: 'Cuéntenos el caso.',
  bajada:
    'Un diagnóstico inicial define si se necesita un peritaje, una revisión o una valoración — y cuánto cuesta antes de empezar.',
  boton: 'Solicitar dictamen',
} as const;

export const datosContacto: readonly DatoContacto[] = [
  {
    titulo: 'Teléfono',
    valor: '312 846 2934',
    nota: 'El 317 102 1253 de PERITUS se desvía a esta línea.',
  },
  {
    titulo: 'Correo',
    valor: 'contacto@cnp.com.co',
    nota: 'contacto@peritus.com.co se redirige aquí.',
  },
  {
    titulo: 'Oficina',
    valor: 'Cra 101 #17-36, Cali',
    nota: 'Los dos sitios ya publican esta misma dirección.',
  },
  {
    titulo: 'Cobertura',
    valor: 'Operación nacional',
    nota: 'Trabajamos en todo el territorio colombiano, sin restricción por la ubicación del cliente.',
  },
];

export const columnasPie: readonly ColumnaPie[] = [
  {
    titulo: 'Servicios',
    enlaces: [
      { texto: 'Para abogados', href: '#abogado' },
      { texto: 'Para firmas', href: '#firma' },
      { texto: 'Para empresas', href: '#empresa' },
      { texto: 'Para jueces', href: '#juez' },
    ],
  },
  {
    titulo: 'Peritos',
    enlaces: [
      { texto: 'Trabaja con nosotros', href: '#perito' },
      { texto: 'Acceso a peritos', href: '/perito/login' },
      { texto: 'Ingresar al CRM', href: '/crm' },
    ],
  },
  {
    titulo: 'Más',
    enlaces: [
      { texto: 'Quiénes somos', href: '#nosotros' },
      { texto: 'Casos de éxito', href: '#casos' },
      // Las MasterClass se publican aquí, no en la web. Ver PDF de rediseño, sección 3.
      { texto: 'LinkedIn', href: 'https://www.linkedin.com/company/cnp-centro-nacional-de-pruebas' },
      { texto: 'Política de tratamiento de datos', href: '/privacy' },
    ],
  },
];

export const pie = {
  descripcion: 'Dictámenes periciales y valoración técnica de pruebas.',
  descripcionRed: 'PERITUS es nuestra red de peritos.',
  legal: 'Todos los derechos reservados · Centro Nacional de Pruebas · 2026',
  ciudad: 'Cali, Colombia',
} as const;
