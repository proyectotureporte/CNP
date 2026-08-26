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
  /** Ruta bajo /public. */
  readonly logo: string;
  readonly ancho: number;
  readonly alto: number;
}

export interface Caso {
  readonly cliente: string;
  readonly titulo: string;
  readonly problema: string;
  readonly hicimos: string;
  readonly resultado?: string;
  /** Se usa cuando el resultado todavía no está redactado. */
  readonly pendienteResultado?: string;
  readonly abiertoPorDefecto?: boolean;
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
