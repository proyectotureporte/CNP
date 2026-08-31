import type { Disciplina } from '@/lib/content/home-unificado/types';

/**
 * Las seis disciplinas verificadas en peritus.com.co el 20-ago-2026.
 *
 * Esta banda es la fusión hecha visible: hoy, quien entra por cnp.com.co solo
 * ve la especialidad financiera y nunca se entera de las otras cinco.
 */
export const disciplinas: readonly Disciplina[] = [
  { nombre: 'Finanzas', alcance: 'Perjuicios, liquidaciones, contabilidad', icono: 'finanzas', principal: true },
  { nombre: 'Medicina', alcance: 'Valoración médico-legal', icono: 'medicina' },
  { nombre: 'Ingeniería', alcance: 'Obra, estructuras, avalúos', icono: 'ingenieria' },
  { nombre: 'Informática', alcance: 'Evidencia digital y sistemas', icono: 'informatica' },
  { nombre: 'Grafología', alcance: 'Documentoscopia y firmas', icono: 'grafologia' },
  { nombre: 'Industria', alcance: 'Procesos y maquinaria', icono: 'industria' },
];

export const redPeritus = {
  titulo: 'La red de peritos de CNP.',
  texto:
    'Seis disciplinas, un solo equipo y un solo estándar metodológico. Cuando el caso no es financiero, el dictamen lo firma un perito de la red — validado, con tarjeta profesional vigente y con el mismo formato de entrega.',
} as const;

/**
 * El filtro de admisión.
 *
 * ── Por qué se reescribió ──
 * La banda de PERITUS terminaba en "Trabaja con nosotros": cita del perito,
 * lista de requisitos y un botón. Leído por un perito, funciona. Leído por un
 * ABOGADO —que es quien de verdad paga— se lee como aviso clasificado, y de ahí
 * sale exactamente la conclusión contraria a la que conviene: que a esta red
 * entra cualquiera.
 *
 * Son los MISMOS cuatro requisitos. Lo único que cambia es de quién es la
 * acción: ya no es la lista que el candidato llena, es el filtro que el perito
 * pasó antes de firmar. Al abogado eso le dice quién sustenta su dictamen; al
 * perito le dice que pertenecer significa algo. Un mismo bloque, dos lecturas.
 *
 * ── El titular ──
 * Sale del art. 226 del CGP, que obliga al perito a declarar su idoneidad y su
 * experiencia: es lo primero que la contraparte revisa para pedir que el
 * dictamen no se aprecie. Decirle al abogado que esa revisión ya está hecha es
 * el argumento más útil que la red tiene, y hoy no estaba escrito en ninguna
 * parte del sitio.
 *
 * NADA de aquí es nuevo. Los cuatro puntos son los requisitos ya publicados y
 * el paso "Validamos disciplina y documentación" del flujo del perito. No hay
 * tasa de rechazo ni número de postulantes ni comité de admisión, porque nadie
 * ha medido eso — y una firma pericial es el peor sitio del mundo para
 * inventarse una cifra.
 */
export const admision = {
  eyebrow: 'Quién firma su dictamen',
  titulo: 'Lo que la contraparte va a revisar,',
  tituloDestacado: 'ya lo revisamos nosotros.',
  texto:
    'El art. 226 del CGP obliga al perito a declarar su idoneidad, y es lo primero que ataca quien quiere que el dictamen no se aprecie. Ningún perito entra a la red sin que eso esté verificado y al día.',
  rotulo: 'Lo que se verifica antes del primer caso',
  filtros: [
    {
      titulo: 'Tarjeta profesional vigente',
      texto: 'De la disciplina en la que va a dictaminar, no de una parecida. Se comprueba antes de asignarle el primer caso.',
    },
    {
      titulo: 'Trayectoria pericial o técnica',
      texto: 'El título solo dice que estudió. Lo que se revisa es si ya hizo este trabajo.',
    },
    {
      titulo: 'Disciplina clasificada',
      texto: 'Queda clasificado en una de las seis y no recibe casos fuera de ella. Un perito que acepta lo que no es suyo se cae en la contradicción.',
    },
    {
      titulo: 'Disponibilidad declarada',
      texto: 'El perito dice cuándo puede, y lo actualiza él mismo. Un encargo aceptado sin tiempo real es un dictamen que llega tarde a la audiencia.',
    },
  ],
  /** El membrete del esquema. No es una credencial real: es un esquema. */
  sello: {
    membrete: 'Verificación de admisión',
    campos: ['Disciplina', 'Tarjeta profesional', 'Trayectoria'],
    marca: 'Verificado',
    norma: 'Art. 226 CGP',
  },
} as const;
