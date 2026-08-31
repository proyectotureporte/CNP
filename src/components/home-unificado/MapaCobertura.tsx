/**
 * El mapa de cobertura.
 *
 * ── De dónde salió el contorno ──
 * Del conjunto `ne_110m_admin_0_countries` de **Natural Earth**, que es de
 * DOMINIO PÚBLICO: no exige permiso ni atribución, y por eso se eligió esa
 * fuente y no un SVG suelto de internet, que casi siempre arrastra una licencia
 * que nadie leyó. Los grados se proyectaron a coordenadas de SVG con una
 * equirectangular corregida por el coseno de la latitud media (Colombia va de
 * -4° a 13°, donde Mercator apenas se distingue). El script está en el
 * scratchpad de la sesión; el resultado se pegó aquí para no arrastrar ninguna
 * dependencia ni pedir un archivo más al navegador.
 *
 * La resolución de 110 m es deliberadamente gruesa: son 1.124 caracteres de
 * path y el dibujo se lee limpio a 260 px. Una resolución fina pesaría más y a
 * este tamaño no se notaría.
 *
 * ── Qué se marca y qué no ──
 * SOLO Cali (3.4516 N, 76.5320 O), que es la única sede real de CNP y la única
 * dirección publicada hoy en los dos sitios. Poner más puntos sugeriría
 * oficinas que no existen — que es exactamente el tipo de mentira que una firma
 * pericial no puede permitirse. Lo que el mapa dice es lo contrario y es lo que
 * de verdad la distingue: una sola sede, y el dictamen viaja al juzgado donde
 * esté el proceso.
 *
 * La retícula de puntos que rellena el país no es decorado: es la cobertura.
 * Está recortada por el propio contorno con un `clipPath`.
 *
 * ── Dos reglas que salieron de mirar cómo lo hacen otros ──
 * 1. El color NO va en atributos `fill` del SVG sino en CSS, para que el mapa
 *    herede la paleta del sitio. Es como lo resuelve SURA; Envista lo hace al
 *    revés y tiene reglas rotas que nadie notó (un `.ocenia-link` mal escrito
 *    deja Oceanía sin colorear).
 * 2. El rótulo de la ciudad NO va dentro del SVG. Un texto en unidades de
 *    viewBox se encoge con el dibujo y a 220 px queda ilegible; el pie va en
 *    HTML, al lado, donde escala como el resto de la tipografía.
 *
 * Peso: 1,1 KB de path. El mapamundi que Envista incrusta pesa 309 KB y es el
 * 70% de su página — la razón de usar resolución gruesa y un solo país.
 */

const COLOMBIA =
  'M722.1 668.3L710.8 675.6L699.2 640.4L682.6 621.4L662.9 642L546.8 640.7L547.5 678.1L582.5 684.3L580.4 707.2L568.5 701L535 710.8L534.7 754.2L561.1 776L570.4 810.2L569 836.2L542.2 1000L512.4 968.2L494.6 966.8L533 906L487.4 878L451.6 883.2L430.1 872.8L397.3 888.6L352.9 881.1L317.8 818.5L290.2 803.1L271.2 774.9L231.5 746.6L215.6 752.3L190.1 738.1L160.8 718.3L143.9 727.8L93.3 719.5L78.8 693.8L67.7 694.8L8.1 660.7L0 642.1L22.2 637.6L19.6 607.7L33.6 586L63.1 582L88.2 544.5L111.1 513.1L89.1 498.9L100.3 464.2L86.9 409.6L99.7 393.9L90.3 343.4L66.1 311.5L73.8 282.5L93 286.8L104.2 269L90.4 233.8L97.6 225.1L128.4 227L173.1 185.3L197.7 178.9L198.3 159.1L209.2 108.7L243.4 80.9L281 79.8L285.7 67.3L332.4 72.3L379.3 42.1L402.5 28.8L431.3 0L452.5 3.7L468.1 19.4L456.5 39.5L418.2 49.5L403.1 79.4L380 96.5L362.7 118.7L355.4 161.4L338.9 196.3L369.7 200.3L377.3 227.8L390.5 240.9L395.2 265L388.1 287.1L390.2 299.6L404.9 304.6L419.1 325.4L495.7 319.7L530.3 327.3L572.3 378.7L596.4 372.3L639.3 375.5L673.3 368.7L694.3 378.9L683.6 411.1L670.3 431.2L665.6 474L677.6 513.7L694.6 531.5L696.6 544.9L666.4 574.6L688 587.8L703.9 608.7L722.1 668.3Z';

/** Cali, proyectada con la misma transformación que el contorno. */
const CALI = { x: 146.6, y: 536.9 };

export function MapaCobertura() {
  return (
    <svg
      className="mapa"
      viewBox="0 0 722 1000"
      role="img"
      aria-label="Mapa de Colombia con la sede de CNP marcada en Cali. La cobertura es nacional."
    >
      <defs>
        <clipPath id="mapa-recorte">
          <path d={COLOMBIA} />
        </clipPath>
        <pattern id="mapa-trama" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="13" cy="13" r="2.6" fill="currentColor" opacity="0.5" />
        </pattern>
        {/*
          El halo dorado nace en Cali y se abre a todo el país: es la idea de la
          sección dibujada — una sede, alcance nacional.
        */}
        <radialGradient id="mapa-halo" cx="20%" cy="54%" r="78%">
          <stop offset="0%" stopColor="#c9a84c" stopOpacity="0.34" />
          <stop offset="55%" stopColor="#7eb8f7" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#7eb8f7" stopOpacity="0.02" />
        </radialGradient>
      </defs>

      <g className="mapa__pais">
        <path className="mapa__relleno" d={COLOMBIA} />
        <rect className="mapa__trama" x="0" y="0" width="722" height="1000" fill="url(#mapa-trama)" clipPath="url(#mapa-recorte)" />
        <rect x="0" y="0" width="722" height="1000" fill="url(#mapa-halo)" clipPath="url(#mapa-recorte)" />
        <path className="mapa__borde" d={COLOMBIA} />
      </g>

      <g className="mapa__sede">
        {/* Dos anillos desfasados: laten hacia afuera desde la sede. */}
        <circle className="mapa__pulso" cx={CALI.x} cy={CALI.y} r="16" />
        <circle className="mapa__pulso mapa__pulso--dos" cx={CALI.x} cy={CALI.y} r="16" />
        <circle className="mapa__punto" cx={CALI.x} cy={CALI.y} r="11" />
      </g>
    </svg>
  );
}
