import type { ColumnaPie, DatoContacto, EnlaceNav } from '@/lib/content/home-unificado/types';

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
    'Dos preguntas y le decimos si aplica. Respondemos con el alcance, la metodología y el plazo — el resto de los datos se los pedimos después.',
  cta: { texto: 'Solicitar dictamen', href: '#contacto' },
  ctaPerito: { texto: '¿Eres perito? Trabaja con nosotros', href: '#perito' },
  datos: [
    { destacado: '+10', texto: 'años' },
    { destacado: '6', texto: 'disciplinas' },
    { destacado: 'Nacional', texto: 'cobertura' },
  ],
} as const;

export const garantia = {
  titulo: 'Nuestra garantía: 100% hechos',
  texto:
    'Garantizamos total independencia y objetividad. Nuestros expertos se enfocan exclusivamente en los hallazgos técnicos para guiar la decisión judicial sin ambigüedades.',
} as const;

/**
 * Contacto directo, en el encabezado.
 *
 * Sale de una auditoría de 20 sitios de la competencia colombiana: **12 de 20
 * tienen teléfono o WhatsApp a la vista y CNP no tenía ninguno de los dos en
 * toda la home**. En Colombia el canal por defecto de un negocio B2B es
 * WhatsApp, y un abogado con audiencia la semana entrante no llena un
 * formulario: escribe.
 *
 * El número es el mismo que ya publica la sección de contacto. El 317 102 1253
 * de PERITUS se desvía a esta línea.
 *
 * El texto del mensaje va prellenado a propósito: quien escribe no tiene que
 * redactar nada y del otro lado se sabe de dónde viene.
 */
export const contactoDirecto = {
  telefono: '316 407 1992',
  /** Sin espacios ni signos: es lo que exigen los enlaces tel: y wa.me. */
  telefonoPlano: '573164071992',
  mensaje: 'Hola, vengo del sitio de CNP y necesito un dictamen pericial.',
  rotuloWhatsapp: 'WhatsApp',
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
    valor: '316 407 1992',
    nota: 'La misma línea sirve para CNP y para PERITUS.',
  },
  {
    titulo: 'Correo',
    valor: 'contacto@cnp.com.co',
    nota: 'El mismo correo sirve para CNP y para PERITUS.',
  },
  {
    titulo: 'Oficina',
    valor: 'Cra 101 #17-36, Cali',
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
      { texto: 'Para abogados', href: '#servicios' },
      { texto: 'Para firmas', href: '#servicios' },
      { texto: 'Para empresas', href: '#servicios' },
      { texto: 'Para jueces', href: '#servicios' },
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
      { texto: 'Casos', href: '#casos' },
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
