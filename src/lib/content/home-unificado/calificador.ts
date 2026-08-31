import type { IconoDisciplina } from '@/lib/content/home-unificado/types';

/**
 * El calificador del hero.
 *
 * Reemplaza al par "titular + botón" por dos preguntas. La idea es la del PDF
 * de rediseño llevada al extremo: en vez de mandar a todo el mundo al mismo
 * formulario, el sitio pregunta lo mínimo para responder con alcance y plazo —
 * y de paso filtra las solicitudes que no son.
 */

export interface Materia {
  readonly id: string;
  /** Etiqueta del botón. */
  readonly etiqueta: string;
  /** Cómo se nombra una vez elegida: "Dictamen financiero". */
  readonly titulo: string;
  /** Cómo entra en la frase de resumen: "Dictamen financiero, ...". */
  readonly frase: string;
  readonly icono: IconoDisciplina | 'otro';
}

export interface Etapa {
  readonly id: string;
  readonly etiqueta: string;
  readonly titulo: string;
  readonly frase: string;
  /** Lo que CNP promete para esa etapa. Cambia el mensaje, no solo el dato. */
  readonly nota: string;
  /** Solo la audiencia fijada pide fecha: es la señal de urgencia que permite priorizar. */
  readonly pideFecha?: boolean;
}

export const materias: readonly Materia[] = [
  { id: 'fin', etiqueta: 'Financiero', titulo: 'Dictamen financiero', frase: 'financiero', icono: 'finanzas' },
  { id: 'med', etiqueta: 'Médico', titulo: 'Dictamen médico', frase: 'médico', icono: 'medicina' },
  { id: 'ing', etiqueta: 'Ingeniería', titulo: 'Dictamen de ingeniería', frase: 'de ingeniería', icono: 'ingenieria' },
  { id: 'inf', etiqueta: 'Informático', titulo: 'Dictamen informático', frase: 'informático', icono: 'informatica' },
  { id: 'gra', etiqueta: 'Grafológico', titulo: 'Dictamen grafológico', frase: 'grafológico', icono: 'grafologia' },
  { id: 'ind', etiqueta: 'Industrial', titulo: 'Dictamen industrial', frase: 'industrial', icono: 'industria' },
  // Sin esta salida, quien no se ve en las seis concluye que no lo hacemos y se va.
  { id: 'otr', etiqueta: 'Otro, o no estoy seguro', titulo: 'Materia por definir', frase: 'por definir', icono: 'otro' },
];

export const etapas: readonly Etapa[] = [
  {
    id: 'e1',
    etiqueta: 'Todavía no he demandado',
    titulo: 'Antes de demandar',
    frase: 'antes de demandar',
    nota: 'El diagnóstico previo dice si el peritaje conviene, antes de contratarlo.',
  },
  {
    id: 'e2',
    etiqueta: 'Demanda presentada',
    titulo: 'Demanda presentada',
    frase: 'con la demanda presentada',
    nota: 'Revisamos la etapa procesal para no pasarnos del término.',
  },
  {
    id: 'e3',
    etiqueta: 'Audiencia ya fijada',
    titulo: 'Audiencia ya fijada',
    frase: 'con audiencia fijada',
    nota: 'Con la fecha a la vista ajustamos el plazo de entrega a ella.',
    pideFecha: true,
  },
  {
    // Es un servicio que CNP ya vende —"Revisión de dictamen de contraparte"—
    // y que el calificador no ofrecía.
    id: 'e4',
    etiqueta: 'Ya hay un dictamen de la contraparte',
    titulo: 'Dictamen de contraparte',
    frase: 'para contradecir un dictamen de la contraparte',
    nota: 'Analizamos el dictamen ajeno y le devolvemos sus debilidades metodológicas.',
  },
];

/**
 * El paso 3 y el cierre.
 *
 * Los dos primeros pasos preguntan por el CASO; este pregunta por la PERSONA, y
 * ese orden importa: pedir el correo antes de haber demostrado que se entiende
 * el problema es lo que hace que la gente cierre la pestaña.
 *
 * Tres campos y nada más. Cada campo adicional en un formulario de primera
 * toma cuesta solicitudes, y el resto de los datos se piden por teléfono, que
 * es como termina pasando de todos modos.
 */
export const paso3 = {
  titulo: '¿A quién le respondemos?',
  campos: {
    nombre: { etiqueta: 'Nombre completo', autoComplete: 'name' },
    correo: { etiqueta: 'Correo', autoComplete: 'email' },
    telefono: { etiqueta: 'Teléfono o WhatsApp', autoComplete: 'tel' },
    detalle: { etiqueta: 'En una línea, ¿qué pasó?', opcional: true },
  },
  /** Por qué se piden los datos. Cada campo que no se justifica cuesta envíos. */
  porQue: 'Le escribimos al correo. Solo llamamos si la audiencia está cerca.',
  /**
   * PENDIENTE — la referencia a la Ley 1581 de 2012 y el texto exacto de la
   * autorización los tiene que confirmar Eider. Va citada de memoria.
   *
   * Nota de la revisión de mercado: en Colombia lo habitual es NO poner casilla
   * —Siigo, por ejemplo, pide el consentimiento en el texto bajo el botón— y la
   * casilla obligatoria cuesta envíos. Aquí se mantiene a propósito: es una
   * firma cuyo argumento entero es que las cosas van por escrito, y una casilla
   * marcada deja registro auditable de la autorización. Si jurídico prefiere lo
   * otro, el cambio es de una línea.
   */
  autorizacion: 'Autorizo el tratamiento de mis datos para responder esta solicitud.',
  autorizacionEnlace: { texto: 'Política de tratamiento de datos', href: '/privacy' },
  /** El botón nombra lo que el visitante recibe, no la acción del sistema. */
  boton: 'Quiero el diagnóstico',
  enviando: 'Enviando…',
} as const;

/**
 * El cierre.
 *
 * No promete un tiempo de respuesta porque nadie lo ha comprometido todavía:
 * inventar "en 24 horas" es crear una deuda que la operación no sabe si puede
 * pagar. Promete lo mismo que el hero —alcance, metodología y plazo— que sí es
 * lo que se entrega.
 */
export const cierre = {
  titulo: 'Solicitud recibida.',
  texto:
    'Le respondemos con el alcance, la metodología y el plazo. Si el caso no necesita un peritaje, también se lo decimos.',
  rotuloResumen: 'Lo que nos pidió',
  /**
   * Los tres pasos de lo que sigue. Sin plazos: el compromiso de tiempo no
   * existe todavía y ponerle un número aquí sería inventarlo.
   */
  pasos: [
    'Un perito de la disciplina revisa el caso.',
    'Le llega el alcance, la metodología y el plazo.',
    'Si el peritaje no conviene, también se lo decimos.',
  ],
  /** Mata los envíos duplicados sin regañar a nadie. */
  unaVez: 'Con una vez basta: ya quedó en cola.',
  urgente: 'Si la audiencia es esta semana, llame directamente al',
  telefono: '316 407 1992',
  /**
   * Solo sale cuando la API respondió que corrió en modo demo: la solicitud
   * quedó en un archivo local y no le llegó a nadie. Si el visitante lee
   * "recibida", o es verdad o hay que decirlo.
   */
  pendienteDemo: 'modo demo: esta solicitud se guardó localmente, no se entregó',
} as const;

/**
 * El estado de error. Existe porque puede fallar de verdad: mientras
 * `CNP_SOLICITUD_WEBHOOK` no esté configurada, la API responde 501 a propósito
 * —una solicitud que nadie recibe no puede mostrar pantalla de confirmación—.
 */
export const errorEnvio = {
  titulo: 'No pudimos enviar la solicitud.',
  texto: 'Escríbanos o llámenos y le respondemos igual.',
  correo: 'contacto@cnp.com.co',
  telefono: '316 407 1992',
  reintentar: 'Reintentar',
} as const;

export const compromisos: readonly string[] = [
  'Peritos con tarjeta profesional vigente, art. 226 del CGP',
  'Alcance y fecha de entrega por escrito antes de empezar',
  'Acompañamiento del perito a la audiencia de contradicción',
];
