/**
 * Sección "Cómo se sostiene" — reemplaza al filtro de siete pestañas.
 *
 * El filtro le preguntaba al visitante lo mismo que ya le preguntó el
 * calificador del hero. Esta sección hace lo contrario: responde. Muestra por
 * qué el dictamen aguanta la contradicción y qué trae adentro.
 *
 * Todo el contenido sale de lo que CNP ya publica —sus tres valores de
 * metodología y su proceso de cinco pasos—, así que no hay nada inventado ni
 * nada que choque con la confidencialidad de un expediente.
 */

export interface Pilar {
  readonly numero: string;
  readonly titulo: string;
  readonly texto: string;
}

export interface ParteDelDictamen {
  readonly numero: string;
  readonly parte: string;
  readonly detalle: string;
  /** Marca lo que aún no se puede afirmar sin verificarlo con jurídico. */
  readonly pendiente?: string;
}

export interface PasoProceso {
  readonly titulo: string;
  readonly texto: string;
}

export const pilares: readonly Pilar[] = [
  {
    numero: '01',
    titulo: 'El método va antes que la conclusión',
    texto:
      'Cada dictamen declara con qué método se hizo antes de decir qué concluyó. Análisis basados en procedimientos estandarizados y verificables, no en criterio suelto.',
  },
  {
    numero: '02',
    titulo: 'El alcance se fija antes de empezar',
    texto:
      'Explicamos qué se hará, cómo y el plazo de entrega, por escrito, antes de tocar el primer documento. Lo que no está en el alcance no aparece después como sorpresa.',
  },
  {
    numero: '03',
    titulo: 'Cada dato se puede rastrear',
    texto:
      'Los anexos van con los cálculos abiertos, no solo con el resultado. Si la contraparte quiere rehacer la operación, tiene con qué — y esa es justamente la idea.',
  },
  {
    numero: '04',
    titulo: 'Quien firma es quien sustenta',
    texto:
      'El perito que firma el dictamen es el que va a la audiencia de contradicción. No se delega la defensa de lo que uno escribió.',
  },
];

export const anatomia: readonly ParteDelDictamen[] = [
  { numero: '01', parte: 'Objeto del dictamen', detalle: 'Qué se pregunta, en los términos del proceso' },
  { numero: '02', parte: 'Metodología aplicada', detalle: 'Procedimiento, supuestos y sus límites' },
  { numero: '03', parte: 'Documentos examinados', detalle: 'Inventario de lo que se tuvo a la vista' },
  { numero: '04', parte: 'Cálculos y anexos', detalle: 'La operación completa, no solo la cifra' },
  { numero: '05', parte: 'Conclusiones', detalle: 'Respuesta directa al objeto, sin ambigüedades' },
  {
    numero: '06',
    parte: 'Firma y credenciales del perito',
    detalle: 'Tarjeta profesional vigente y trayectoria',
  },
];

export const proceso: readonly PasoProceso[] = [
  { titulo: 'Recibimos el caso', texto: 'Contexto, etapa procesal y objetivo probatorio.' },
  { titulo: 'Evaluamos la necesidad', texto: 'Si conviene un peritaje, una revisión o una valoración.' },
  { titulo: 'Fijamos alcance y plazo', texto: 'Qué se hará, cómo y para cuándo. Por escrito.' },
  { titulo: 'Hacemos el análisis', texto: 'Con la metodología ya declarada al cliente.' },
  { titulo: 'Entregamos y sustentamos', texto: 'Conclusiones rastreables, y el perito a la audiencia.' },
];
