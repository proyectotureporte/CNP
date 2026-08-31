/**
 * Tipos del contenido del sitio.
 *
 * Todo el texto vive en `content/` como datos tipados, no dentro de los
 * componentes. Cambiar una palabra del sitio no debería obligar a tocar JSX.
 *
 * El campo `pendiente` marca lo que todavía no se puede afirmar: se pinta como
 * una etiqueta amarilla en pantalla para que nadie publique un dato inventado.
 * Cuando llegue el dato real, se reemplaza por texto y se borra el `pendiente`.
 */

export interface Enunciado {
  /** Etiqueta pequeña sobre la cita. Ej.: "Lo que viene a resolver". */
  readonly eyebrow: string;
  /** El trabajo, en primera persona y en palabras del cliente. */
  readonly texto: string;
}

export interface Servicio {
  readonly titulo: string;
  readonly descripcion: string;
}

export interface Paso {
  readonly titulo: string;
  readonly descripcion: string;
  readonly pendiente?: string;
}

export interface ItemLista {
  /** Texto del ítem. Si hay `destacado`, este va después, como continuación. */
  readonly texto: string;
  /** Palabra o frase en negrita al inicio del ítem. */
  readonly destacado?: string;
}

export interface Faq {
  readonly pregunta: string;
  readonly respuesta?: string;
  readonly pendiente?: string;
}

/** El cuerpo de cada pestaña cambia de forma según lo que tenga que mostrar. */
export type CuerpoPerfil =
  | { readonly clase: 'servicios'; readonly servicios: readonly Servicio[] }
  | { readonly clase: 'pasos'; readonly pasos: readonly Paso[] }
  | { readonly clase: 'texto'; readonly parrafos: readonly string[] };

export interface EnlaceAccion {
  readonly texto: string;
  readonly href: string;
}

export interface LateralPerfil {
  readonly titulo: string;
  readonly items: readonly ItemLista[];
  readonly nota?: string;
  readonly cta?: EnlaceAccion;
}

export interface Imagen {
  /** Ruta bajo /public. */
  readonly src: string;
  /** Describe la escena. Nunca vacío ni decorativo: estas fotos comunican. */
  readonly alt: string;
  readonly ancho: number;
  readonly alto: number;
  /**
   * `object-position` para esta foto. La caja del panel es 4:3 y recorta; en
   * una foto vertical el centro no siempre es lo que hay que conservar.
   * Ej.: 'center 38%' sube el recorte para no cortarle el frontón al juzgado.
   */
  readonly posicion?: string;
}

export interface Perfil {
  /** Usado en el id del panel y en el ancla. Sin espacios ni tildes. */
  readonly id: string;
  /** Etiqueta visible de la pestaña. */
  readonly pestana: string;
  readonly enunciado: Enunciado;
  readonly cuerpo: CuerpoPerfil;
  readonly lateral: LateralPerfil;
  readonly imagen: Imagen;
  readonly faqs?: readonly Faq[];
}

export interface Cliente {
  /** Nombre real. Va al `alt`: nunca "LOGON", que es lo que hay publicado hoy. */
  readonly nombre: string;
  /**
   * Ramo del cliente, no el litigio. Se muestra sobre el logo para que el
   * visitante se reconozca en el sector; decir en qué proceso se trabajó para
   * un cliente con nombre propio sería un problema de confidencialidad.
   */
  readonly sector: string;
  /** Ruta bajo /public. */
  readonly logo: string;
  readonly ancho: number;
  readonly alto: number;
}

/**
 * Qué clase de encargo fue. Es unión cerrada a propósito: agregar un caso con
 * un tipo que no existe no compila, y el conteo del titular se deriva de aquí.
 */
export type TipoCaso = 'contradiccion' | 'verificacion' | 'cuantificacion';

export interface Caso {
  /**
   * Número en el brochure de la casa (04-12). Ya NO se muestra en pantalla
   * ("CNP-04" leía como una referencia interna, no algo para el cliente) —
   * solo sirve de key estable en el listado. La numeración salteada sigue
   * siendo la prueba, para nosotros, de que esto es una muestra y no el
   * inventario completo; solo dejó de ser una prueba que el lector ve.
   */
  readonly folio: string;
  /** Las partes tal como van en el proceso. Es registro público. */
  readonly partes: string;
  readonly tipo: TipoCaso;
  /** El objeto del dictamen: qué le pidieron a la casa. */
  readonly objeto: string;
  readonly fecha?: string;
  /** El despacho. Es la prueba más fuerte de la ficha y es registro público. */
  readonly despacho?: string;
  /**
   * El número de radicación de 23 dígitos, VERIFICADO uno por uno contra la
   * API pública de la Rama Judicial (NombreRazonSocial cruzado con las partes,
   * el despacho y la fecha del brochure) — no viene del material de la casa.
   * Solo se puso cuando el cruce fue seguro; donde no hubo match confiable, se
   * dejó sin radicado en vez de forzar uno.
   */
  readonly radicado?: string;
  /**
   * Cuando el radicado no es del proceso descrito sino de una actuación
   * posterior ligada a él (ej.: el arbitraje es privado y no tiene radicado
   * propio, pero el recurso de anulación del laudo sí lo tiene, ante un
   * tribunal público). Sin esto, mostrar el radicado solo sería confuso —
   * alguien podría buscarlo esperando encontrar el arbitraje mismo.
   */
  readonly radicadoNota?: string;
  /**
   * La instancia más alta que alcanzó el proceso, cuando se verificó una
   * segunda instancia o casación ligada al mismo radicado. Es la prueba de que
   * el caso se litigó a fondo.
   */
  readonly instancia?: string;
  /**
   * Un dato corto que distingue al caso, cuando lo hay: que tuvo resultado
   * declarado, que el perito fue designado por el tribunal y no por una
   * parte, etc. Se muestra junto al nombre de las partes.
   */
  readonly insignia?: string;
  /**
   * Quien remitió el caso. El tratamiento viaja con el dato porque hay
   * abogados y abogadas: fijarlo en el componente escribe mal un nombre real.
   *
   * PENDIENTE de permiso: un brochure va a un destinatario concreto, una web
   * pública va a cualquiera.
   */
  readonly abogado?: { readonly titulo: string; readonly nombre: string };
  /** De qué lado actuó la casa, cuando está declarado. */
  readonly lado?: string;
  /** Quién contrató, cuando no coincide con las partes del proceso. */
  readonly cliente?: string;
  /**
   * Solo cuando está declarado. Hoy hay UNO en todo el material de la casa, y
   * no dice que se ganó: dice que se concilió. No se inventa ninguno más — sin
   * el denominador (cuántos dictámenes fueron acogidos y cuántos rebatidos) no
   * se puede afirmar nada sobre resultados.
   */
  readonly resultado?: string;
}



/**
 * Clave del ícono. Es una unión cerrada a propósito: si se agrega una
 * disciplina y se olvida su ícono, el compilador lo detiene. El dibujo del
 * ícono vive en el componente, no aquí — el contenido dice cuál, no cómo.
 */
export type IconoDisciplina =
  | 'finanzas'
  | 'medicina'
  | 'ingenieria'
  | 'informatica'
  | 'grafologia'
  | 'industria';

export interface Disciplina {
  readonly nombre: string;
  readonly alcance: string;
  readonly icono: IconoDisciplina;
  /** La disciplina histórica de CNP se destaca dentro de la red. */
  readonly principal?: boolean;
}

export interface DatoContacto {
  readonly titulo: string;
  readonly valor: string;
  readonly nota?: string;
}

export interface EnlaceNav {
  readonly texto: string;
  readonly href: string;
}

export interface ColumnaPie {
  readonly titulo: string;
  readonly enlaces: readonly EnlaceNav[];
}
