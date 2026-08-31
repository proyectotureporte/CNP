/**
 * Quiénes somos.
 *
 * ── Por qué se reescribió ──
 * La sección tenía cinco valores: Precisión, Puntualidad, Independencia,
 * Claridad probatoria y Rigor. Al revisar cómo lo resuelven las firmas
 * periciales grandes salió que esos son, casi palabra por palabra, los mismos
 * de Exponent ("Excellence / Objectivity / Respect & Care") y los de Envista
 * ("Integrity and fairness / Mutual respect / Collaboration"). Es la fórmula
 * del sector: por eso no dice nada. Un adjetivo que cualquier competidor puede
 * copiar sin mentir no es un argumento.
 *
 * Lo que sí distingue, y lo que hacen las pocas firmas que se salen de la
 * fórmula, es cambiar el adjetivo por un HECHO comprobable — Kroll no dice
 * "somos independientes", dice que no tiene práctica de auditoría ni de
 * impuestos; Bartlit Beck no dice "somos eficientes", dice que no factura por
 * horas.
 *
 * ── De dónde salió cada punto de aquí ──
 * NINGUNO es nuevo. Los cinco ya estaban publicados en el sitio, enterrados
 * como viñeta de una pestaña o como respuesta de un FAQ. Lo que cambia es que
 * suben a ser el argumento:
 *
 *   01 · del diagnóstico previo de la etapa "antes de demandar" y del FAQ
 *        "¿Sirve antes de demandar?"
 *   02 · de "Independencia declarada: el hallazgo no cambia según quién
 *        contrate", que era la cuarta viñeta del perfil de empresa
 *   03 · del compromiso 03 del hero y del FAQ "¿El perito asiste a la
 *        audiencia?"
 *   04 · del compromiso 02 del hero y del FAQ "¿Cuánto tarda un dictamen?"
 *   05 · del compromiso 01 del hero y de los requisitos del perito
 *
 * ── La advertencia ──
 * El patrón del "principio incómodo" solo funciona si se nombra la cosa
 * concreta. Las firmas que dicen "rechazamos el trabajo que no debemos tomar"
 * sin decir cuál no convencen a nadie. Por eso el 01 dice exactamente qué se
 * está dispuesto a perder. Si algún día deja de ser verdad, hay que borrarlo,
 * no suavizarlo.
 */

export interface Principio {
  readonly titulo: string;
  readonly texto: string;
  readonly pendiente?: string;
}

export const nosotros = {
  eyebrow: 'Quiénes somos',
  /**
   * El enunciado anterior —"Contribuimos a que las decisiones jurídicas se
   * fundamenten en análisis técnico sólido, evidencia confiable y rigor
   * profesional"— describe a cualquier firma pericial del mundo. Este dice una
   * cosa que un competidor tendría que pensar dos veces antes de copiar.
   */
  titular: 'No defendemos su posición.',
  titularDestacado: 'Defendemos el método.',
  entrada:
    'Un dictamen que se acomoda al cliente se cae en la primera contradicción. El nuestro tiene que sostenerse solo — y por eso lo escribimos como si la contraparte ya lo estuviera leyendo.',
  rotuloPrincipios: 'Cinco cosas que preferimos dejar por escrito',
} as const;

export const principios: readonly Principio[] = [
  {
    titulo: 'Le podemos decir que no necesita un dictamen.',
    texto:
      'El diagnóstico previo existe para eso: dice si el peritaje conviene antes de que usted lo contrate. Cobrar un dictamen que no iba a servir es la forma más rápida de perder al abogado que lo recomendó.',
  },
  {
    titulo: 'El hallazgo no cambia según quién contrate.',
    texto:
      'Es la única razón por la que un dictamen sirve de algo. Un perito que ajusta la conclusión a quien le paga no le da a usted una ventaja: le da un flanco.',
  },
  {
    titulo: 'El perito que firma es el que sustenta.',
    texto:
      'El acompañamiento a la audiencia de contradicción es parte del encargo, no un cobro aparte. Quien hizo el análisis es quien lo defiende delante del juez.',
  },
  {
    titulo: 'El alcance y la fecha se pactan antes de empezar.',
    texto:
      'Por escrito, en la propuesta, antes de tocar el expediente. Un peritaje que llega tarde a la audiencia no llega.',
  },
  {
    titulo: 'Tarjeta profesional vigente, disciplina por disciplina.',
    texto:
      'Lo exige el art. 226 del CGP y es lo primero que mira la contraparte. La red PERITUS la verifica antes de asignar el caso.',
  },
];

/**
 * La ficha: lo que la firma es, en datos y no en adjetivos.
 *
 * Los dos párrafos largos que había antes decían esto mismo en 90 palabras.
 * Quien llega a esta sección ya sabe qué hace CNP —lo leyó cuatro secciones
 * antes—; lo que le falta es el tamaño y la forma.
 */
export const ficha = {
  rotulo: 'La firma',
  descripcion:
    'Centro Nacional de Pruebas rinde dictámenes periciales y valoraciones técnicas de prueba para abogados, firmas, empresas y despachos judiciales.',
  datos: [
    { valor: '+10', etiqueta: 'años rindiendo dictámenes' },
    { valor: '6', etiqueta: 'disciplinas periciales' },
    { valor: '1', etiqueta: 'sede, en Cali' },
  ],
} as const;
